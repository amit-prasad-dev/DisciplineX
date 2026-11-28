import { LogOut, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import NavLinkList from './NavLinkList.jsx'

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'

export default function MobileNavDrawer({
  isOpen,
  onDismiss,
  onNavigate,
  accountLabel,
  onSignOut,
}) {
  const drawerRef = useRef(null)
  const closeButtonRef = useRef(null)

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    closeButtonRef.current?.focus()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onDismiss()
        return
      }

      if (event.key === 'Tab' && drawerRef.current) {
        const focusables = drawerRef.current.querySelectorAll(FOCUSABLE_SELECTOR)
        if (focusables.length === 0) {
          return
        }
        const first = focusables[0]
        const last = focusables[focusables.length - 1]

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onDismiss])

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-40 flex lg:hidden">
      <div
        aria-hidden="true"
        onClick={onDismiss}
        className="fixed inset-0 bg-text/50 transition-opacity duration-150 motion-reduce:transition-none"
      />
      <div
        id="mobile-nav-drawer"
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className="relative z-10 flex w-72 max-w-[85vw] flex-col border-r border-border bg-surface shadow-lg"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-4">
          <div>
            <p className="text-lg font-bold tracking-tight text-text">
              DisciplineX
            </p>
            <p className="text-xs text-text-muted mt-0.5">
              Build Discipline. Master Consistency.
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            aria-label="Close navigation menu"
            onClick={onDismiss}
            className="inline-flex items-center justify-center rounded-md border border-border bg-surface-subtle p-2 text-text hover:bg-surface transition-colors duration-150 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <X size={18} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <NavLinkList ariaLabel="Mobile navigation" onLinkClick={onNavigate} />
        </div>
        <div className="border-t border-border p-4 space-y-3">
          <p
            title={accountLabel}
            className="truncate text-sm text-text-muted"
          >
            {accountLabel}
          </p>
          <button
            type="button"
            onClick={onSignOut}
            className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-border bg-surface-subtle px-3 py-2 text-sm font-semibold text-text hover:bg-surface transition-colors duration-150 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <LogOut size={16} strokeWidth={2} aria-hidden="true" />
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </div>
  )
}
