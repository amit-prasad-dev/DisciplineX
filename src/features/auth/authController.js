import {
  deriveAuthStatus,
  mapAuthError,
} from './authLogic.js'
import { getFirebaseApp } from '../../services/firebase/firebaseApp.js'
import * as defaultAuthService from '../../services/firebase/firebaseAuth.js'
import { getConfiguredOwnerUid } from '../../services/firebase/ownerConfig.js'

const UNAVAILABLE_AUTH_ERROR = Object.freeze({
  code: 'auth/unavailable',
  message: 'Authentication is currently unavailable. Please try again.',
})

const SIGN_OUT_FAILED_ERROR = Object.freeze({
  code: 'auth/sign-out-failed',
  message: 'Sign-out could not be completed. Please try again.',
})

function buildSnapshot({ user, initializing, configError, error, isSigningIn }, ownerUid) {
  return Object.freeze({
    status: deriveAuthStatus({
      initializing,
      configError,
      user,
      ownerUid,
    }),
    user,
    initializing,
    configError,
    error,
    isSigningIn,
  })
}

function getSafeConfigErrorMessage(error) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }
  return 'Firebase configuration is missing or incomplete.'
}

/**
 * Create a framework-free controller managing Firebase Auth lifecycle,
 * immutable state snapshots for useSyncExternalStore, and guarded actions.
 */
export function createAuthController({
  authService = defaultAuthService,
  readOwnerUid = getConfiguredOwnerUid,
  initFirebaseApp = getFirebaseApp,
} = {}) {
  let ownerUid = null
  let state = buildSnapshot(
    {
      user: null,
      initializing: true,
      configError: null,
      error: null,
      isSigningIn: false,
    },
    ownerUid,
  )

  const listeners = new Set()
  let active = false
  let disposed = false
  let sessionId = 0
  let unsubscribe = null

  function notify() {
    for (const listener of [...listeners]) {
      listener()
    }
  }

  function updateState(patch) {
    const nextFields = {
      user: 'user' in patch ? patch.user : state.user,
      initializing:
        'initializing' in patch ? patch.initializing : state.initializing,
      configError:
        'configError' in patch ? patch.configError : state.configError,
      error: 'error' in patch ? patch.error : state.error,
      isSigningIn:
        'isSigningIn' in patch ? patch.isSigningIn : state.isSigningIn,
    }
    const nextSnapshot = buildSnapshot(nextFields, ownerUid)

    const unchanged =
      nextSnapshot.status === state.status &&
      nextSnapshot.user === state.user &&
      nextSnapshot.initializing === state.initializing &&
      nextSnapshot.configError === state.configError &&
      nextSnapshot.error === state.error &&
      nextSnapshot.isSigningIn === state.isSigningIn

    if (unchanged) {
      return
    }

    state = nextSnapshot
    notify()
  }

  function start() {
    if (active) {
      return
    }

    disposed = false
    active = true
    sessionId += 1
    const currentSession = sessionId

    try {
      initFirebaseApp()
      ownerUid = readOwnerUid()
    } catch (error) {
      ownerUid = null
      updateState({
        user: null,
        initializing: false,
        configError: getSafeConfigErrorMessage(error),
        error: null,
        isSigningIn: false,
      })
      return
    }

    updateState({
      initializing: true,
      configError: null,
      isSigningIn: false,
    })

    try {
      const nextUnsubscribe = authService.subscribeToAuth(
        (normalizedUser) => {
          if (disposed || !active || currentSession !== sessionId) {
            return
          }
          updateState({
            user: normalizedUser,
            initializing: false,
          })
        },
        (authError) => {
          if (disposed || !active || currentSession !== sessionId) {
            return
          }
          updateState({
            user: null,
            initializing: false,
            error: mapAuthError(authError) ?? UNAVAILABLE_AUTH_ERROR,
          })
        },
      )

      if (disposed || !active || currentSession !== sessionId) {
        if (typeof nextUnsubscribe === 'function') {
          nextUnsubscribe()
        }
        return
      }

      unsubscribe = nextUnsubscribe
    } catch (error) {
      if (disposed || !active || currentSession !== sessionId) {
        return
      }
      updateState({
        user: null,
        initializing: false,
        error: mapAuthError(error) ?? UNAVAILABLE_AUTH_ERROR,
      })
    }
  }

  function stop() {
    disposed = true
    active = false
    sessionId += 1

    const currentUnsubscribe = unsubscribe
    unsubscribe = null
    if (typeof currentUnsubscribe === 'function') {
      currentUnsubscribe()
    }
  }

  function getState() {
    return state
  }

  function subscribe(listener) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }

  async function signIn() {
    if (disposed || state.isSigningIn || state.configError) {
      return
    }

    const currentSession = sessionId
    updateState({
      isSigningIn: true,
      error: null,
    })

    try {
      await authService.signInWithGoogle()
      if (disposed || currentSession !== sessionId) {
        return
      }
      updateState({
        isSigningIn: false,
      })
    } catch (error) {
      if (disposed || currentSession !== sessionId) {
        return
      }
      updateState({
        isSigningIn: false,
        error: mapAuthError(error),
      })
    }
  }

  async function signOut() {
    if (disposed) {
      return
    }

    const currentSession = sessionId

    try {
      await authService.signOutUser()
    } catch (error) {
      if (disposed || currentSession !== sessionId) {
        return
      }
      updateState({
        error: mapAuthError(error) ?? SIGN_OUT_FAILED_ERROR,
      })
    }
  }

  function clearError() {
    if (disposed || state.error === null) {
      return
    }

    updateState({ error: null })
  }

  return {
    start,
    stop,
    getState,
    subscribe,
    signIn,
    signOut,
    clearError,
  }
}
