import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, googleProvider, db } from '../firebase';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // ── Google OAuth ─────────────────────────────────────
  const loginWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    await _ensureUserProfile(result.user);
    return result.user;
  };

  // ── Email / Password Sign-Up ─────────────────────────
  const signUpWithEmail = async (email, password, displayName) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName });
    await _ensureUserProfile({ ...result.user, displayName });
    setUser({ ...result.user, displayName });
    return result.user;
  };

  // ── Email / Password Sign-In ─────────────────────────
  const signInWithEmail = async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  };

  // ── Password Reset ───────────────────────────────────
  const sendPasswordReset = async (email) => {
    await sendPasswordResetEmail(auth, email);
  };

  // ── Sign Out ─────────────────────────────────────────
  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  // ── Internal: Create Firestore profile on first login ─
  const _ensureUserProfile = async (u) => {
    if (!u?.uid) return;
    const ref = doc(db, 'users', u.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        uid: u.uid,
        email: u.email,
        displayName: u.displayName || '',
        photoURL: u.photoURL || '',
        createdAt: new Date().toISOString(),
      });
    }
  };

  // ── Session helpers (Hybrid Firestore + LocalStorage) ────────
  const LOCAL_STORAGE_KEY_PREFIX = 'dataviz_user_sessions_';

  const _sanitizeForStorage = (data) => {
    if (data === undefined) return null;
    if (data === null || typeof data !== 'object') {
      if (typeof data === 'number' && (isNaN(data) || !isFinite(data))) {
        return null;
      }
      return data;
    }
    if (data instanceof Date) return data.toISOString();
    if (Array.isArray(data)) {
      return data.map(item => _sanitizeForStorage(item));
    }
    const cleanObj = {};
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) {
        const safeKey = key.replace(/[\/\.]/g, '_');
        cleanObj[safeKey] = _sanitizeForStorage(val);
      }
    }
    return cleanObj;
  };

  const _getLocalSessions = (userId) => {
    try {
      const raw = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${userId || 'guest'}`);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.warn('Failed to read sessions from localStorage:', e);
      return [];
    }
  };

  const _setLocalSessions = (userId, sessions) => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${userId || 'guest'}`, JSON.stringify(sessions));
    } catch (e) {
      console.warn('Failed to save sessions to localStorage:', e);
    }
  };

  const saveSession = async (sessionData) => {
    const userId = user?.uid || 'guest';
    const newId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date().toISOString();

    const sanitized = _sanitizeForStorage({
      ...sessionData,
      id: newId,
      createdAt: sessionData?.createdAt || now,
      updatedAt: now,
      userId,
      userEmail: user?.email || '',
    });

    // 1. Immediately persist to localStorage for 100% offline & permission guarantee
    const localList = _getLocalSessions(userId);
    const updatedLocalList = [sanitized, ...localList.filter(s => s.id !== newId)];
    _setLocalSessions(userId, updatedLocalList);

    // 2. Try persisting to Firestore if user is authenticated
    if (user?.uid) {
      try {
        const sessionRef = doc(db, 'users', user.uid, 'sessions', newId);
        await setDoc(sessionRef, sanitized);
      } catch (err) {
        console.warn('Firestore session save error (persisted locally):', err);
      }
    }

    return newId;
  };

  const updateSession = async (sessionId, updateData) => {
    if (!sessionId) return;
    const userId = user?.uid || 'guest';
    const now = new Date().toISOString();
    const sanitizedUpdate = _sanitizeForStorage({ ...updateData, updatedAt: now });

    // 1. Update in localStorage
    const localList = _getLocalSessions(userId);
    const idx = localList.findIndex(s => s.id === sessionId);
    let updatedLocalList;
    if (idx >= 0) {
      updatedLocalList = [...localList];
      updatedLocalList[idx] = { ...updatedLocalList[idx], ...sanitizedUpdate };
    } else {
      updatedLocalList = [{ id: sessionId, createdAt: now, ...sanitizedUpdate }, ...localList];
    }
    _setLocalSessions(userId, updatedLocalList);

    // 2. Update in Firestore if available
    if (user?.uid) {
      try {
        const sessionRef = doc(db, 'users', user.uid, 'sessions', sessionId);
        await setDoc(sessionRef, sanitizedUpdate, { merge: true });
      } catch (err) {
        console.warn('Firestore session update error (updated locally):', err);
      }
    }
  };

  const getSessions = async () => {
    const userId = user?.uid || 'guest';
    const localSessions = _getLocalSessions(userId);
    let firestoreSessions = [];

    if (user?.uid) {
      try {
        const sessionsRef = collection(db, 'users', user.uid, 'sessions');
        const q = query(sessionsRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        firestoreSessions = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      } catch (err) {
        console.warn('Firestore getSessions failed, returning local sessions:', err);
      }
    }

    // Merge & deduplicate by ID, prioritizing latest update
    const map = new Map();
    localSessions.forEach(s => { if (s?.id) map.set(s.id, s); });
    firestoreSessions.forEach(s => {
      if (s?.id) {
        const existing = map.get(s.id);
        if (!existing || (s.updatedAt && new Date(s.updatedAt) >= new Date(existing.updatedAt || 0))) {
          map.set(s.id, { ...existing, ...s });
        }
      }
    });

    const merged = Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );

    // Sync back merged data into local storage
    _setLocalSessions(userId, merged);
    return merged;
  };

  const value = {
    user,
    loading,
    loginWithGoogle,
    signUpWithEmail,
    signInWithEmail,
    sendPasswordReset,
    logout,
    saveSession,
    updateSession,
    getSessions,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
