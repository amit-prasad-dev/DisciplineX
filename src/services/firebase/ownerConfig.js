import { getOwnerUid } from './firebaseConfig.js'

/**
 * Read the optional personal-use owner UID from Vite environment variables.
 * This is a UI/UX gate only; firestore.rules enforces actual access control.
 */
export function getConfiguredOwnerUid(env = import.meta.env) {
  return getOwnerUid(env)
}
