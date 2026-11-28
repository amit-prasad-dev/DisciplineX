import { describe, expect, it } from 'vitest'
import {
  deriveAuthStatus,
  mapAuthError,
  normalizeAuthUser,
} from './authLogic.js'

describe('normalizeAuthUser', () => {
  it('returns null for nullish values or users missing a valid uid', () => {
    expect(normalizeAuthUser(null)).toBeNull()
    expect(normalizeAuthUser(undefined)).toBeNull()
    expect(normalizeAuthUser({})).toBeNull()
    expect(normalizeAuthUser({ uid: '   ' })).toBeNull()
  })

  it('returns only safe public profile fields and strips tokens/methods', () => {
    const rawFirebaseUser = {
      uid: '  owner-123  ',
      displayName: 'Alex',
      email: 'alex@example.com',
      photoURL: 'https://example.com/avatar.png',
      accessToken: 'secret-token',
      stsTokenManager: { refreshToken: 'secret-refresh' },
      getIdToken: () => 'secret-jwt',
    }

    const normalized = normalizeAuthUser(rawFirebaseUser)
    expect(normalized).toEqual({
      uid: 'owner-123',
      displayName: 'Alex',
      email: 'alex@example.com',
      photoURL: 'https://example.com/avatar.png',
    })
    expect('accessToken' in normalized).toBe(false)
    expect('stsTokenManager' in normalized).toBe(false)
    expect('getIdToken' in normalized).toBe(false)
  })

  it('normalizes missing optional profile fields to null', () => {
    expect(normalizeAuthUser({ uid: 'u1' })).toEqual({
      uid: 'u1',
      displayName: null,
      email: null,
      photoURL: null,
    })
  })
})

describe('deriveAuthStatus', () => {
  const user = { uid: 'owner-uid', displayName: 'Owner', email: null, photoURL: null }

  it('gives configError highest precedence', () => {
    expect(
      deriveAuthStatus({
        initializing: true,
        configError: 'Missing VITE_FIREBASE_API_KEY',
        user,
        ownerUid: 'owner-uid',
      }),
    ).toBe('configError')
  })

  it('returns initializing when initializing is true without configError', () => {
    expect(
      deriveAuthStatus({
        initializing: true,
        configError: null,
        user: null,
        ownerUid: 'owner-uid',
      }),
    ).toBe('initializing')
  })

  it('returns signedOut when user is null', () => {
    expect(
      deriveAuthStatus({
        initializing: false,
        configError: null,
        user: null,
        ownerUid: 'owner-uid',
      }),
    ).toBe('signedOut')
  })

  it('returns ownerSignedIn when signed-in uid matches ownerUid', () => {
    expect(
      deriveAuthStatus({
        initializing: false,
        configError: null,
        user,
        ownerUid: 'owner-uid',
      }),
    ).toBe('ownerSignedIn')
  })

  it('returns noAccess when uid mismatches or ownerUid is null (bootstrap)', () => {
    expect(
      deriveAuthStatus({
        initializing: false,
        configError: null,
        user: { ...user, uid: 'other-uid' },
        ownerUid: 'owner-uid',
      }),
    ).toBe('noAccess')

    expect(
      deriveAuthStatus({
        initializing: false,
        configError: null,
        user,
        ownerUid: null,
      }),
    ).toBe('noAccess')
  })
})

describe('mapAuthError', () => {
  it('returns null when popup is closed or cancelled by the user', () => {
    expect(mapAuthError({ code: 'auth/popup-closed-by-user' })).toBeNull()
    expect(mapAuthError({ code: 'auth/cancelled-popup-request' })).toBeNull()
  })

  it('maps known Firebase Auth error codes to neutral messages without leaking raw messages', () => {
    const knownCodes = [
      'auth/popup-blocked',
      'auth/network-request-failed',
      'auth/too-many-requests',
      'auth/unauthorized-domain',
      'auth/operation-not-allowed',
      'auth/user-disabled',
    ]

    for (const code of knownCodes) {
      const secretRawDetail = `INTERNAL_SDK_DETAIL_${code}_XYZ`
      const mapped = mapAuthError({ code, message: secretRawDetail })

      expect(mapped).not.toBeNull()
      expect(mapped.code).toBe(code)
      expect(typeof mapped.message).toBe('string')
      expect(mapped.message.length).toBeGreaterThan(0)
      expect(mapped.message).not.toContain(secretRawDetail)
    }
  })

  it('returns a neutral fallback error for unknown or missing errors', () => {
    const rawMessage = 'Firebase: Raw internal error (auth/something-weird)'
    const mapped = mapAuthError({
      code: 'auth/something-weird',
      message: rawMessage,
    })

    expect(mapped.code).toBe('auth/something-weird')
    expect(mapped.message).not.toContain(rawMessage)
    expect(mapped.message).toBe(
      'Sign-in could not be completed. Please try again.',
    )

    expect(mapAuthError(null)).toEqual({
      code: 'auth/unknown',
      message: 'Sign-in could not be completed. Please try again.',
    })
  })
})
