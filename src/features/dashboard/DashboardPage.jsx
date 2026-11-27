import { useState } from 'react'
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

const VIEW_MODES = [
  { value: 'sample', label: 'Sample data' },
  { value: 'empty', label: 'Empty state' },
]

export default function DashboardPage() {
  const [viewMode, setViewMode] = useState('sample')
  const [todayLabel] = useState(() => formatLocalDate(new Date()))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Dashboard</h1>
          <p className="mt-1 text-sm text-text-muted">{todayLabel}</p>
        </div>

        <div
          role="group"
          aria-label="Dashboard view mode"
          className="flex flex-wrap items-center gap-1.5"
        >
          {VIEW_MODES.map((mode) => {
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
      ) : (
        <div className="rounded-lg border border-border bg-surface p-6">
          <p className="text-sm text-text-muted">
            No habits or daily logs recorded yet.
          </p>
        </div>
      )}
    </div>
  )
}
