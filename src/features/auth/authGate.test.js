import { describe, expect, it } from 'vitest'
import {
  getAccountLabel,
  getAuthGateDecision,
  sanitizeReturnPath,
} from './authGate.js'

describe('getAuthGateDecision', () => {
  it('returns loading for initializing on both protected and sign-in routes', () => {
    expect(
      getAuthGateDecision({ status: 'initializing', isSignInRoute: false }),
    ).toEqual({ type: 'loading' })
    expect(
      getAuthGateDecision({ status: 'initializing', isSignInRoute: true }),
    ).toEqual({ type: 'loading' })
  })

  it('returns configError on every route, including /sign-in', () => {
    expect(
      getAuthGateDecision({ status: 'configError', isSignInRoute: false }),
    ).toEqual({ type: 'configError' })
    expect(
      getAuthGateDecision({ status: 'configError', isSignInRoute: true }),
    ).toEqual({ type: 'configError' })
  })

  it('redirects signedOut on protected routes and allows /sign-in', () => {
    expect(
      getAuthGateDecision({ status: 'signedOut', isSignInRoute: false }),
    ).toEqual({ type: 'redirectToSignIn' })
    expect(
      getAuthGateDecision({ status: 'signedOut', isSignInRoute: true }),
    ).toEqual({ type: 'allow' })
  })

  it('returns noAccess on every route', () => {
    expect(
      getAuthGateDecision({ status: 'noAccess', isSignInRoute: false }),
    ).toEqual({ type: 'noAccess' })
    expect(
      getAuthGateDecision({ status: 'noAccess', isSignInRoute: true }),
    ).toEqual({ type: 'noAccess' })
  })

  it('allows ownerSignedIn on protected routes and redirects /sign-in to app', () => {
    expect(
      getAuthGateDecision({ status: 'ownerSignedIn', isSignInRoute: false }),
    ).toEqual({ type: 'allow' })
    expect(
      getAuthGateDecision({ status: 'ownerSignedIn', isSignInRoute: true }),
    ).toEqual({ type: 'redirectToApp' })
  })
})

describe('sanitizeReturnPath', () => {
  it('preserves valid internal paths with search and hash', () => {
    expect(sanitizeReturnPath('/')).toBe('/')
    expect(sanitizeReturnPath('/habits')).toBe('/habits')
    expect(sanitizeReturnPath('/habits/new')).toBe('/habits/new')
    expect(sanitizeReturnPath('/habits/123/edit?tab=schedule#target')).toBe(
      '/habits/123/edit?tab=schedule#target',
    )
  })

  it('rejects protocol-relative, external scheme, backslash, and /sign-in paths', () => {
    expect(sanitizeReturnPath('//evil.com')).toBe('/')
    expect(sanitizeReturnPath('https://evil.com')).toBe('/')
    expect(sanitizeReturnPath('javascript:alert(1)')).toBe('/')
    expect(sanitizeReturnPath('/\\evil')).toBe('/')
    expect(sanitizeReturnPath('/habits\\evil')).toBe('/')
    expect(sanitizeReturnPath('/sign-in')).toBe('/')
    expect(sanitizeReturnPath('/sign-in?from=/habits')).toBe('/')
  })

  it('falls back to "/" for empty or non-string values', () => {
    expect(sanitizeReturnPath('')).toBe('/')
    expect(sanitizeReturnPath(null)).toBe('/')
    expect(sanitizeReturnPath(undefined)).toBe('/')
    expect(sanitizeReturnPath(123)).toBe('/')
    expect(sanitizeReturnPath({ pathname: '/habits' })).toBe('/')
  })
})

describe('getAccountLabel', () => {
  it('prefers displayName, falls back to email, then "Signed in"', () => {
    expect(
      getAccountLabel({ displayName: 'Alex', email: 'alex@example.com' }),
    ).toBe('Alex')
    expect(
      getAccountLabel({ displayName: '   ', email: 'alex@example.com' }),
    ).toBe('alex@example.com')
    expect(getAccountLabel({ displayName: null, email: null })).toBe('Signed in')
    expect(getAccountLabel(null)).toBe('Signed in')
  })
})
