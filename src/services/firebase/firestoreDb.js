import { getFirestore } from 'firebase/firestore'
import { getFirebaseApp } from './firebaseApp.js'

/**
 * Return the Firestore instance using Firestore's default in-memory cache only.
 * Persistent local cache is intentionally omitted so nothing is stored on disk.
 */
export function getFirestoreDb() {
  return getFirestore(getFirebaseApp())
}
