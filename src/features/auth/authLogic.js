const POPUP_DISMISSED_CODES = new Set([
  'auth/popup-closed-by-user',
  'auth/cancelled-popup-request',
])

const AUTH_ERROR_MESSAGES = Object.freeze({
  'auth/popup-blocked':
    'Sign-in popup was blocked by your browser. Please allow popups for this site and try again.',
  'auth/network-request-failed':
    'Network error while signing in. Check your connection and try again.',
  'auth/too-many-requests':
    'Too many sign-in attempts. Please wait a moment and try again.',
  'auth/unauthorized-domain': 'Sign-in is not available from this domain.',
  'auth/operation-not-allowed': 'Google sign-in is not enabled for this app.',
  'auth/user-disabled': 'This account has been disabled.',
})

const FALLBACK_AUTH_ERROR_MESSAGE =
  'Sign-in could not be completed. Please try again.'

/**
 * Extract only safe public profile fields from a Firebase user object.
 * Never returns tokens, credentials, or raw SDK user methods.
 */
export function normalizeAuthUser(firebaseUser) {
  if (!firebaseUser || typeof firebaseUser !== 'object') {
    return null
  }

  const uid = typeof firebaseUser.uid === 'string' ? firebaseUser.uid.trim() : ''
  if (!uid) {
    return null
  }

  return {
    uid,
    displayName:
      typeof firebaseUser.displayName === 'string' && firebaseUser.displayName
        ? firebaseUser.displayName
        : null,
    email:
      typeof firebaseUser.email === 'string' && firebaseUser.email
        ? firebaseUser.email
        : null,
    photoURL:
      typeof firebaseUser.photoURL === 'string' && firebaseUser.photoURL
        ? firebaseUser.photoURL
        : null,
  }
}

/**
 * Derive high-level UI authentication status.
 * Client-side owner comparison is UX-only; firestore.rules enforces real authorization.
 */
export function deriveAuthStatus({
  initializing,
  configError,
  user,
  ownerUid,
}) {
  if (configError) {
    return 'configError'
  }

  if (initializing) {
    return 'initializing'
  }

  if (!user) {
    return 'signedOut'
  }

  if (ownerUid && user.uid === ownerUid) {
    return 'ownerSignedIn'
  }

  return 'noAccess'
}

/**
 * Map a Firebase Auth error to a neutral UI error object without exposing raw
 * SDK error messages. Returns null when the user simply closed/cancelled the popup.
 */
export function mapAuthError(error) {
  const code =
    error && typeof error.code === 'string' && error.code
      ? error.code
      : 'auth/unknown'

  if (POPUP_DISMISSED_CODES.has(code)) {
    return null
  }

  return {
    code,
    message: AUTH_ERROR_MESSAGES[code] ?? FALLBACK_AUTH_ERROR_MESSAGE,
  }
}
