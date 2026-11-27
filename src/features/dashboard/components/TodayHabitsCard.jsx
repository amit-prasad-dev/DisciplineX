import { CheckCircle2, Clock } from 'lucide-react'

export default function TodayHabitsCard({ habits }) {
  return (
    <section
      aria-labelledby="today-habits-title"
      className="rounded-lg border border-border bg-surface p-5 lg:col-span-2"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2
          id="today-habits-title"
          className="text-base font-semibold text-text"
        >
          Today&apos;s habits
        </h2>
        <span className="text-xs font-medium text-text-muted">
          Read-only sample list
        </span>
      </div>

      <ul className="mt-4 divide-y divide-border list-none p-0 m-0">
        {habits.map((habit) => {
          const isCompleted = habit.sampleTodayStatus === 'completed'
          const StatusIcon = isCompleted ? CheckCircle2 : Clock
          const statusLabel = isCompleted ? 'Completed' : 'Pending'

          return (
            <li
              key={habit.id}
              className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text">{habit.name}</p>
                <p className="text-xs text-text-muted mt-0.5">
                  {habit.category} &middot; {habit.targetLabel}
                </p>
              </div>

              <span
                className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium ${
                  isCompleted
                    ? 'border-primary bg-primary/10 text-primary font-semibold'
                    : 'border-border bg-surface-subtle text-text-muted'
                }`}
              >
                <StatusIcon size={14} strokeWidth={2} aria-hidden="true" />
                <span>{statusLabel}</span>
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
