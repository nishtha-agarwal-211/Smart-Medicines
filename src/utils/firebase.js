/**
 * Firebase Configuration & Initialization
 * ─────────────────────────────────────────
 * Initializes Firebase Auth and Cloud Firestore.
 * If VITE_FIREBASE_* env vars are not set, the app
 * falls back to localStorage-only mode.
 */

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  browserLocalPersistence,
  setPersistence,
} from 'firebase/auth';
import {
  getFirestore,
  enableIndexedDbPersistence,
} from 'firebase/firestore';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/**
 * Check if Firebase is properly configured.
 * Returns false if any required key is missing or placeholder.
 */
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== 'your_firebase_api_key_here' &&
  firebaseConfig.projectId &&
  firebaseConfig.projectId !== 'your_project_id_here'
);

let app = null;
let auth = null;
let db = null;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);

    // Persist auth state across browser sessions
    setPersistence(auth, browserLocalPersistence).catch((err) => {
      console.warn('Firebase: Could not set auth persistence:', err.message);
    });

    // Enable offline Firestore persistence (IndexedDB cache)
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('Firestore offline persistence failed: multiple tabs open');
      } else if (err.code === 'unimplemented') {
        console.warn('Firestore offline persistence not supported in this browser');
      }
    });

    console.log('✅ Firebase initialized successfully');
  } catch (error) {
    console.error('Firebase initialization error:', error);
  }
} else {
  console.warn(
    '⚠️ Firebase not configured. Running in localStorage-only mode.\n' +
    'Add VITE_FIREBASE_* keys to your .env file to enable cloud features.'
  );
}

export { app, auth, db };
