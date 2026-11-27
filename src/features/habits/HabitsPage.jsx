import { CheckCircle2, Plus, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import EmptyState from '../../components/common/EmptyState.jsx'
import { useHabits } from '../../hooks/useHabits.js'

export default function HabitsPage() {
  const { activeHabits } = useHabits()
  const location = useLocation()
  const navigate = useNavigate()
  const headingRef = useRef(null)

  const [statusMessage, setStatusMessage] = useState(
    () => location.state?.statusMessage ?? '',
  )

  useEffect(() => {
    if (location.state?.statusMessage) {
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [location.pathname, location.state, navigate])

  const handleDismissStatus = () => {
    setStatusMessage('')
    headingRef.current?.focus()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-2xl font-bold text-text focus:outline-none"
        >
          My Habits
        </h1>

        <Link
          to="/habits/new"
          className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity duration-150 hover:opacity-90 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <Plus size={16} strokeWidth={2} aria-hidden="true" />
          <span>New habit</span>
        </Link>
      </div>

      <div role="status" aria-live="polite">
        {statusMessage ? (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-primary bg-primary/10 px-4 py-3 text-sm text-text">
            <div className="flex items-center gap-2">
              <CheckCircle2
                size={18}
                strokeWidth={2}
                aria-hidden="true"
                className="shrink-0 text-primary"
              />
              <span className="font-medium">{statusMessage}</span>
            </div>

            <button
              type="button"
              aria-label="Dismiss message"
              onClick={handleDismissStatus}
              className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-md border border-border bg-surface p-1.5 text-text hover:bg-surface-subtle transition-colors duration-150 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <X size={16} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>
        ) : null}
      </div>

      {activeHabits.length === 0 ? (
        <EmptyState
          title="No habits yet"
          description="Create your first habit to start tracking your daily routine."
          actionLabel="Create your first habit"
          actionTo="/habits/new"
        />
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-surface list-none p-0 m-0">
          {activeHabits.map((habit) => (
            <li
              key={habit.id}
              className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
            >
              <span className="text-sm font-semibold text-text">
                {habit.name}
              </span>
              <span className="rounded border border-border bg-surface-subtle px-2.5 py-0.5 text-xs font-medium text-text-muted">
                {habit.category}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
