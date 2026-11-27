import { ListPlus } from 'lucide-react'
import { Link } from 'react-router'

export default function EmptyState({
  title,
  description,
  actionLabel,
  actionTo,
  metricLabel,
  metricValue,
  metricHint,
}) {
  return (
    <section
      aria-labelledby="empty-state-title"
      className="rounded-lg border border-border bg-surface p-6 sm:p-8"
    >
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface-subtle text-primary">
          <ListPlus size={20} strokeWidth={2} aria-hidden="true" />
        </div>

        <h2
          id="empty-state-title"
          className="mt-4 text-lg font-semibold text-text"
        >
          {title}
        </h2>

        <p className="mt-2 text-sm text-text-muted">{description}</p>

        {metricLabel ? (
          <div className="mt-5 rounded-md border border-border bg-surface-subtle px-4 py-3 text-left">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs font-medium text-text-muted">
                {metricLabel}
              </span>
              <span className="text-base font-bold text-text">
                {metricValue}
              </span>
            </div>
            {metricHint ? (
              <p className="mt-1 text-xs text-text-muted">{metricHint}</p>
            ) : null}
          </div>
        ) : null}

        {actionLabel && actionTo ? (
          <div className="mt-6">
            <Link
              to={actionTo}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity duration-150 hover:opacity-90 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {actionLabel}
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  )
}
