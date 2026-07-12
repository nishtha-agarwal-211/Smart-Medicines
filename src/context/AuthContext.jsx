/**
 * AuthContext — Firebase Authentication Provider
 * ────────────────────────────────────────────────
 * Provides login, register, Google sign-in, logout,
 * and password reset via Firebase Auth.
 * Falls back to localStorage-based auth when Firebase
 * is not configured.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, isFirebaseConfigured } from '../utils/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import StorageService from '../utils/StorageService';

const AuthContext = createContext();

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ── Firebase Auth State Listener ─────────────────────
  useEffect(() => {
    if (!isFirebaseConfigured) {
      // Fallback: check localStorage session
      try {
        const session = JSON.parse(localStorage.getItem('sm_session') || 'null');
        if (session) setCurrentUser(session);
      } catch { /* empty */ }
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
        };
        setCurrentUser(userData);

        // Migrate localStorage data on first sign-in
        await StorageService.migrateFromLocalStorage(user.uid);
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ── Register with Email/Password ─────────────────────
  async function register(email, password, displayName) {
    setError('');
    if (!isFirebaseConfigured) {
      return localRegister(email, password, displayName);
    }
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName });

      // Initialize user profile in Firestore
      await StorageService.setDocument(cred.user.uid, 'profile/main', {
        name: displayName,
        email,
        age: '',
        dob: '',
        bloodType: '',
        gender: '',
        phone: '',
        emergencyNote: '',
        caregiverName: '',
        caregiverEmail: '',
        caregiverPhone: '',
      });

      return cred.user;
    } catch (err) {
      const msg = mapFirebaseError(err.code);
      setError(msg);
      throw new Error(msg);
    }
  }

  // ── Login with Email/Password ────────────────────────
  async function login(email, password) {
    setError('');
    if (!isFirebaseConfigured) {
      return localLogin(email, password);
    }
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      return cred.user;
    } catch (err) {
      const msg = mapFirebaseError(err.code);
      setError(msg);
      throw new Error(msg);
    }
  }

  // ── Google Sign-In ───────────────────────────────────
  async function loginWithGoogle() {
    setError('');
    if (!isFirebaseConfigured) {
      setError('Google Sign-In requires Firebase configuration.');
      throw new Error('Google Sign-In requires Firebase configuration.');
    }
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);

      // Initialize profile if first time
      const existing = await StorageService.getDocument(cred.user.uid, 'profile/main');
      if (!existing) {
        await StorageService.setDocument(cred.user.uid, 'profile/main', {
          name: cred.user.displayName || '',
          email: cred.user.email || '',
          age: '',
          dob: '',
          bloodType: '',
          gender: '',
          phone: '',
          emergencyNote: '',
          caregiverName: '',
          caregiverEmail: '',
          caregiverPhone: '',
        });
      }

      return cred.user;
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') return null;
      const msg = mapFirebaseError(err.code);
      setError(msg);
      throw new Error(msg);
    }
  }

  // ── Logout ───────────────────────────────────────────
  async function logout() {
    if (!isFirebaseConfigured) {
      localStorage.removeItem('sm_session');
      setCurrentUser(null);
      return;
    }
    try {
      await signOut(auth);
      setCurrentUser(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  }

  // ── Password Reset ──────────────────────────────────
  async function resetPassword(email) {
    setError('');
    if (!isFirebaseConfigured) {
      setError('Password reset requires Firebase configuration.');
      throw new Error('Password reset requires Firebase configuration.');
    }
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      const msg = mapFirebaseError(err.code);
      setError(msg);
      throw new Error(msg);
    }
  }

  // ── Local Fallback Auth ─────────────────────────────
  function localRegister(email, password, displayName) {
    const accounts = JSON.parse(localStorage.getItem('sm_accounts') || '[]');
    if (accounts.find((a) => a.email === email)) {
      const msg = 'An account with this email already exists.';
      setError(msg);
      throw new Error(msg);
    }
    const uid = `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const user = { uid, email, displayName, photoURL: '' };
    accounts.push({ ...user, passwordHash: simpleHash(password) });
    localStorage.setItem('sm_accounts', JSON.stringify(accounts));
    localStorage.setItem('sm_session', JSON.stringify(user));
    setCurrentUser(user);
    return user;
  }

  function localLogin(email, password) {
    const accounts = JSON.parse(localStorage.getItem('sm_accounts') || '[]');
    const account = accounts.find(
      (a) => a.email === email && a.passwordHash === simpleHash(password)
    );
    if (!account) {
      const msg = 'Invalid email or password.';
      setError(msg);
      throw new Error(msg);
    }
    const user = { uid: account.uid, email: account.email, displayName: account.displayName, photoURL: '' };
    localStorage.setItem('sm_session', JSON.stringify(user));
    setCurrentUser(user);
    return user;
  }

  function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return hash.toString(36);
  }

  // ── Helpers ──────────────────────────────────────────
  function clearError() {
    setError('');
  }

  const value = {
    currentUser,
    isAuthenticated: !!currentUser,
    loading,
    error,
    clearError,
    register,
    login,
    loginWithGoogle,
    logout,
    resetPassword,
    isFirebaseConfigured,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Map Firebase error codes to user-friendly messages.
 */
function mapFirebaseError(code) {
  const map = {
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-credential': 'Invalid email or password. Please try again.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
    'auth/popup-closed-by-user': 'Sign-in popup was closed.',
    'auth/requires-recent-login': 'Please log in again to perform this action.',
  };
  return map[code] || 'An unexpected error occurred. Please try again.';
}
