import { Clock } from 'lucide-react'

export default function TodayProgressCard({ completedCount, totalCount }) {
  const fillPercent =
    totalCount > 0
      ? Math.min(100, Math.max(0, (completedCount / totalCount) * 100))
      : 0

  return (
    <section
      aria-labelledby="today-progress-title"
      className="rounded-lg border border-border bg-surface p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2
          id="today-progress-title"
          className="text-base font-semibold text-text"
        >
          Today&apos;s progress
        </h2>
        <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-subtle px-2 py-0.5 text-xs font-medium text-text-muted">
          <Clock size={14} strokeWidth={2} aria-hidden="true" />
          <span>Day in progress</span>
        </span>
      </div>

      <p className="mt-3 text-xl font-bold text-text">
        {completedCount} of {totalCount} habits completed
      </p>

      <div
        role="progressbar"
        aria-label="Today's habit completion"
        aria-valuemin={0}
        aria-valuemax={totalCount}
        aria-valuenow={completedCount}
        aria-valuetext={`${completedCount} of ${totalCount} habits completed`}
        className="mt-3 h-2.5 w-full overflow-hidden rounded-full border border-border bg-surface-subtle"
      >
        <div
          className="h-full bg-primary transition-[width] duration-150 motion-reduce:transition-none"
          style={{ width: `${fillPercent}%` }}
        />
      </div>

      <p className="mt-2.5 text-xs text-text-muted">
        Sample progress count; remaining habits stay pending until day close.
      </p>
    </section>
  )
}
