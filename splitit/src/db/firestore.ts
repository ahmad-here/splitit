/**
 * Firestore client for real-time listeners only. Reads go through onSnapshot to
 * detect changes; the stores still pull the actual data from the backend, so
 * this is used purely as a "something changed, refresh" signal. Guarded by the
 * same Firestore security rules the backend rules file defines.
 */

import { getFirestore } from 'firebase/firestore';

import { firebaseApp } from '@/auth/firebase-client';

export const db = getFirestore(firebaseApp);
