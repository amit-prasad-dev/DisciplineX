import { Menu } from 'lucide-react'
import ThemeControl from './ThemeControl.jsx'

export default function TopBar({
  pageTitle,
  isDrawerOpen,
  onOpenDrawer,
  menuButtonRef,
}) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-border bg-surface px-4 py-3 sm:px-6">
      <div className="flex items-center gap-3 min-w-0">
        <button
          ref={menuButtonRef}
          type="button"
          aria-label="Open navigation menu"
          aria-expanded={isDrawerOpen}
          aria-controls="mobile-nav-drawer"
          onClick={onOpenDrawer}
          className="lg:hidden inline-flex items-center justify-center rounded-md border border-border bg-surface-subtle p-2 text-text hover:bg-surface transition-colors duration-150 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <Menu size={20} strokeWidth={2} aria-hidden="true" />
        </button>
        <p className="text-sm font-semibold text-text-muted truncate">
          {pageTitle}
        </p>
      </div>
      <ThemeControl />
    </header>
  )
}
