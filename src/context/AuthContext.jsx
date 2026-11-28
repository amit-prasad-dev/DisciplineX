import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { createAuthController } from '../features/auth/authController.js'
import { AuthContext } from './authContext.js'

/**
 * Thin React provider binding the framework-free auth controller to context.
 */
export function AuthProvider({ children }) {
  const [controller] = useState(() => createAuthController())
  const authState = useSyncExternalStore(controller.subscribe, controller.getState)

  useEffect(() => {
    controller.start()
    return () => controller.stop()
  }, [controller])

  const value = useMemo(
    () => ({
      ...authState,
      signIn: controller.signIn,
      signOut: controller.signOut,
      clearError: controller.clearError,
    }),
    [authState, controller],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
