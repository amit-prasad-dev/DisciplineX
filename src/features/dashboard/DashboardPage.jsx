import { useEffect, useRef, useState } from 'react'
import EmptyState from '../../components/common/EmptyState.jsx'
import ErrorState from '../../components/common/ErrorState.jsx'
import LoadingState from '../../components/common/LoadingState.jsx'
import { formatLocalDate } from '../../utils/date.js'
import SampleDataBanner from './SampleDataBanner.jsx'
import ActiveChallengeCard from './components/ActiveChallengeCard.jsx'
import StreakSummaryCard from './components/StreakSummaryCard.jsx'
import TodayHabitsCard from './components/TodayHabitsCard.jsx'
import TodayHeaderCard from './components/TodayHeaderCard.jsx'
import TodayProgressCard from './components/TodayProgressCard.jsx'
import WeeklyOverviewCard from './components/WeeklyOverviewCard.jsx'
import {
  SAMPLE_ACTIVE_CHALLENGE,
  SAMPLE_HABITS,
  SAMPLE_SUMMARY,
  SAMPLE_WEEKLY_VALUES,
} from './mockData.js'

const PREVIEW_STATES = [
  { value: 'sample', label: 'Sample data' },
  { value: 'empty', label: 'Empty' },
  { value: 'loading', label: 'Loading' },
  { value: 'error', label: 'Error' },
]

function DashboardSkeleton() {
  const pulse = 'animate-pulse motion-reduce:animate-none'

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div
        className={`rounded-lg border border-border bg-surface p-5 lg:col-span-2 space-y-2.5 ${pulse}`}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="h-5 w-20 rounded bg-surface-subtle" />
          <div className="h-4 w-40 rounded bg-surface-subtle" />
        </div>
        <div className="h-4 w-64 rounded bg-surface-subtle" />
      </div>

      <div
        className={`rounded-lg border border-border bg-surface p-5 space-y-3 ${pulse}`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="h-5 w-32 rounded bg-surface-subtle" />
          <div className="h-5 w-28 rounded bg-surface-subtle" />
        </div>
        <div className="h-6 w-48 rounded bg-surface-subtle" />
        <div className="h-2.5 w-full rounded-full bg-surface-subtle" />
        <div className="h-3.5 w-56 rounded bg-surface-subtle" />
      </div>

      <div
        className={`rounded-lg border border-border bg-surface p-5 space-y-4 ${pulse}`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="h-5 w-32 rounded bg-surface-subtle" />
          <div className="h-5 w-14 rounded bg-surface-subtle" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="h-16 rounded-md bg-surface-subtle" />
          <div className="h-16 rounded-md bg-surface-subtle" />
        </div>
        <div className="h-3.5 w-48 rounded bg-surface-subtle" />
      </div>

      <div
        className={`rounded-lg border border-border bg-surface p-5 lg:col-span-2 space-y-4 ${pulse}`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="h-5 w-32 rounded bg-surface-subtle" />
          <div className="h-5 w-14 rounded bg-surface-subtle" />
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-7">
          {Array.from({ length: 7 }, (_, index) => (
            <div key={index} className="h-16 rounded-md bg-surface-subtle" />
          ))}
        </div>
      </div>

      <div
        className={`rounded-lg border border-border bg-surface p-5 lg:col-span-2 space-y-3 ${pulse}`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="h-5 w-36 rounded bg-surface-subtle" />
          <div className="h-5 w-24 rounded bg-surface-subtle" />
        </div>
        <div className="h-6 w-52 rounded bg-surface-subtle" />
        <div className="h-2.5 w-full rounded-full bg-surface-subtle" />
        <div className="h-3.5 w-72 rounded bg-surface-subtle" />
      </div>

      <div
        className={`rounded-lg border border-border bg-surface p-5 lg:col-span-2 space-y-3 ${pulse}`}
      >
        <div className="h-5 w-32 rounded bg-surface-subtle" />
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-11 rounded-md bg-surface-subtle" />
        ))}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [viewMode, setViewMode] = useState('sample')
  const [todayLabel] = useState(() => formatLocalDate(new Date()))
  const stateRegionRef = useRef(null)
  const shouldFocusRegionRef = useRef(false)

  useEffect(() => {
    if (shouldFocusRegionRef.current) {
      shouldFocusRegionRef.current = false
      stateRegionRef.current?.focus()
    }
  }, [viewMode])

  const handleRetry = () => {
    shouldFocusRegionRef.current = true
    setViewMode('sample')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Dashboard</h1>
          <p className="mt-1 text-sm text-text-muted">{todayLabel}</p>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-text-muted">
            Temporary preview (dev only — removed when real data arrives)
          </p>
          <div
            role="group"
            aria-label="Temporary preview state"
            className="flex flex-wrap items-center gap-1.5"
          >
            {PREVIEW_STATES.map((mode) => {
              const isSelected = viewMode === mode.value
              return (
                <button
                  key={mode.value}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setViewMode(mode.value)}
                  className={`px-2.5 py-1.5 text-xs sm:text-sm rounded-md border transition-colors duration-150 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary font-semibold'
                      : 'bg-surface-subtle text-text border-border hover:bg-surface'
                  }`}
                >
                  {mode.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div
        ref={stateRegionRef}
        tabIndex={-1}
        className="focus:outline-none"
      >
        {viewMode === 'sample' ? (
          <div className="space-y-4">
            <SampleDataBanner />
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <TodayHeaderCard todayLabel={todayLabel} />
              <TodayProgressCard
                completedCount={SAMPLE_SUMMARY.sampleCompletedTodayCount}
                totalCount={SAMPLE_SUMMARY.sampleActiveCount}
              />
              <StreakSummaryCard
                currentStreakDays={SAMPLE_SUMMARY.sampleCurrentStreakDays}
                longestStreakDays={SAMPLE_SUMMARY.sampleLongestStreakDays}
              />
              <WeeklyOverviewCard days={SAMPLE_WEEKLY_VALUES} />
              <ActiveChallengeCard challenge={SAMPLE_ACTIVE_CHALLENGE} />
              <TodayHabitsCard habits={SAMPLE_HABITS} />
            </div>
          </div>
        ) : null}

        {viewMode === 'empty' ? (
          <EmptyState
            title="No habits yet"
            description="Create your first habit to start tracking your daily routine, streaks, and progress."
            actionLabel="Create your first habit"
            actionTo="/habits/new"
            metricLabel="Today's completion rate"
            metricValue="—"
            metricHint="Shown as — when there are no eligible scheduled opportunities."
          />
        ) : null}

        {viewMode === 'loading' ? (
          <LoadingState label="Loading">
            <DashboardSkeleton />
          </LoadingState>
        ) : null}

        {viewMode === 'error' ? (
          <ErrorState
            title="Unable to load dashboard"
            message="Something went wrong loading your dashboard"
            actionLabel="Try again"
            onRetry={handleRetry}
          />
        ) : null}
      </div>
    </div>
  )
}
