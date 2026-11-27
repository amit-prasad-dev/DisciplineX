import {
  Archive,
  Calendar,
  CheckCircle2,
  Clock,
  Pencil,
  RotateCcw,
} from 'lucide-react'
import { Link } from 'react-router'
import { getHabitDisplayInfo } from '../habitDisplay.js'

export default function HabitCard({ habit, todayKey, onArchive, onRestore }) {
  const display = getHabitDisplayInfo(habit, todayKey)
  const isArchived = habit.status === 'archived'
  const StatusIcon = isArchived ? Archive : CheckCircle2
  const headingId = `habit-card-title-${habit.id}`

  return (
    <article
      aria-labelledby={headingId}
      className="flex h-full flex-col justify-between gap-4 rounded-lg border border-border bg-surface p-5"
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 id={headingId} className="text-base font-semibold text-text">
              {habit.name}
            </h2>
            <p className="mt-1 inline-block rounded border border-border bg-surface-subtle px-2 py-0.5 text-xs font-medium text-text-muted">
              {habit.category}
            </p>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium ${
              isArchived
                ? 'border-dashed border-border bg-surface-subtle text-text-muted'
                : 'border-primary bg-primary/10 text-primary font-semibold'
            }`}
          >
            <StatusIcon size={14} strokeWidth={2} aria-hidden="true" />
            <span>{display.statusLabel}</span>
          </span>
        </div>

        {habit.description ? (
          <p className="text-sm text-text-muted">{habit.description}</p>
        ) : null}

        {display.startBadgeLabel || display.endBadgeLabel ? (
          <div className="flex flex-wrap gap-2">
            {display.startBadgeLabel ? (
              <span className="inline-flex items-center gap-1.5 rounded border border-border bg-surface-subtle px-2 py-0.5 text-xs font-medium text-text">
                <Clock size={13} strokeWidth={2} aria-hidden="true" />
                <span>{display.startBadgeLabel}</span>
              </span>
            ) : null}
            {display.endBadgeLabel ? (
              <span className="inline-flex items-center gap-1.5 rounded border border-dashed border-border bg-surface-subtle px-2 py-0.5 text-xs font-medium text-text-muted">
                <Calendar size={13} strokeWidth={2} aria-hidden="true" />
                <span>{display.endBadgeLabel}</span>
              </span>
            ) : null}
          </div>
        ) : null}

        <dl className="grid grid-cols-1 gap-2 rounded-md border border-border bg-surface-subtle p-3 text-xs sm:grid-cols-2">
          <div>
            <dt className="font-medium text-text-muted">Schedule</dt>
            <dd className="mt-0.5 font-semibold text-text">
              {display.scheduleSummary}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-text-muted">Target</dt>
            <dd className="mt-0.5 font-semibold text-text">
              {display.targetSummary}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-text-muted">Start date</dt>
            <dd className="mt-0.5 font-semibold text-text">
              {display.startDateLabel}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-text-muted">End date</dt>
            <dd className="mt-0.5 font-semibold text-text">
              {display.endDateLabel}
            </dd>
          </div>
        </dl>
      </div>

      <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-3">
        {isArchived ? (
          <button
            type="button"
            aria-label={`Restore ${habit.name}`}
            onClick={() => onRestore(habit)}
            className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border bg-surface-subtle px-3.5 py-2 text-sm font-medium text-text transition-colors duration-150 hover:bg-surface motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <RotateCcw size={15} strokeWidth={2} aria-hidden="true" />
            <span>Restore</span>
          </button>
        ) : (
          <>
            <Link
              to={`/habits/${habit.id}/edit`}
              aria-label={`Edit ${habit.name}`}
              className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border bg-surface-subtle px-3.5 py-2 text-sm font-medium text-text transition-colors duration-150 hover:bg-surface motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <Pencil size={15} strokeWidth={2} aria-hidden="true" />
              <span>Edit</span>
            </Link>
            <button
              type="button"
              aria-label={`Archive ${habit.name}`}
              onClick={() => onArchive(habit)}
              className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border bg-surface-subtle px-3.5 py-2 text-sm font-medium text-text transition-colors duration-150 hover:bg-surface motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <Archive size={15} strokeWidth={2} aria-hidden="true" />
              <span>Archive</span>
            </button>
          </>
        )}
      </div>
    </article>
  )
}
