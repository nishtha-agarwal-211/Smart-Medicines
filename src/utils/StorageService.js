/**
 * StorageService — Centralized Data Layer
 * ─────────────────────────────────────────
 * Wraps Cloud Firestore for authenticated users.
 * Falls back to namespaced localStorage when Firebase
 * is not configured (offline / dev mode).
 *
 * Firestore structure:
 *   users/{userId}/medications/{docId}
 *   users/{userId}/adherenceLogs/{docId}
 *   users/{userId}/profile       (single doc)
 *   users/{userId}/emergencyProfile (single doc)
 *   users/{userId}/settings      (single doc)
 */

import { db, isFirebaseConfigured } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';

// ─── Firestore helpers ───────────────────────────────────

function userDocRef(userId, path) {
  return doc(db, 'users', userId, ...path.split('/'));
}

function userCollectionRef(userId, collectionName) {
  return collection(db, 'users', userId, collectionName);
}

// ─── Public API ──────────────────────────────────────────

const StorageService = {
  /**
   * Get a single document (profile, emergencyProfile, settings).
   * Returns the document data or null.
   */
  async getDocument(userId, path) {
    if (!isFirebaseConfigured) {
      return LocalStorage.get(`sm_${userId}_${path.replace(/\//g, '_')}`);
    }
    try {
      const snap = await getDoc(userDocRef(userId, path));
      return snap.exists() ? snap.data() : null;
    } catch (err) {
      console.error(`StorageService.getDocument(${path}):`, err);
      return null;
    }
  },

  /**
   * Set / overwrite a single document.
   */
  async setDocument(userId, path, data) {
    if (!isFirebaseConfigured) {
      LocalStorage.set(`sm_${userId}_${path.replace(/\//g, '_')}`, data);
      return;
    }
    try {
      await setDoc(userDocRef(userId, path), {
        ...data,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (err) {
      console.error(`StorageService.setDocument(${path}):`, err);
    }
  },

  /**
   * Get all documents in a collection (medications, adherenceLogs).
   * Returns an array of { id, ...data } objects.
   */
  async getCollection(userId, collectionName) {
    if (!isFirebaseConfigured) {
      return LocalStorage.get(`sm_${userId}_${collectionName}`) || [];
    }
    try {
      const ref = userCollectionRef(userId, collectionName);
      const snap = await getDocs(ref);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (err) {
      console.error(`StorageService.getCollection(${collectionName}):`, err);
      return [];
    }
  },

  /**
   * Add a new document to a collection.
   * Returns the document with its generated id.
   */
  async addToCollection(userId, collectionName, data) {
    if (!isFirebaseConfigured) {
      const id = `id_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const item = { ...data, id };
      const existing = LocalStorage.get(`sm_${userId}_${collectionName}`) || [];
      LocalStorage.set(`sm_${userId}_${collectionName}`, [...existing, item]);
      return item;
    }
    try {
      const ref = userCollectionRef(userId, collectionName);
      const docRef = await addDoc(ref, {
        ...data,
        createdAt: serverTimestamp(),
      });
      return { id: docRef.id, ...data };
    } catch (err) {
      console.error(`StorageService.addToCollection(${collectionName}):`, err);
      return { ...data, id: `local_${Date.now()}` };
    }
  },

  /**
   * Update a document in a collection by id.
   */
  async updateInCollection(userId, collectionName, docId, updates) {
    if (!isFirebaseConfigured) {
      const items = LocalStorage.get(`sm_${userId}_${collectionName}`) || [];
      const updated = items.map((item) =>
        item.id === docId ? { ...item, ...updates } : item
      );
      LocalStorage.set(`sm_${userId}_${collectionName}`, updated);
      return;
    }
    try {
      const ref = doc(db, 'users', userId, collectionName, docId);
      await updateDoc(ref, { ...updates, updatedAt: serverTimestamp() });
    } catch (err) {
      console.error(`StorageService.updateInCollection(${collectionName}, ${docId}):`, err);
    }
  },

  /**
   * Delete a document from a collection by id.
   */
  async deleteFromCollection(userId, collectionName, docId) {
    if (!isFirebaseConfigured) {
      const items = LocalStorage.get(`sm_${userId}_${collectionName}`) || [];
      LocalStorage.set(
        `sm_${userId}_${collectionName}`,
        items.filter((item) => item.id !== docId)
      );
      return;
    }
    try {
      const ref = doc(db, 'users', userId, collectionName, docId);
      await deleteDoc(ref);
    } catch (err) {
      console.error(`StorageService.deleteFromCollection(${collectionName}, ${docId}):`, err);
    }
  },

  /**
   * Subscribe to real-time updates on a collection.
   * Returns an unsubscribe function.
   */
  subscribeToCollection(userId, collectionName, callback) {
    if (!isFirebaseConfigured) {
      // No real-time in localStorage mode; call once with current data
      const data = LocalStorage.get(`sm_${userId}_${collectionName}`) || [];
      callback(data);
      return () => {};
    }
    try {
      const ref = userCollectionRef(userId, collectionName);
      return onSnapshot(ref, (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        callback(items);
      }, (err) => {
        console.error(`StorageService.subscribe(${collectionName}):`, err);
      });
    } catch (err) {
      console.error(`StorageService.subscribeToCollection(${collectionName}):`, err);
      return () => {};
    }
  },

  /**
   * Subscribe to real-time updates on a single document.
   * Returns an unsubscribe function.
   */
  subscribeToDocument(userId, path, callback) {
    if (!isFirebaseConfigured) {
      const data = LocalStorage.get(`sm_${userId}_${path.replace(/\//g, '_')}`);
      callback(data);
      return () => {};
    }
    try {
      const ref = userDocRef(userId, path);
      return onSnapshot(ref, (snap) => {
        callback(snap.exists() ? snap.data() : null);
      }, (err) => {
        console.error(`StorageService.subscribeToDocument(${path}):`, err);
      });
    } catch (err) {
      console.error(`StorageService.subscribeToDocument(${path}):`, err);
      return () => {};
    }
  },

  /**
   * Migrate existing localStorage data into Firestore for the given user.
   * Called once after first login. Non-destructive — only copies if
   * Firestore is empty and localStorage has data.
   */
  async migrateFromLocalStorage(userId) {
    if (!isFirebaseConfigured) return;

    try {
      // Check if user already has data in Firestore
      const existingMeds = await getDocs(userCollectionRef(userId, 'medications'));
      if (!existingMeds.empty) {
        console.log('Migration skipped: user already has Firestore data');
        return;
      }

      const batch = writeBatch(db);
      let migrated = 0;

      // Migrate medications
      const meds = JSON.parse(localStorage.getItem('medications') || '[]');
      meds.forEach((med) => {
        const ref = doc(collection(db, 'users', userId, 'medications'));
        batch.set(ref, { ...med, migratedFromLocal: true });
        migrated++;
      });

      // Migrate adherence logs
      const logs = JSON.parse(localStorage.getItem('adherenceLogs') || '[]');
      logs.forEach((log) => {
        const ref = doc(collection(db, 'users', userId, 'adherenceLogs'));
        batch.set(ref, { ...log, migratedFromLocal: true });
        migrated++;
      });

      // Migrate user profile
      const profile = JSON.parse(localStorage.getItem('userProfile') || 'null');
      if (profile) {
        batch.set(doc(db, 'users', userId, 'profile', 'main'), {
          ...profile,
          migratedFromLocal: true,
        });
        migrated++;
      }

      // Migrate emergency profile
      const emergency = JSON.parse(localStorage.getItem('emergencyProfile') || 'null');
      if (emergency) {
        batch.set(doc(db, 'users', userId, 'emergencyProfile', 'main'), {
          ...emergency,
          migratedFromLocal: true,
        });
        migrated++;
      }

      if (migrated > 0) {
        await batch.commit();
        console.log(`✅ Migrated ${migrated} items from localStorage to Firestore`);
      }
    } catch (err) {
      console.error('Migration error:', err);
    }
  },

  /**
   * Export all user data as a JSON object (for data portability).
   */
  async exportAllData(userId) {
    const [medications, adherenceLogs, profile, emergencyProfile] = await Promise.all([
      this.getCollection(userId, 'medications'),
      this.getCollection(userId, 'adherenceLogs'),
      this.getDocument(userId, 'profile/main'),
      this.getDocument(userId, 'emergencyProfile/main'),
    ]);

    return {
      exportedAt: new Date().toISOString(),
      medications,
      adherenceLogs,
      profile,
      emergencyProfile,
    };
  },
};

// ─── localStorage fallback layer ─────────────────────────

const LocalStorage = {
  get(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.warn('LocalStorage.set failed:', err);
    }
  },
  remove(key) {
    localStorage.removeItem(key);
  },
};

export default StorageService;
