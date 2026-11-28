import { AlertCircle, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import { getAccountLabel } from '../../features/auth/authGate.js'
import { useAuth } from '../../hooks/useAuth.js'
import MobileNavDrawer from './MobileNavDrawer.jsx'
import Sidebar from './Sidebar.jsx'
import TopBar from './TopBar.jsx'
import { getPageTitle } from './navigation.js'

export default function AppShell() {
  const location = useLocation()
  const { user, error, signOut, clearError } = useAuth()
  const [drawerOpenedAtPath, setDrawerOpenedAtPath] = useState(null)
  const menuButtonRef = useRef(null)
  const mainRef = useRef(null)
  const wasDrawerOpenRef = useRef(false)
  const closeReasonRef = useRef(null)

  const isDrawerOpen = drawerOpenedAtPath === location.pathname
  const pageTitle = getPageTitle(location.pathname)
  const accountLabel = getAccountLabel(user)

  const handleOpenDrawer = useCallback(() => {
    closeReasonRef.current = null
    setDrawerOpenedAtPath(location.pathname)
  }, [location.pathname])

  const handleDismissDrawer = useCallback(() => {
    closeReasonRef.current = 'dismiss'
    setDrawerOpenedAtPath(null)
  }, [])

  const handleNavigateFromDrawer = useCallback(() => {
    closeReasonRef.current = 'navigate'
    setDrawerOpenedAtPath(null)
  }, [])

  const handleSignOutFromDrawer = useCallback(() => {
    closeReasonRef.current = 'signOut'
    setDrawerOpenedAtPath(null)
    signOut()
  }, [signOut])

  useEffect(() => {
    if (wasDrawerOpenRef.current && !isDrawerOpen) {
      if (closeReasonRef.current === 'dismiss') {
        menuButtonRef.current?.focus()
      } else {
        mainRef.current?.focus()
      }
      closeReasonRef.current = null
    }
    wasDrawerOpenRef.current = isDrawerOpen
  }, [isDrawerOpen])

  return (
    <div className="min-h-screen bg-bg text-text">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground focus:outline-2 focus:outline-offset-2 focus:outline-primary"
      >
        Skip to main content
      </a>

      <Sidebar />

      <div className="min-h-screen flex flex-col lg:pl-64">
        <TopBar
          pageTitle={pageTitle}
          isDrawerOpen={isDrawerOpen}
          onOpenDrawer={handleOpenDrawer}
          menuButtonRef={menuButtonRef}
          accountLabel={accountLabel}
          onSignOut={signOut}
        />

        {error ? (
          <div
            role="alert"
            className="flex items-center justify-between gap-3 border-b border-border bg-surface-subtle px-4 py-2 text-sm text-text sm:px-6"
          >
            <div className="flex items-center gap-2 min-w-0">
              <AlertCircle
                size={16}
                strokeWidth={2}
                aria-hidden="true"
                className="shrink-0"
              />
              <p className="truncate">{error.message}</p>
            </div>
            <button
              type="button"
              aria-label="Dismiss error"
              onClick={clearError}
              className="shrink-0 rounded-md p-1 text-text-muted hover:bg-surface hover:text-text transition-colors duration-150 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <X size={16} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>
        ) : null}

        <MobileNavDrawer
          isOpen={isDrawerOpen}
          onDismiss={handleDismissDrawer}
          onNavigate={handleNavigateFromDrawer}
          accountLabel={accountLabel}
          onSignOut={handleSignOutFromDrawer}
        />

        <main
          id="main-content"
          ref={mainRef}
          tabIndex={-1}
          className="flex-1 p-4 sm:p-6 focus:outline-none"
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
