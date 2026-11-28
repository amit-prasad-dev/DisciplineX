export const SAVE_TIMEOUT_ERROR_CODE = 'save-timeout'

const NETWORK_SAVE_MESSAGE =
  "Couldn't confirm the save. Check your connection; reload to see what was saved."
const NETWORK_LOAD_MESSAGE =
  "Couldn't load your habits right now. Check your connection and try again."

const GENERIC_AMBIGUOUS_MESSAGES = Object.freeze({
  save: NETWORK_SAVE_MESSAGE,
  load: "Couldn't load your habits. Please try again.",
})

const GENERIC_DEFINITE_MESSAGES = Object.freeze({
  save: "Couldn't save your change. Nothing was saved — please try again.",
  load: "Couldn't load your habits. Please try again.",
})

const DEFINITE_SAVE_CODE_MESSAGES = Object.freeze({
  'permission-denied':
    "You don't have permission to save this change. Nothing was saved.",
  unauthenticated:
    'Your session has expired. Your change was not saved — please sign in again.',
  'resource-exhausted':
    'Storage quota or request limit was reached. Your change was not saved — please try again later.',
  'not-found': 'The requested record could not be found. Your change was not saved.',
})

const DEFINITE_LOAD_CODE_MESSAGES = Object.freeze({
  'permission-denied': "You don't have permission to access these habits.",
  unauthenticated: 'Your session has expired. Please sign in again.',
  'resource-exhausted':
    'Storage quota or request limit was reached. Please try again later.',
  'not-found': 'The requested record could not be found.',
})

const NETWORK_TIMEOUT_CODES = new Set([
  'unavailable',
  'deadline-exceeded',
  SAVE_TIMEOUT_ERROR_CODE,
])

const DEFINITE_CODES = new Set([
  'permission-denied',
  'unauthenticated',
  'invalid-argument',
  'failed-precondition',
  'already-exists',
  'not-found',
  'resource-exhausted',
  'out-of-range',
  'unimplemented',
  'invalid-argument-local',
  'invalid-habit-document',
])

const AMBIGUOUS_CODES = new Set([
  'unavailable',
  'deadline-exceeded',
  'aborted',
  'cancelled',
  'unknown',
  'internal',
  'data-loss',
  SAVE_TIMEOUT_ERROR_CODE,
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
 * Determine whether a write failure leaves the server outcome uncertain.
 * Returns false only for definite rejections (server/rules or local pre-write guards).
 */
export function isAmbiguousFirestoreError(error) {
  if (!error || typeof error !== 'object') {
    return true
  }

  const code = normalizeFirestoreCode(error.code)
  if (DEFINITE_CODES.has(code)) {
    return false
  }
  if (AMBIGUOUS_CODES.has(code)) {
    return true
  }
  return true
}

/**
 * Map a Firestore error or unknown failure to a neutral UI error object.
 * Definite save errors state clearly that nothing was saved; ambiguous failures
 * warn to check connection and reload to see what was saved. Never includes raw SDK text.
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

  const knownMessages =
    safeAction === 'load'
      ? DEFINITE_LOAD_CODE_MESSAGES
      : DEFINITE_SAVE_CODE_MESSAGES

  if (Object.hasOwn(knownMessages, code)) {
    return {
      code,
      message: knownMessages[code],
    }
  }

  if (DEFINITE_CODES.has(code)) {
    return {
      code,
      message: GENERIC_DEFINITE_MESSAGES[safeAction],
    }
  }

  return {
    code,
    message: GENERIC_AMBIGUOUS_MESSAGES[safeAction],
  }
}
