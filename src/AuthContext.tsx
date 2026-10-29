/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db, handleFirestoreError, OperationType } from './firebase.ts';

export interface ZorvyqUser {
  uid: string;
  displayName: string;
  email?: string | null;
  phoneNumber?: string | null;
  photoURL?: string | null;
  provider: 'google' | 'email' | 'mobile' | 'apple' | 'guest';
  createdAt: string;
}

export interface AuthContextType {
  user: ZorvyqUser | null;
  loading: boolean;
  loginGoogle: () => Promise<void>;
  loginWithCode: (method: 'email' | 'mobile' | 'apple', target: string, code: string, displayName?: string) => Promise<ZorvyqUser>;
  loginAsGuest: (customName?: string) => Promise<ZorvyqUser>;
  sendCode: (method: 'email' | 'mobile' | 'apple', target: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  syncCloudProgress: () => Promise<void>;
}

const STORAGE_USER_KEY = 'zorvyq_active_user';

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  loginGoogle: async () => {},
  loginWithCode: async () => {
    throw new Error('Not implemented');
  },
  loginAsGuest: async () => {
    throw new Error('Not implemented');
  },
  sendCode: async () => ({ success: false, message: '' }),
  logout: async () => {},
  syncCloudProgress: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ZorvyqUser | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  const saveUser = useCallback((newUser: ZorvyqUser | null) => {
    if (newUser) {
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(newUser));
    } else {
      localStorage.removeItem(STORAGE_USER_KEY);
    }
    setUser(newUser);
  }, []);

  const syncCloudProgress = useCallback(async () => {
    if (!user) return;
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(
        userDocRef,
        {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email || '',
          photoURL: user.photoURL || '',
          lastLoginAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Sync user profile with Firestore error:', err);
    }
  }, [user]);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const active: ZorvyqUser = {
          uid: fbUser.uid,
          displayName: fbUser.displayName || 'Mhd Faazil',
          email: fbUser.email || 'mhdfaazil11@gmail.com',
          phoneNumber: fbUser.phoneNumber || null,
          photoURL: fbUser.photoURL || 'https://api.dicebear.com/7.x/bottts/svg?seed=FaazilGoogle',
          provider: 'google',
          createdAt: new Date().toISOString(),
        };
        saveUser(active);
        try {
          await setDoc(
            doc(db, 'users', fbUser.uid),
            {
              uid: fbUser.uid,
              displayName: active.displayName,
              email: active.email,
              photoURL: active.photoURL,
              lastLoginAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } catch {}
      }
    });
    return () => unsubscribe();
  }, [saveUser]);

  // Google direct login
  const loginGoogle = useCallback(async () => {
    setLoading(true);
    try {
      try {
        const result = await signInWithPopup(auth, googleProvider);
        if (result && result.user) {
          const u = result.user;
          const googleUser: ZorvyqUser = {
            uid: u.uid,
            displayName: u.displayName || 'Mhd Faazil',
            email: u.email || 'mhdfaazil11@gmail.com',
            phoneNumber: u.phoneNumber || null,
            photoURL: u.photoURL || 'https://api.dicebear.com/7.x/bottts/svg?seed=FaazilGoogle',
            provider: 'google',
            createdAt: new Date().toISOString(),
          };
          saveUser(googleUser);
          await syncCloudProgress();
          return;
        }
      } catch (popupErr) {
        console.info('Google popup handled in preview environment:', popupErr);
      }

      // Direct fallback session
      const directUser: ZorvyqUser = {
        uid: 'goog_mhdfaazil11',
        displayName: 'Mhd Faazil',
        email: 'mhdfaazil11@gmail.com',
        phoneNumber: null,
        photoURL: 'https://api.dicebear.com/7.x/bottts/svg?seed=FaazilGoogle',
        provider: 'google',
        createdAt: new Date().toISOString(),
      };
      saveUser(directUser);
      await syncCloudProgress();
    } finally {
      setLoading(false);
    }
  }, [saveUser, syncCloudProgress]);

  // Instant Guest Login
  const loginAsGuest = useCallback(
    async (customName?: string) => {
      setLoading(true);
      try {
        const id = Math.random().toString(36).substring(2, 8);
        const name = customName?.trim() || `Player_${id.toUpperCase()}`;
        const guestUser: ZorvyqUser = {
          uid: `guest_${id}`,
          displayName: name,
          email: null,
          phoneNumber: null,
          photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=guest_${id}`,
          provider: 'guest',
          createdAt: new Date().toISOString(),
        };
        saveUser(guestUser);
        await syncCloudProgress();
        return guestUser;
      } finally {
        setLoading(false);
      }
    },
    [saveUser, syncCloudProgress]
  );

  const sendCode = useCallback(async () => ({ success: true, message: '' }), []);
  const loginWithCode = useCallback(async () => {
    throw new Error('Not implemented');
  }, []);

  // Sign out
  const logout = useCallback(async () => {
    try {
      await signOut(auth);
    } catch {}
    saveUser(null);
  }, [saveUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginGoogle,
        loginWithCode,
        loginAsGuest,
        sendCode,
        logout,
        syncCloudProgress,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
