import { getApp, getApps, initializeApp } from 'firebase/app'
import { getFirebaseConfig } from './firebaseConfig.js'

/**
 * Return the singleton Firebase app, initializing it once from Vite environment
 * variables if not already initialized.
 */
export function getFirebaseApp(env = import.meta.env) {
  if (getApps().length > 0) {
    return getApp()
  }
  const config = getFirebaseConfig(env)
  return initializeApp(config)
}
