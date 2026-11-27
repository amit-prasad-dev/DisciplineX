import { AlertCircle } from 'lucide-react'

export default function ErrorState({
  title = 'Unable to load',
  message,
  actionLabel = 'Try again',
  onRetry,
}) {
  return (
    <section
      role="alert"
      className="rounded-lg border border-border bg-surface p-6 sm:p-8"
    >
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface-subtle text-text">
          <AlertCircle size={20} strokeWidth={2} aria-hidden="true" />
        </div>

        <h2 className="mt-4 text-lg font-semibold text-text">{title}</h2>

        <p className="mt-2 text-sm text-text-muted">{message}</p>

        {onRetry ? (
          <div className="mt-6">
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center justify-center rounded-md border border-border bg-surface-subtle px-4 py-2 text-sm font-semibold text-text transition-colors duration-150 hover:bg-surface motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {actionLabel}
            </button>
          </div>
        ) : null}
      </div>
    </section>
  )
}
