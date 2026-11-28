import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import { normalizeAuthUser } from '../../features/auth/authLogic.js'
import { getFirebaseApp } from './firebaseApp.js'

/**
 * Return the Firebase Auth instance bound to the singleton Firebase app.
 */
export function getFirebaseAuth() {
  return getAuth(getFirebaseApp())
}

/**
 * Trigger Google sign-in via popup.
 * Must only be called directly from a user click handler so browsers do not block the popup.
 */
export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider()
  await signInWithPopup(getFirebaseAuth(), provider)
}

/**
 * Sign out the current Firebase user.
 */
export async function signOutUser() {
  await signOut(getFirebaseAuth())
}

/**
 * Subscribe to Firebase Auth state changes with normalized user objects and an
 * error handler. Returns the unsubscribe function.
 */
export function subscribeToAuth(callback, onError) {
  return onAuthStateChanged(
    getFirebaseAuth(),
    (firebaseUser) => {
      callback(normalizeAuthUser(firebaseUser))
    },
    onError,
  )
}
