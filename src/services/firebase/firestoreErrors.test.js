import { describe, expect, it } from 'vitest'
import { mapFirestoreError } from './firestoreErrors.js'

const SAVE_NETWORK_MSG =
  "Couldn't confirm the save. Check your connection; reload to see what was saved."
const LOAD_NETWORK_MSG =
  "Couldn't load your habits right now. Check your connection and try again."
const SAVE_GENERIC_MSG = "Couldn't save your changes. Please try again."
const LOAD_GENERIC_MSG = "Couldn't load your habits. Please try again."

describe('mapFirestoreError', () => {
  it.each([
    ['unavailable', 'save', SAVE_NETWORK_MSG],
    ['deadline-exceeded', 'save', SAVE_NETWORK_MSG],
    ['unavailable', 'load', LOAD_NETWORK_MSG],
    ['deadline-exceeded', 'load', LOAD_NETWORK_MSG],
    ['firestore/unavailable', 'save', SAVE_NETWORK_MSG],
    [
      'permission-denied',
      'save',
      "You don't have permission to access these habits.",
    ],
    ['unauthenticated', 'save', 'Your session has expired. Please sign in again.'],
    [
      'resource-exhausted',
      'save',
      'Storage quota or request limit was reached. Please try again later.',
    ],
    ['not-found', 'save', 'The requested record could not be found.'],
    ['aborted', 'save', SAVE_GENERIC_MSG],
    ['cancelled', 'save', SAVE_GENERIC_MSG],
    ['failed-precondition', 'save', SAVE_GENERIC_MSG],
    ['invalid-argument', 'save', SAVE_GENERIC_MSG],
    ['already-exists', 'save', SAVE_GENERIC_MSG],
    ['aborted', 'load', LOAD_GENERIC_MSG],
    ['cancelled', 'load', LOAD_GENERIC_MSG],
    ['failed-precondition', 'load', LOAD_GENERIC_MSG],
    ['invalid-argument', 'load', LOAD_GENERIC_MSG],
    ['already-exists', 'load', LOAD_GENERIC_MSG],
  ])(
    'maps %s (action=%s) to a neutral message without leaking raw error text',
    (code, action, expectedMessage) => {
      const secretRaw = `RAW_FIREBASE_INTERNAL_${code}_9912`
      const mapped = mapFirestoreError({ code, message: secretRaw }, { action })

      expect(mapped.code).toBe(code.replace(/^firestore\//, ''))
      expect(mapped.message).toBe(expectedMessage)
      expect(mapped.message).not.toContain(secretRaw)
    },
  )

  it('defaults action to "save" and handles unknown error codes safely', () => {
    const rawMsg = 'INTERNAL_GRPC_FAILURE_SECRET'
    const mapped = mapFirestoreError({ code: 'internal', message: rawMsg })

    expect(mapped).toEqual({
      code: 'internal',
      message: SAVE_GENERIC_MSG,
    })
    expect(mapped.message).not.toContain(rawMsg)
  })

  it.each([null, undefined, 'string-error', 404, {}])(
    'handles non-Error value (%s) without throwing or exposing input',
    (badValue) => {
      const mapped = mapFirestoreError(badValue)
      expect(mapped).toEqual({
        code: 'unknown',
        message: SAVE_GENERIC_MSG,
      })

      const loadMapped = mapFirestoreError(badValue, { action: 'load' })
      expect(loadMapped).toEqual({
        code: 'unknown',
        message: LOAD_GENERIC_MSG,
      })
    },
  )
})
