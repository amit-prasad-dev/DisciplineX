export default function StreakSummaryCard({
  currentStreakDays,
  longestStreakDays,
}) {
  return (
    <section
      aria-labelledby="streak-summary-title"
      className="rounded-lg border border-border bg-surface p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2
          id="streak-summary-title"
          className="text-base font-semibold text-text"
        >
          Streak summary
        </h2>
        <span className="rounded border border-border bg-surface-subtle px-2 py-0.5 text-xs font-medium text-text-muted">
          Sample
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-md border border-border bg-surface-subtle p-3">
          <dt className="text-xs font-medium text-text-muted">Current streak</dt>
          <dd className="mt-1 text-xl font-bold text-text">
            {currentStreakDays} days
          </dd>
        </div>

        <div className="rounded-md border border-border bg-surface-subtle p-3">
          <dt className="text-xs font-medium text-text-muted">Longest streak</dt>
          <dd className="mt-1 text-xl font-bold text-text">
            {longestStreakDays} days
          </dd>
        </div>
      </dl>

      <p className="mt-3 text-xs text-text-muted">
        Fixed sample streak values shown for preview.
      </p>
    </section>
  )
}
