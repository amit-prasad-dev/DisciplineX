/**
 * Determine route access decision from high-level auth status and route kind.
 * Returns one of: loading, configError, redirectToSignIn, noAccess, allow, redirectToApp.
 */
export function getAuthGateDecision({ status, isSignInRoute }) {
  if (status === 'configError') {
    return { type: 'configError' }
  }

  if (status === 'noAccess') {
    return { type: 'noAccess' }
  }

  if (status === 'signedOut') {
    return { type: isSignInRoute ? 'allow' : 'redirectToSignIn' }
  }

  if (status === 'ownerSignedIn') {
    return { type: isSignInRoute ? 'redirectToApp' : 'allow' }
  }

  return { type: 'loading' }
}

function hasControlCharacter(value) {
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i)
    if (code <= 31 || code === 127) {
      return true
    }
  }
  return false
}

/**
 * Sanitize a post-sign-in return path to prevent open redirects or /sign-in loops.
 * Accepts only internal paths starting with a single "/" and keeps pathname + search + hash.
 */
export function sanitizeReturnPath(path) {
  if (typeof path !== 'string' || path.length === 0) {
    return '/'
  }

  if (
    !path.startsWith('/') ||
    path.startsWith('//') ||
    path.startsWith('/\\') ||
    path.includes('\\') ||
    hasControlCharacter(path)
  ) {
    return '/'
  }

  let parsed
  try {
    parsed = new URL(path, 'https://disciplinex.local')
  } catch {
    return '/'
  }

  if (
    parsed.origin !== 'https://disciplinex.local' ||
    !parsed.pathname.startsWith('/') ||
    parsed.pathname.startsWith('//')
  ) {
    return '/'
  }

  if (
    parsed.pathname === '/sign-in' ||
    parsed.pathname.startsWith('/sign-in/')
  ) {
    return '/'
  }

  return `${parsed.pathname}${parsed.search}${parsed.hash}`
}

/**
 * Resolve a safe display label for the signed-in account.
 */
export function getAccountLabel(user) {
  const displayName =
    typeof user?.displayName === 'string' ? user.displayName.trim() : ''
  if (displayName) {
    return displayName
  }

  const email = typeof user?.email === 'string' ? user.email.trim() : ''
  if (email) {
    return email
  }

  return 'Signed in'
}
