const NETWORK_SAVE_MESSAGE =
  "Couldn't confirm the save. Check your connection; reload to see what was saved."
const NETWORK_LOAD_MESSAGE =
  "Couldn't load your habits right now. Check your connection and try again."

const GENERIC_MESSAGES = Object.freeze({
  save: "Couldn't save your changes. Please try again.",
  load: "Couldn't load your habits. Please try again.",
})

const KNOWN_CODE_MESSAGES = Object.freeze({
  'permission-denied': "You don't have permission to access these habits.",
  unauthenticated: 'Your session has expired. Please sign in again.',
  'resource-exhausted':
    'Storage quota or request limit was reached. Please try again later.',
  'not-found': 'The requested record could not be found.',
})

const NETWORK_TIMEOUT_CODES = new Set(['unavailable', 'deadline-exceeded'])

const GENERIC_MAPPED_CODES = new Set([
  'aborted',
  'cancelled',
  'failed-precondition',
  'invalid-argument',
  'already-exists',
])

function normalizeFirestoreCode(rawCode) {
  if (typeof rawCode !== 'string' || rawCode.trim().length === 0) {
    return 'unknown'
  }
  const trimmed = rawCode.trim()
  return trimmed.startsWith('firestore/')
    ? trimmed.slice('firestore/'.length)
    : trimmed
}

/**
 * Map a Firestore error or unknown failure to a neutral UI error object.
 * Never includes raw Firebase SDK error text.
 */
export function mapFirestoreError(error, { action = 'save' } = {}) {
  const safeAction = action === 'load' ? 'load' : 'save'
  const code =
    error && typeof error === 'object'
      ? normalizeFirestoreCode(error.code)
      : 'unknown'

  if (NETWORK_TIMEOUT_CODES.has(code)) {
    return {
      code,
      message:
        safeAction === 'load' ? NETWORK_LOAD_MESSAGE : NETWORK_SAVE_MESSAGE,
    }
  }

  if (Object.hasOwn(KNOWN_CODE_MESSAGES, code)) {
    return {
      code,
      message: KNOWN_CODE_MESSAGES[code],
    }
  }

  if (GENERIC_MAPPED_CODES.has(code)) {
    return {
      code,
      message: GENERIC_MESSAGES[safeAction],
    }
  }

  return {
    code,
    message: GENERIC_MESSAGES[safeAction],
  }
}
