import { AlertCircle, LogOut, ShieldAlert, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import ThemeControl from '../../components/layout/ThemeControl.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { getConfiguredOwnerUid } from '../../services/firebase/ownerConfig.js'
import { getAccountLabel } from './authGate.js'

export default function NoAccessPage() {
  const { user, error, signOut, clearError } = useAuth()
  const headingRef = useRef(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  const accountLabel = getAccountLabel(user)
  const hasSeparateEmail =
    Boolean(user?.displayName?.trim()) && Boolean(user?.email?.trim())

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col">
      <header className="flex items-center justify-end px-4 py-4 sm:px-6">
        <ThemeControl />
      </header>

      <main className="flex-1 flex items-center justify-center px-4 pb-12 sm:px-6">
        <section className="w-full max-w-lg rounded-xl border border-border bg-surface p-6 sm:p-8 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface-subtle text-text">
            <ShieldAlert size={20} strokeWidth={2} aria-hidden="true" />
          </div>

          <h1
            ref={headingRef}
            tabIndex={-1}
            className="mt-4 text-2xl font-bold tracking-tight text-text focus:outline-none"
          >
            This account doesn&apos;t have access yet
          </h1>

          <p className="mt-2 text-sm text-text-muted">
            Access to this DisciplineX workspace is currently restricted to the
            configured owner account.
          </p>

          <div className="mt-5 rounded-lg border border-border bg-surface-subtle p-3.5 text-sm">
            <p className="text-text-muted">Signed in as</p>
            <p className="mt-1 font-medium text-text break-words">
              {accountLabel}
              {hasSeparateEmail ? ` (${user.email.trim()})` : ''}
            </p>
          </div>

          {import.meta.env.DEV && !getConfiguredOwnerUid() && Boolean(user?.uid) ? (
            <div className="mt-4 rounded-lg border border-border bg-surface-subtle p-3.5 text-sm text-text">
              Setup: your account ID is{' '}
              <code className="select-all rounded bg-surface px-1.5 py-0.5 font-mono text-xs border border-border">
                {user.uid}
              </code>
              . Put it in .env.local as VITE_OWNER_UID and restart the dev
              server.
            </div>
          ) : null}

          {error ? (
            <div
              role="alert"
              className="mt-4 flex items-start justify-between gap-3 rounded-lg border border-border bg-surface-subtle p-3.5 text-sm text-text"
            >
              <div className="flex items-start gap-2.5">
                <AlertCircle
                  size={18}
                  strokeWidth={2}
                  aria-hidden="true"
                  className="mt-0.5 shrink-0"
                />
                <p>{error.message}</p>
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

          <div className="mt-6">
            <button
              type="button"
              onClick={signOut}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-surface-subtle px-4 py-2.5 text-sm font-semibold text-text transition-colors duration-150 hover:bg-surface motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <LogOut size={16} strokeWidth={2} aria-hidden="true" />
              <span>Sign out</span>
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}
