import { describe, expect, it } from 'vitest'
import {
  isAmbiguousFirestoreError,
  mapFirestoreError,
  SAVE_TIMEOUT_ERROR_CODE,
} from './firestoreErrors.js'

const NETWORK_SAVE_MSG =
  "Couldn't confirm the save. Check your connection; reload to see what was saved."
const NETWORK_LOAD_MSG =
  "Couldn't load your habits right now. Check your connection and try again."
const DEFINITE_SAVE_GENERIC_MSG =
  "Couldn't save your change. Nothing was saved — please try again."
const LOAD_GENERIC_MSG = "Couldn't load your habits. Please try again."

describe('isAmbiguousFirestoreError', () => {
  it.each([
    'unavailable',
    'deadline-exceeded',
    'aborted',
    'cancelled',
    'unknown',
    'internal',
    'data-loss',
    SAVE_TIMEOUT_ERROR_CODE,
    'firestore/unavailable',
    'some-unrecognized-code',
  ])('treats %s as ambiguous', (code) => {
    expect(isAmbiguousFirestoreError({ code })).toBe(true)
  })

  it.each([null, undefined, 'string-error', 42, new Error('plain error'), {}])(
    'treats non-Firebase or uncoded error (%s) as ambiguous',
    (err) => {
      expect(isAmbiguousFirestoreError(err)).toBe(true)
    },
  )

  it.each([
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
    'firestore/permission-denied',
  ])('treats %s as a definite rejection (not ambiguous)', (code) => {
    expect(isAmbiguousFirestoreError({ code })).toBe(false)
  })
})

describe('mapFirestoreError', () => {
  it.each([
    ['unavailable', 'save', NETWORK_SAVE_MSG],
    ['deadline-exceeded', 'save', NETWORK_SAVE_MSG],
    [SAVE_TIMEOUT_ERROR_CODE, 'save', NETWORK_SAVE_MSG],
    ['aborted', 'save', NETWORK_SAVE_MSG],
    ['cancelled', 'save', NETWORK_SAVE_MSG],
    ['unknown', 'save', NETWORK_SAVE_MSG],
    ['internal', 'save', NETWORK_SAVE_MSG],
    ['data-loss', 'save', NETWORK_SAVE_MSG],
    ['unavailable', 'load', NETWORK_LOAD_MSG],
    ['deadline-exceeded', 'load', NETWORK_LOAD_MSG],
    ['aborted', 'load', LOAD_GENERIC_MSG],
    ['cancelled', 'load', LOAD_GENERIC_MSG],
  ])(
    'maps ambiguous %s (action=%s) cleanly without leaking raw text',
    (code, action, expectedMessage) => {
      const secretRaw = `RAW_FIREBASE_INTERNAL_${code}_9912`
      const mapped = mapFirestoreError({ code, message: secretRaw }, { action })

      expect(mapped.code).toBe(code)
      expect(mapped.message).toBe(expectedMessage)
      expect(mapped.message).not.toContain(secretRaw)
    },
  )

  it.each([
    [
      'permission-denied',
      "You don't have permission to save this change. Nothing was saved.",
    ],
    [
      'unauthenticated',
      'Your session has expired. Your change was not saved — please sign in again.',
    ],
    [
      'resource-exhausted',
      'Storage quota or request limit was reached. Your change was not saved — please try again later.',
    ],
    [
      'not-found',
      'The requested record could not be found. Your change was not saved.',
    ],
    ['invalid-argument', DEFINITE_SAVE_GENERIC_MSG],
    ['failed-precondition', DEFINITE_SAVE_GENERIC_MSG],
    ['already-exists', DEFINITE_SAVE_GENERIC_MSG],
    ['out-of-range', DEFINITE_SAVE_GENERIC_MSG],
    ['unimplemented', DEFINITE_SAVE_GENERIC_MSG],
    ['invalid-argument-local', DEFINITE_SAVE_GENERIC_MSG],
    ['invalid-habit-document', DEFINITE_SAVE_GENERIC_MSG],
  ])(
    'maps definite save error %s to state the change was not saved and never mentions reload',
    (code, expectedMessage) => {
      const secretRaw = `RAW_SDK_${code}_XYZ`
      const mapped = mapFirestoreError(
        { code, message: secretRaw },
        { action: 'save' },
      )

      expect(mapped.code).toBe(code)
      expect(mapped.message).toBe(expectedMessage)
      expect(mapped.message.toLowerCase()).toMatch(/not saved|nothing was saved/)
      expect(mapped.message.toLowerCase()).not.toContain('reload to see')
      expect(mapped.message).not.toContain(secretRaw)
    },
  )

  it.each([
    [
      'permission-denied',
      "You don't have permission to access these habits.",
    ],
    ['unauthenticated', 'Your session has expired. Please sign in again.'],
    [
      'resource-exhausted',
      'Storage quota or request limit was reached. Please try again later.',
    ],
    ['not-found', 'The requested record could not be found.'],
    ['invalid-argument', LOAD_GENERIC_MSG],
    ['failed-precondition', LOAD_GENERIC_MSG],
    ['already-exists', LOAD_GENERIC_MSG],
  ])('maps definite load error %s neutrally', (code, expectedMessage) => {
    const mapped = mapFirestoreError({ code }, { action: 'load' })
    expect(mapped).toEqual({ code, message: expectedMessage })
  })

  it.each([null, undefined, 'string-error', 404, {}])(
    'handles non-Error value (%s) as ambiguous without throwing or exposing input',
    (badValue) => {
      expect(mapFirestoreError(badValue)).toEqual({
        code: 'unknown',
        message: NETWORK_SAVE_MSG,
      })
      expect(mapFirestoreError(badValue, { action: 'load' })).toEqual({
        code: 'unknown',
        message: LOAD_GENERIC_MSG,
      })
    },
  )
})
