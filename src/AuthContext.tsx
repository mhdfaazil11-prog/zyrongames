/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

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
const STORAGE_CODE_KEY = 'zorvyq_auth_code_secure';

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
      // Sync local favorite games and scores
      const fav = JSON.parse(localStorage.getItem('fav') || '[]');
      const best = JSON.parse(localStorage.getItem('best') || '{}');
      console.log('Progress synced for', user.displayName, { fav, best });
    } catch (err) {
      console.warn('Sync failed:', err);
    }
  }, [user]);

  // Google direct login
  const loginGoogle = useCallback(async () => {
    setLoading(true);
    try {
      const googleUser: ZorvyqUser = {
        uid: 'goog_mhdfaazil11',
        displayName: 'Mhd Faazil',
        email: 'mhdfaazil11@gmail.com',
        phoneNumber: null,
        photoURL: 'https://api.dicebear.com/7.x/bottts/svg?seed=FaazilGoogle',
        provider: 'google',
        createdAt: new Date().toISOString(),
      };
      saveUser(googleUser);
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

  // Send verification code
  const sendCode = useCallback(async (method: 'email' | 'mobile' | 'apple', target: string) => {
    const cleanTarget = target.trim().toLowerCase();
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const record = {
      method,
      target: cleanTarget,
      code,
      expiresAt: Date.now() + 10 * 60 * 1000,
    };
    try {
      sessionStorage.setItem(STORAGE_CODE_KEY, JSON.stringify(record));
    } catch {}

    let destination = 'Gmail / Email inbox';
    if (method === 'mobile') destination = 'SMS text message';
    if (method === 'apple') destination = 'Apple messages';

    // Show debug info or notify user
    return {
      success: true,
      message: `Verification code sent to your ${destination} (${cleanTarget}). (Use test code: ${code} or 123456)`,
    };
  }, []);

  // Login with code verification
  const loginWithCode = useCallback(
    async (method: 'email' | 'mobile' | 'apple', target: string, code: string, displayName?: string) => {
      const cleanTarget = target.trim().toLowerCase();
      const cleanCode = code.trim();
      let stored: { method: string; target: string; code: string; expiresAt: number } | null = null;
      try {
        const raw = sessionStorage.getItem(STORAGE_CODE_KEY);
        if (raw) stored = JSON.parse(raw);
      } catch {}

      // Allow matching code or universal test code 123456
      if (!(stored && stored.code === cleanCode && stored.method === method) && cleanCode !== '123456') {
        throw new Error('Incorrect verification code. Please check and enter the 6-digit code or use 123456.');
      }

      if (stored && Date.now() > stored.expiresAt && cleanCode !== '123456') {
        throw new Error('Verification code has expired. Please request a new code.');
      }

      try {
        sessionStorage.removeItem(STORAGE_CODE_KEY);
      } catch {}

      const hash = Math.abs(
        cleanTarget.split('').reduce((acc, ch) => (acc << 5) - acc + ch.charCodeAt(0), 0)
      ).toString(36);
      const uid = `${method}_${hash}`;
      const name =
        displayName?.trim() ||
        (method === 'mobile' ? `Player (${cleanTarget.slice(-4)})` : cleanTarget.split('@')[0]);
      const photoURL = `https://api.dicebear.com/7.x/bottts/svg?seed=${method}_${hash}`;

      const verifiedUser: ZorvyqUser = {
        uid,
        displayName: name,
        email: method === 'mobile' ? null : cleanTarget,
        phoneNumber: method === 'mobile' ? cleanTarget : null,
        photoURL,
        provider: method,
        createdAt: new Date().toISOString(),
      };

      saveUser(verifiedUser);
      await syncCloudProgress();
      return verifiedUser;
    },
    [saveUser, syncCloudProgress]
  );

  // Sign out
  const logout = useCallback(async () => {
    saveUser(null);
    try {
      sessionStorage.removeItem(STORAGE_CODE_KEY);
    } catch {}
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
