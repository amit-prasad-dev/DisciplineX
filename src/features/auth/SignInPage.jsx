import { AlertCircle, LogIn, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import ThemeControl from '../../components/layout/ThemeControl.jsx'
import { useAuth } from '../../hooks/useAuth.js'

export default function SignInPage() {
  const { error, isSigningIn, signIn, clearError } = useAuth()
  const headingRef = useRef(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col">
      <header className="flex items-center justify-end px-4 py-4 sm:px-6">
        <ThemeControl />
      </header>

      <main className="flex-1 flex items-center justify-center px-4 pb-12 sm:px-6">
        <section className="w-full max-w-md rounded-xl border border-border bg-surface p-6 sm:p-8 shadow-sm">
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="text-2xl font-bold tracking-tight text-text focus:outline-none"
          >
            Sign in to DisciplineX
          </h1>
          <p className="mt-2 text-sm text-text-muted">
            Build Discipline. Master Consistency.
          </p>

          {error ? (
            <div
              role="alert"
              className="mt-6 flex items-start justify-between gap-3 rounded-lg border border-border bg-surface-subtle p-3.5 text-sm text-text"
            >
              <div className="flex items-start gap-2.5">
                <AlertCircle
                  size={18}
                  strokeWidth={2}
                  aria-hidden="true"
                  className="mt-0.5 shrink-0 text-text"
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
              disabled={isSigningIn}
              onClick={signIn}
              className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity duration-150 hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <LogIn size={18} strokeWidth={2} aria-hidden="true" />
              <span>{isSigningIn ? 'Signing in…' : 'Continue with Google'}</span>
            </button>
          </div>

          <div role="status" aria-live="polite" className="sr-only">
            {isSigningIn ? 'Signing in…' : ''}
          </div>
        </section>
      </main>
    </div>
  )
}
