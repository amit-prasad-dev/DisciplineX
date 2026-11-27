export default function TodayHeaderCard({ todayLabel }) {
  return (
    <section
      aria-labelledby="today-header-title"
      className="rounded-lg border border-border bg-surface p-5 lg:col-span-2"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2
          id="today-header-title"
          className="text-base font-semibold text-text"
        >
          Today
        </h2>
        <span className="text-sm font-medium text-text-muted">{todayLabel}</span>
      </div>
      <p className="mt-1.5 text-sm text-text-muted">
        Overview of your scheduled habits for today.
      </p>
    </section>
  )
}
