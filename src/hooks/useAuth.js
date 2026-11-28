import { useContext } from 'react'
import { AuthContext } from '../context/authContext.js'

/**
 * Access the authentication state and actions from AuthProvider.
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
