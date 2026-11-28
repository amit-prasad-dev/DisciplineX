import { AlertCircle, CheckCircle2, Plus, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import EmptyState from '../../components/common/EmptyState.jsx'
import { useHabits } from '../../hooks/useHabits.js'
import { getLocalDateKey } from '../../utils/date.js'
import HabitCard from './components/HabitCard.jsx'
import {
  HabitsInvalidNotice,
  HabitsLoadErrorBlock,
  HabitsLoadingBlock,
  HabitsUnconfirmedBanner,
} from './components/HabitsStatusBlocks.jsx'
import { getHabitsViewState, getInvalidHabitsNotice } from './habitsViewState.js'

export default function HabitsPage() {
  const {
    status,
    activeHabits,
    archivedHabits,
    invalid,
    loadError,
    slowLoad,
    isSaving,
    unconfirmedMessage,
    retry,
    archiveHabit,
    restoreHabit,
  } = useHabits()
  const location = useLocation()
  const navigate = useNavigate()

  const headingRef = useRef(null)
  const listHeadingRef = useRef(null)
  const actionErrorRef = useRef(null)
  const actionLockRef = useRef(false)
  const mountedRef = useRef(false)

  const [viewFilter, setViewFilter] = useState('active')
  const [statusMessage, setStatusMessage] = useState(
    () => location.state?.statusMessage ?? '',
  )
  const [actionError, setActionError] = useState('')
  const [pendingAction, setPendingAction] = useState(null)
  const [actionFocusTick, setActionFocusTick] = useState(0)
  const [errorFocusTick, setErrorFocusTick] = useState(0)

  const todayKey = getLocalDateKey()
  const viewState = getHabitsViewState({ status })
  const invalidNotice = useMemo(
    () => getInvalidHabitsNotice(invalid),
    [invalid],
  )

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

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

  const handleDismissActionError = () => {
    setActionError('')
    headingRef.current?.focus()
  }

  const runHabitAction = async (habit, actionFn, actionType, successVerb) => {
    if (actionLockRef.current || isSaving || viewState === 'unconfirmed') {
      return
    }

    actionLockRef.current = true
    setPendingAction({ habitId: habit.id, type: actionType })

    try {
      const result = await actionFn(habit.id)
      if (!mountedRef.current) {
        return
      }

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
      if (mountedRef.current) {
        setPendingAction(null)
      }
    }
  }

  const handleArchive = (habit) => {
    runHabitAction(habit, archiveHabit, 'archive', 'archived')
  }

  const handleRestore = (habit) => {
    runHabitAction(habit, restoreHabit, 'restore', 'restored')
  }

  const totalHabitsCount = activeHabits.length + archivedHabits.length
  const displayedHabits =
    viewFilter === 'active' ? activeHabits : archivedHabits
  const isMutatingDisabled = isSaving || viewState === 'unconfirmed'

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

        {viewState === 'ready' ? (
          <Link
            to="/habits/new"
            className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity duration-150 hover:opacity-90 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <Plus size={16} strokeWidth={2} aria-hidden="true" />
            <span>New habit</span>
          </Link>
        ) : null}
      </div>

      {viewState === 'loading' ? (
        <HabitsLoadingBlock slowLoad={slowLoad} />
      ) : viewState === 'loadError' ? (
        <HabitsLoadErrorBlock loadError={loadError} onRetry={retry} />
      ) : (
        <>
          {viewState === 'unconfirmed' ? (
            <HabitsUnconfirmedBanner message={unconfirmedMessage} />
          ) : null}

          <HabitsInvalidNotice notice={invalidNotice} />

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
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-subtle px-4 py-3 text-sm text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <div className="flex items-center gap-2">
                <AlertCircle
                  size={18}
                  strokeWidth={2}
                  aria-hidden="true"
                  className="shrink-0 text-text"
                />
                <span>{actionError}</span>
              </div>

              <button
                type="button"
                aria-label="Dismiss error"
                onClick={handleDismissActionError}
                className="inline-flex min-h-9 min-w-9 shrink-0 items-center justify-center rounded-md border border-border bg-surface p-1.5 text-text hover:bg-surface-subtle transition-colors duration-150 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <X size={16} strokeWidth={2} aria-hidden="true" />
              </button>
            </div>
          ) : null}

          {totalHabitsCount === 0 ? (
            <EmptyState
              title="No habits yet"
              description="Create your first habit to start tracking your daily routine."
              actionLabel={
                viewState === 'ready' ? 'Create your first habit' : undefined
              }
              actionTo={viewState === 'ready' ? '/habits/new' : undefined}
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

              <section
                aria-labelledby="habits-list-heading"
                className="space-y-4"
              >
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
                        {viewState === 'ready' ? (
                          <Link
                            to="/habits/new"
                            className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity duration-150 hover:opacity-90 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                          >
                            New habit
                          </Link>
                        ) : null}
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
                          isMutatingDisabled={isMutatingDisabled}
                          pendingAction={
                            pendingAction?.habitId === habit.id
                              ? pendingAction.type
                              : null
                          }
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          )}
        </>
      )}
    </div>
  )
}
