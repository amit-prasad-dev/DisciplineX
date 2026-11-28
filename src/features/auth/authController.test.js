import { describe, expect, it, vi } from 'vitest'
import { createAuthController } from './authController.js'

function createDeferred() {
  let resolve
  let reject
  const promise = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function createFakeAuthHarness({
  ownerUid = 'owner-1',
  configError = null,
} = {}) {
  const listeners = new Map()
  let nextSubId = 1
  let subscribeCalls = 0
  let unsubscribeCalls = 0

  const authService = {
    subscribeToAuth: vi.fn((onUser, onError) => {
      subscribeCalls += 1
      const id = nextSubId++
      listeners.set(id, { onUser, onError })
      return () => {
        unsubscribeCalls += 1
        listeners.delete(id)
      }
    }),
    signInWithGoogle: vi.fn(async () => {}),
    signOutUser: vi.fn(async () => {}),
  }

  const initFirebaseApp = vi.fn(() => {
    if (configError) {
      throw new Error(configError)
    }
  })

  const readOwnerUid = vi.fn(() => ownerUid)

  const controller = createAuthController({
    authService,
    readOwnerUid,
    initFirebaseApp,
  })

  function emitUser(user) {
    for (const entry of listeners.values()) {
      entry.onUser(user)
    }
  }

  function emitAuthError(error) {
    for (const entry of listeners.values()) {
      entry.onError(error)
    }
  }

  return {
    controller,
    authService,
    initFirebaseApp,
    readOwnerUid,
    emitUser,
    emitAuthError,
    getCounts: () => ({
      activeListeners: listeners.size,
      subscribeCalls,
      unsubscribeCalls,
    }),
  }
}

describe('createAuthController', () => {
  it('starts in initializing state with immutable, referentially stable snapshots', () => {
    const { controller } = createFakeAuthHarness()
    const initial = controller.getState()

    expect(initial).toEqual({
      status: 'initializing',
      user: null,
      initializing: true,
      configError: null,
      error: null,
      isSigningIn: false,
    })
    expect(Object.isFrozen(initial)).toBe(true)
    expect(controller.getState()).toBe(initial)
  })

  it('updates snapshot on auth callbacks with user and with null, keeping stability between changes', () => {
    const { controller, emitUser } = createFakeAuthHarness({
      ownerUid: 'owner-1',
    })
    const onChange = vi.fn()
    controller.subscribe(onChange)

    const beforeStart = controller.getState()
    controller.start()
    expect(controller.getState()).toBe(beforeStart)
    expect(onChange).toHaveBeenCalledTimes(0)

    const ownerUser = {
      uid: 'owner-1',
      displayName: 'Owner',
      email: 'owner@example.com',
      photoURL: null,
    }
    emitUser(ownerUser)

    const signedInState = controller.getState()
    expect(signedInState).not.toBe(beforeStart)
    expect(Object.isFrozen(signedInState)).toBe(true)
    expect(signedInState.status).toBe('ownerSignedIn')
    expect(signedInState.initializing).toBe(false)
    expect(signedInState.user).toEqual(ownerUser)
    expect(controller.getState()).toBe(signedInState)
    expect(onChange).toHaveBeenCalledTimes(1)

    emitUser(null)
    const signedOutState = controller.getState()
    expect(signedOutState).not.toBe(signedInState)
    expect(signedOutState.status).toBe('signedOut')
    expect(signedOutState.user).toBeNull()
    expect(onChange).toHaveBeenCalledTimes(2)
  })

  it('derives ownerSignedIn, noAccess, and bootstrap (ownerUid null) statuses accurately', () => {
    const mismatchHarness = createFakeAuthHarness({ ownerUid: 'owner-1' })
    mismatchHarness.controller.start()
    mismatchHarness.emitUser({
      uid: 'stranger-2',
      displayName: 'Stranger',
      email: null,
      photoURL: null,
    })
    expect(mismatchHarness.controller.getState().status).toBe('noAccess')

    const bootstrapHarness = createFakeAuthHarness({ ownerUid: null })
    bootstrapHarness.controller.start()
    bootstrapHarness.emitUser({
      uid: 'first-user',
      displayName: 'First User',
      email: null,
      photoURL: null,
    })
    expect(bootstrapHarness.controller.getState().status).toBe('noAccess')
  })

  it('stores configError with variable names and does not subscribe when init fails', () => {
    const { controller, authService } = createFakeAuthHarness({
      configError:
        'Missing or placeholder Firebase configuration: VITE_FIREBASE_API_KEY, VITE_FIREBASE_APP_ID',
    })

    controller.start()
    const state = controller.getState()

    expect(state.status).toBe('configError')
    expect(state.initializing).toBe(false)
    expect(state.configError).toContain('VITE_FIREBASE_API_KEY')
    expect(state.configError).toContain('VITE_FIREBASE_APP_ID')
    expect(authService.subscribeToAuth).not.toHaveBeenCalled()
  })

  it('handles synchronous subscribeToAuth errors and async auth listener error callbacks without crashing', () => {
    const syncThrowHarness = createFakeAuthHarness()
    syncThrowHarness.authService.subscribeToAuth.mockImplementationOnce(() => {
      throw new Error('RAW_INTERNAL_SYNC_FAILURE')
    })

    syncThrowHarness.controller.start()
    const syncState = syncThrowHarness.controller.getState()
    expect(syncState.initializing).toBe(false)
    expect(syncState.error).toBeTruthy()
    expect(syncState.error.message).not.toContain('RAW_INTERNAL_SYNC_FAILURE')

    const listenerErrorHarness = createFakeAuthHarness()
    listenerErrorHarness.controller.start()
    listenerErrorHarness.emitAuthError({
      code: 'auth/network-request-failed',
      message: 'RAW_NETWORK_DETAIL',
    })
    const listenerState = listenerErrorHarness.controller.getState()
    expect(listenerState.initializing).toBe(false)
    expect(listenerState.error?.code).toBe('auth/network-request-failed')
    expect(listenerState.error?.message).not.toContain('RAW_NETWORK_DETAIL')
  })

  it('guards concurrent signIn calls while one is in flight', async () => {
    const { controller, authService } = createFakeAuthHarness()
    const deferred = createDeferred()
    authService.signInWithGoogle.mockReturnValueOnce(deferred.promise)

    controller.start()
    const firstPromise = controller.signIn()
    expect(controller.getState().isSigningIn).toBe(true)

    const secondPromise = controller.signIn()
    expect(authService.signInWithGoogle).toHaveBeenCalledTimes(1)

    deferred.resolve()
    await Promise.all([firstPromise, secondPromise])

    expect(controller.getState().isSigningIn).toBe(false)
    expect(controller.getState().error).toBeNull()
  })

  it('maps signIn errors to neutral messages and stores no error when popup is closed/cancelled', async () => {
    const { controller, authService } = createFakeAuthHarness()
    controller.start()

    authService.signInWithGoogle.mockRejectedValueOnce({
      code: 'auth/unauthorized-domain',
      message: 'RAW_UNAUTHORIZED_DETAILS',
    })
    await expect(controller.signIn()).resolves.toBeUndefined()

    expect(controller.getState().isSigningIn).toBe(false)
    expect(controller.getState().error).toEqual({
      code: 'auth/unauthorized-domain',
      message: 'Sign-in is not available from this domain.',
    })

    authService.signInWithGoogle.mockRejectedValueOnce({
      code: 'auth/popup-closed-by-user',
      message: 'Popup closed',
    })
    await controller.signIn()
    expect(controller.getState().error).toBeNull()

    authService.signInWithGoogle.mockRejectedValueOnce({
      code: 'auth/cancelled-popup-request',
      message: 'Cancelled',
    })
    await controller.signIn()
    expect(controller.getState().error).toBeNull()
  })

  it('never throws on signOut failure and stores a neutral error', async () => {
    const { controller, authService } = createFakeAuthHarness()
    controller.start()

    authService.signOutUser.mockRejectedValueOnce({
      code: 'auth/network-request-failed',
      message: 'RAW_SIGNOUT_FAILURE',
    })

    await expect(controller.signOut()).resolves.toBeUndefined()
    expect(controller.getState().error?.code).toBe('auth/network-request-failed')
    expect(controller.getState().error?.message).not.toContain(
      'RAW_SIGNOUT_FAILURE',
    )
  })

  it('unsubscribes on stop, ignores late callbacks/promises, and restarts cleanly after stop', async () => {
    const { controller, authService } = createFakeAuthHarness({
      ownerUid: 'owner-1',
    })

    let capturedOnUser = null
    authService.subscribeToAuth.mockImplementation((onUser) => {
      capturedOnUser = onUser
      return () => {
        capturedOnUser = null
      }
    })

    // Keep reference to first callback to simulate a late delivery after unsubscribe
    controller.start()
    const staleCallback = capturedOnUser
    const deferredSignIn = createDeferred()
    authService.signInWithGoogle.mockReturnValueOnce(deferredSignIn.promise)
    const pendingSignIn = controller.signIn()

    const stateBeforeStop = controller.getState()
    expect(stateBeforeStop.isSigningIn).toBe(true)

    controller.stop()

    // Late auth callback and late sign-in failure after stop must not change state
    staleCallback?.({
      uid: 'owner-1',
      displayName: 'Late',
      email: null,
      photoURL: null,
    })
    deferredSignIn.reject({ code: 'auth/network-request-failed' })
    await pendingSignIn
    expect(controller.getState()).toBe(stateBeforeStop)

    // Restarting (e.g., StrictMode remount) subscribes again and updates normally
    controller.start()
    expect(authService.subscribeToAuth).toHaveBeenCalledTimes(2)
    expect(controller.getState().isSigningIn).toBe(false)

    capturedOnUser?.({
      uid: 'owner-1',
      displayName: 'Owner',
      email: null,
      photoURL: null,
    })
    expect(controller.getState().status).toBe('ownerSignedIn')

    // Also verify default harness tracking for stop/start unsubscribe counts
    const harness2 = createFakeAuthHarness()
    harness2.controller.start()
    expect(harness2.getCounts()).toEqual({
      activeListeners: 1,
      subscribeCalls: 1,
      unsubscribeCalls: 0,
    })
    harness2.controller.stop()
    expect(harness2.getCounts()).toEqual({
      activeListeners: 0,
      subscribeCalls: 1,
      unsubscribeCalls: 1,
    })
    harness2.controller.start()
    expect(harness2.getCounts()).toEqual({
      activeListeners: 1,
      subscribeCalls: 2,
      unsubscribeCalls: 1,
    })
    harness2.emitUser(null)
    expect(harness2.controller.getState().status).toBe('signedOut')
  })

  it('clears errors with clearError and preserves snapshot identity when error is already null', async () => {
    const { controller, authService } = createFakeAuthHarness()
    controller.start()

    const stateWithoutError = controller.getState()
    controller.clearError()
    expect(controller.getState()).toBe(stateWithoutError)

    authService.signInWithGoogle.mockRejectedValueOnce({
      code: 'auth/user-disabled',
    })
    await controller.signIn()
    const erroredState = controller.getState()
    expect(erroredState.error).not.toBeNull()

    controller.clearError()
    const clearedState = controller.getState()
    expect(clearedState).not.toBe(erroredState)
    expect(clearedState.error).toBeNull()
    expect(controller.getState()).toBe(clearedState)
  })
})
