import { AlertTriangle, RotateCw } from 'lucide-react'
import ErrorState from '../../../components/common/ErrorState.jsx'
import LoadingState from '../../../components/common/LoadingState.jsx'

export function HabitsLoadingBlock({ slowLoad }) {
  return (
    <div className="space-y-3">
      <LoadingState label="Loading habits" />
      {slowLoad ? (
        <p role="status" className="text-sm text-text-muted">
          Still loading… check your connection.
        </p>
      ) : null}
    </div>
  )
}

export function HabitsLoadErrorBlock({ loadError, onRetry }) {
  return (
    <ErrorState
      title="Couldn't load habits"
      message={loadError ?? "Couldn't load your habits. Please try again."}
      actionLabel="Retry"
      onRetry={onRetry}
    />
  )
}

export function HabitsUnconfirmedBanner({ message }) {
  return (
    <section
      role="alert"
      className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-surface-subtle p-4 text-sm text-text"
    >
      <div className="flex items-start gap-3 min-w-0">
        <AlertTriangle
          size={18}
          strokeWidth={2}
          aria-hidden="true"
          className="mt-0.5 shrink-0 text-text"
        />
        <p className="font-medium">
          {message ??
            "Couldn't confirm the last save. Reload the page to see what was saved."}
        </p>
      </div>

      <button
        type="button"
        onClick={() => window.location.reload()}
        className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md border border-border bg-surface px-4 py-2 text-sm font-semibold text-text hover:bg-surface-subtle transition-colors duration-150 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <RotateCw size={16} strokeWidth={2} aria-hidden="true" />
        <span>Reload page</span>
      </button>
    </section>
  )
}

export function HabitsInvalidNotice({ notice }) {
  if (!notice) {
    return null
  }

  return (
    <section
      aria-label="Hidden habits notice"
      className="rounded-lg border border-border bg-surface-subtle p-4 text-sm text-text space-y-1"
    >
      <p className="font-medium">{notice.summary}</p>
      {notice.idsLine ? (
        <p className="text-xs font-mono text-text-muted break-all">
          {notice.idsLine}
        </p>
      ) : null}
    </section>
  )
}
