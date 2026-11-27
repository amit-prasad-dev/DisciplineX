import {
  Calendar,
  CalendarOff,
  CheckCircle2,
  CircleMinus,
  Clock,
} from 'lucide-react'
import { WEEK_START_DAY } from '../../../utils/date.js'

const DAY_STATE_CONFIG = {
  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    cardClass: 'border-solid border-primary bg-primary/10 text-text',
    badgeClass: 'text-primary font-semibold',
  },
  missed: {
    label: 'Missed',
    icon: CircleMinus,
    cardClass: 'border-dashed border-border bg-surface-subtle text-text',
    badgeClass: 'text-text-muted font-medium',
  },
  pending: {
    label: 'Pending',
    icon: Clock,
    cardClass: 'border-2 border-solid border-primary bg-surface text-text',
    badgeClass: 'text-text font-semibold',
  },
  not_scheduled: {
    label: 'Not scheduled',
    icon: CalendarOff,
    cardClass: 'border-dotted border-border bg-bg text-text-muted',
    badgeClass: 'text-text-muted font-medium',
  },
  upcoming: {
    label: 'Upcoming',
    icon: Calendar,
    cardClass: 'border-solid border-border bg-bg text-text-muted',
    badgeClass: 'text-text-muted font-medium',
  },
}

export default function WeeklyOverviewCard({ days }) {
  return (
    <section
      aria-labelledby="weekly-overview-title"
      className="rounded-lg border border-border bg-surface p-5 lg:col-span-2"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2
            id="weekly-overview-title"
            className="text-base font-semibold text-text"
          >
            Weekly overview
          </h2>
          <p className="mt-0.5 text-xs text-text-muted">
            Week starting {WEEK_START_DAY}
          </p>
        </div>
        <span className="rounded border border-border bg-surface-subtle px-2 py-0.5 text-xs font-medium text-text-muted">
          Sample
        </span>
      </div>

      <ul
        aria-label="Weekly overview"
        className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-7 list-none p-0 m-0"
      >
        {days.map((day) => {
          const config =
            DAY_STATE_CONFIG[day.sampleState] ?? DAY_STATE_CONFIG.upcoming
          const StatusIcon = config.icon
          const accessibleLabel = `${day.fullDay} ${day.dateNumber}: ${config.label}${
            day.isToday ? ' (Today)' : ''
          }`

          return (
            <li
              key={day.id}
              aria-label={accessibleLabel}
              className={`flex flex-col justify-between gap-2 rounded-md border p-3 ${config.cardClass}`}
            >
              <div className="flex items-baseline justify-between gap-1">
                <span className="text-xs font-semibold text-text">
                  {day.shortDay}
                  {day.isToday ? ' (Today)' : ''}
                </span>
                <span className="text-sm font-bold text-text">
                  {day.dateNumber}
                </span>
              </div>

              <div className={`flex items-center gap-1.5 text-xs ${config.badgeClass}`}>
                <StatusIcon
                  size={14}
                  strokeWidth={2}
                  aria-hidden="true"
                  className="shrink-0"
                />
                <span>{config.label}</span>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
