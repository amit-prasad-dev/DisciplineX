import { useCallback, useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import MobileNavDrawer from './MobileNavDrawer.jsx'
import Sidebar from './Sidebar.jsx'
import TopBar from './TopBar.jsx'
import { getPageTitle } from './navigation.js'

export default function AppShell() {
  const location = useLocation()
  const [drawerOpenedAtPath, setDrawerOpenedAtPath] = useState(null)
  const menuButtonRef = useRef(null)
  const mainRef = useRef(null)
  const wasDrawerOpenRef = useRef(false)
  const closeReasonRef = useRef(null)

  const isDrawerOpen = drawerOpenedAtPath === location.pathname
  const pageTitle = getPageTitle(location.pathname)

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
        />

        <MobileNavDrawer
          isOpen={isDrawerOpen}
          onDismiss={handleDismissDrawer}
          onNavigate={handleNavigateFromDrawer}
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
