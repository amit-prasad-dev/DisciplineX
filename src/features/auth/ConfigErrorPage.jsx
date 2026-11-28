import { AlertTriangle } from 'lucide-react'
import { useEffect, useRef } from 'react'
import ThemeControl from '../../components/layout/ThemeControl.jsx'

export default function ConfigErrorPage({ configError }) {
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
        <section
          role="alert"
          className="w-full max-w-lg rounded-xl border border-border bg-surface p-6 sm:p-8 shadow-sm"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface-subtle text-text">
            <AlertTriangle size={20} strokeWidth={2} aria-hidden="true" />
          </div>

          <h1
            ref={headingRef}
            tabIndex={-1}
            className="mt-4 text-2xl font-bold tracking-tight text-text focus:outline-none"
          >
            App configuration needed
          </h1>

          <p className="mt-2 text-sm text-text-muted">
            DisciplineX is not configured yet because required Firebase
            environment settings are missing or still placeholders.
          </p>

          {configError ? (
            <p className="mt-4 rounded-lg border border-border bg-surface-subtle p-3.5 text-sm font-medium text-text break-words">
              {configError}
            </p>
          ) : null}

          <p className="mt-4 text-sm text-text-muted">
            Copy .env.example to .env.local and fill in the values, then restart
            the dev server.
          </p>
        </section>
      </main>
    </div>
  )
}
