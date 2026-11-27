import { describe, expect, it } from 'vitest'
import {
  formatDateKeyForDisplay,
  formatScheduleSummary,
  formatTargetSummary,
  getHabitDisplayInfo,
} from './habitDisplay.js'

describe('formatDateKeyForDisplay', () => {
  it('formats valid YYYY-MM-DD keys from calendar parts', () => {
    expect(formatDateKeyForDisplay('2026-11-27')).toBe('27 Nov 2026')
    expect(formatDateKeyForDisplay('2028-02-29')).toBe('29 Feb 2028')
    expect(formatDateKeyForDisplay('2026-01-05')).toBe('5 Jan 2026')
  })

  it('returns "Date unavailable" for invalid or missing date keys without throwing', () => {
    expect(formatDateKeyForDisplay('2026-02-30')).toBe('Date unavailable')
    expect(formatDateKeyForDisplay('invalid')).toBe('Date unavailable')
    expect(formatDateKeyForDisplay('')).toBe('Date unavailable')
    expect(formatDateKeyForDisplay(null)).toBe('Date unavailable')
    expect(formatDateKeyForDisplay(undefined)).toBe('Date unavailable')
  })
})

describe('formatScheduleSummary', () => {
  it('formats daily schedules as "Every day"', () => {
    expect(formatScheduleSummary({ frequencyType: 'daily' })).toBe('Every day')
  })

  it('formats selected weekdays in Monday-first order', () => {
    expect(
      formatScheduleSummary({
        frequencyType: 'selected_weekdays',
        scheduledWeekdays: ['fri', 'mon', 'wed'],
      }),
    ).toBe('Mon, Wed, Fri')
  })

  it('keeps "Selected weekdays:" prefix when all 7 weekdays are selected', () => {
    expect(
      formatScheduleSummary({
        frequencyType: 'selected_weekdays',
        scheduledWeekdays: ['sun', 'sat', 'fri', 'thu', 'wed', 'tue', 'mon'],
      }),
    ).toBe('Selected weekdays: Mon, Tue, Wed, Thu, Fri, Sat, Sun')
  })
})

describe('formatTargetSummary', () => {
  it('formats boolean targets with and without targetTimeLabel', () => {
    expect(formatTargetSummary({ targetType: 'boolean' }, null)).toBe(
      'Simple completion',
    )
    expect(formatTargetSummary({ targetType: 'boolean' }, '5:00 AM')).toBe(
      'Simple completion · 5:00 AM',
    )
  })

  it('formats numeric targets with and without units', () => {
    expect(
      formatTargetSummary({
        targetType: 'numeric',
        targetValue: 60,
        targetUnit: 'minutes',
      }),
    ).toBe('60 minutes')

    expect(
      formatTargetSummary({
        targetType: 'numeric',
        targetValue: 1,
        targetUnit: 'page',
      }),
    ).toBe('1 page')

    expect(
      formatTargetSummary({
        targetType: 'numeric',
        targetValue: 5,
        targetUnit: null,
      }),
    ).toBe('5')
  })
})

describe('getHabitDisplayInfo', () => {
  it('uses the effective version for today and shows "No end date" when endDate is null', () => {
    const habit = {
      name: 'Core Java',
      startDate: '2026-11-10',
      endDate: null,
      status: 'active',
      targetTimeLabel: null,
      versions: [
        {
          effectiveFrom: '2026-11-10',
          frequencyType: 'selected_weekdays',
          scheduledWeekdays: ['mon', 'wed', 'fri'],
          targetType: 'numeric',
          targetValue: 45,
          targetUnit: 'minutes',
        },
        {
          effectiveFrom: '2026-11-20',
          frequencyType: 'daily',
          scheduledWeekdays: [],
          targetType: 'numeric',
          targetValue: 60,
          targetUnit: 'minutes',
        },
      ],
    }

    const info = getHabitDisplayInfo(habit, '2026-11-27')
    expect(info.scheduleSummary).toBe('Every day')
    expect(info.targetSummary).toBe('60 minutes')
    expect(info.startDateLabel).toBe('10 Nov 2026')
    expect(info.endDateLabel).toBe('No end date')
    expect(info.statusLabel).toBe('Active')
    expect(info.startBadgeLabel).toBeNull()
    expect(info.endBadgeLabel).toBeNull()
  })

  it('falls back to the version with the smallest effectiveFrom (even out of order) when not started yet', () => {
    const futureHabitOutOfOrder = {
      name: 'Wake up early',
      startDate: '2026-12-05',
      endDate: '2026-12-31',
      status: 'active',
      targetTimeLabel: '5:00 AM',
      versions: [
        {
          effectiveFrom: '2026-12-15',
          frequencyType: 'selected_weekdays',
          scheduledWeekdays: ['mon'],
          targetType: 'boolean',
          targetValue: null,
          targetUnit: null,
        },
        {
          effectiveFrom: '2026-12-05',
          frequencyType: 'daily',
          scheduledWeekdays: [],
          targetType: 'boolean',
          targetValue: null,
          targetUnit: null,
        },
      ],
    }

    const info = getHabitDisplayInfo(futureHabitOutOfOrder, '2026-11-27')
    expect(info.scheduleSummary).toBe('Every day')
    expect(info.targetSummary).toBe('Simple completion · 5:00 AM')
    expect(info.startBadgeLabel).toBe('Starts 5 Dec 2026')
    expect(info.endBadgeLabel).toBeNull()
  })

  it('shows "Ended <date>" when endDate is before todayKey', () => {
    const endedHabit = {
      name: 'Reading',
      startDate: '2026-10-01',
      endDate: '2026-11-20',
      status: 'archived',
      targetTimeLabel: null,
      versions: [
        {
          effectiveFrom: '2026-10-01',
          frequencyType: 'daily',
          scheduledWeekdays: [],
          targetType: 'numeric',
          targetValue: 20,
          targetUnit: 'pages',
        },
      ],
    }

    const info = getHabitDisplayInfo(endedHabit, '2026-11-27')
    expect(info.statusLabel).toBe('Archived')
    expect(info.endBadgeLabel).toBe('Ended 20 Nov 2026')
  })
})
