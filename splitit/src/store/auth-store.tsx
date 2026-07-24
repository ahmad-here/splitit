/**
 * Auth session store. Owns the Firebase user, exposes the auth actions the
 * screens call, and provides the current ID token to the HTTP client. Its own
 * context so auth changes don't re-render data consumers (ISP), mirroring the
 * other per-domain stores.
 */

import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { firebaseAuthClient } from '@/auth/firebase-client';

type AuthValue = {
  user: User | null;
  /** True until the first auth state resolves (avoid flashing the sign-in screen). */
  initializing: boolean;
  emailVerified: boolean;
  signUp: (firstName: string, lastName: string, email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogleIdToken: (idToken: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  reloadUser: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuthClient, (u) => {
      setUser(u);
      setInitializing(false);
    });
    return unsub;
  }, []);

  const signUp = useCallback(
    async (firstName: string, lastName: string, email: string, password: string) => {
      const cred = await createUserWithEmailAndPassword(firebaseAuthClient, email.trim(), password);
      const displayName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');
      if (displayName) await updateProfile(cred.user, { displayName });
      await sendEmailVerification(cred.user);
      setUser({ ...cred.user });
    },
    [],
  );

  const signIn = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(firebaseAuthClient, email.trim(), password);
  }, []);

  const signInWithGoogleIdToken = useCallback(async (idToken: string) => {
    const credential = GoogleAuthProvider.credential(idToken);
    await signInWithCredential(firebaseAuthClient, credential);
  }, []);

  const resendVerification = useCallback(async () => {
    if (firebaseAuthClient.currentUser) await sendEmailVerification(firebaseAuthClient.currentUser);
  }, []);

  const reloadUser = useCallback(async () => {
    if (firebaseAuthClient.currentUser) {
      await firebaseAuthClient.currentUser.reload();
      setUser({ ...firebaseAuthClient.currentUser });
    }
  }, []);

  const signOut = useCallback(async () => {
    await fbSignOut(firebaseAuthClient);
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      user,
      initializing,
      emailVerified: user?.emailVerified ?? false,
      signUp,
      signIn,
      signInWithGoogleIdToken,
      resendVerification,
      reloadUser,
      signOut,
    }),
    [user, initializing, signUp, signIn, signInWithGoogleIdToken, resendVerification, reloadUser, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

/** Current Firebase ID token for Authorization headers, or null when signed out. */
export async function getIdToken(): Promise<string | null> {
  const u = firebaseAuthClient.currentUser;
  return u ? u.getIdToken() : null;
}
