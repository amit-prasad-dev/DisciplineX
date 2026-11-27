import { AlertCircle, CheckCircle2, Plus, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import EmptyState from '../../components/common/EmptyState.jsx'
import { useHabits } from '../../hooks/useHabits.js'
import { getLocalDateKey } from '../../utils/date.js'
import HabitCard from './components/HabitCard.jsx'

export default function HabitsPage() {
  const { activeHabits, archivedHabits, archiveHabit, restoreHabit } =
    useHabits()
  const location = useLocation()
  const navigate = useNavigate()

  const headingRef = useRef(null)
  const listHeadingRef = useRef(null)
  const actionErrorRef = useRef(null)
  const actionLockRef = useRef(false)

  const [viewFilter, setViewFilter] = useState('active')
  const [statusMessage, setStatusMessage] = useState(
    () => location.state?.statusMessage ?? '',
  )
  const [actionError, setActionError] = useState('')
  const [actionFocusTick, setActionFocusTick] = useState(0)
  const [errorFocusTick, setErrorFocusTick] = useState(0)

  const todayKey = getLocalDateKey()

  useEffect(() => {
    if (location.state?.statusMessage) {
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [location.pathname, location.state, navigate])

  useEffect(() => {
    if (actionFocusTick > 0) {
      listHeadingRef.current?.focus()
    }
  }, [actionFocusTick])

  useEffect(() => {
    if (errorFocusTick > 0) {
      actionErrorRef.current?.focus()
    }
  }, [errorFocusTick])

  const handleSelectView = (nextView) => {
    setViewFilter(nextView)
    setActionError('')
  }

  const handleDismissStatus = () => {
    setStatusMessage('')
    headingRef.current?.focus()
  }

  const runHabitAction = (habit, actionFn, successVerb) => {
    if (actionLockRef.current) {
      return
    }

    actionLockRef.current = true
    try {
      const result = actionFn(habit.id)
      if (!result.ok) {
        setActionError(result.errors?.form ?? 'Unable to update habit.')
        setErrorFocusTick((tick) => tick + 1)
        return
      }

      setActionError('')
      setStatusMessage(`${habit.name} ${successVerb}`)
      setActionFocusTick((tick) => tick + 1)
    } finally {
      actionLockRef.current = false
    }
  }

  const handleArchive = (habit) => {
    runHabitAction(habit, archiveHabit, 'archived')
  }

  const handleRestore = (habit) => {
    runHabitAction(habit, restoreHabit, 'restored')
  }

  const totalHabitsCount = activeHabits.length + archivedHabits.length
  const displayedHabits =
    viewFilter === 'active' ? activeHabits : archivedHabits

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

      {actionError ? (
        <div
          ref={actionErrorRef}
          tabIndex={-1}
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-border bg-surface-subtle px-4 py-3 text-sm text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <AlertCircle
            size={18}
            strokeWidth={2}
            aria-hidden="true"
            className="shrink-0 text-text"
          />
          <span>{actionError}</span>
        </div>
      ) : null}

      {totalHabitsCount === 0 ? (
        <EmptyState
          title="No habits yet"
          description="Create your first habit to start tracking your daily routine."
          actionLabel="Create your first habit"
          actionTo="/habits/new"
        />
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <div
              role="group"
              aria-label="Filter habits by status"
              className="flex flex-wrap items-center gap-2"
            >
              <button
                type="button"
                aria-pressed={viewFilter === 'active'}
                onClick={() => handleSelectView('active')}
                className={`min-h-11 rounded-md border px-3.5 py-2 text-sm transition-colors duration-150 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                  viewFilter === 'active'
                    ? 'border-primary bg-primary text-primary-foreground font-semibold'
                    : 'border-border bg-surface-subtle text-text hover:bg-surface'
                }`}
              >
                Active ({activeHabits.length})
              </button>

              <button
                type="button"
                aria-pressed={viewFilter === 'archived'}
                onClick={() => handleSelectView('archived')}
                className={`min-h-11 rounded-md border px-3.5 py-2 text-sm transition-colors duration-150 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                  viewFilter === 'archived'
                    ? 'border-primary bg-primary text-primary-foreground font-semibold'
                    : 'border-border bg-surface-subtle text-text hover:bg-surface'
                }`}
              >
                Archived ({archivedHabits.length})
              </button>
            </div>

            <p className="text-xs text-text-muted">
              {viewFilter === 'active'
                ? 'Archiving hides a habit from future checklists and keeps its history.'
                : 'Archived habits keep their history and can be restored anytime.'}
            </p>
          </div>

          <section aria-labelledby="habits-list-heading" className="space-y-4">
            <h2
              id="habits-list-heading"
              ref={listHeadingRef}
              tabIndex={-1}
              className="text-base font-semibold text-text focus:outline-none"
            >
              {viewFilter === 'active'
                ? `Active habits (${activeHabits.length})`
                : `Archived habits (${archivedHabits.length})`}
            </h2>

            {displayedHabits.length === 0 ? (
              <div className="rounded-lg border border-border bg-surface p-6 text-sm text-text-muted">
                {viewFilter === 'active' ? (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p>No active habits</p>
                    <Link
                      to="/habits/new"
                      className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity duration-150 hover:opacity-90 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      New habit
                    </Link>
                  </div>
                ) : (
                  <p>No archived habits</p>
                )}
              </div>
            ) : (
              <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2 list-none p-0 m-0">
                {displayedHabits.map((habit) => (
                  <li key={habit.id}>
                    <HabitCard
                      habit={habit}
                      todayKey={todayKey}
                      onArchive={handleArchive}
                      onRestore={handleRestore}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
