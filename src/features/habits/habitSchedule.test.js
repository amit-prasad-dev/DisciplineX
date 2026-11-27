import { describe, expect, it } from 'vitest'
import { getEffectiveVersion, isHabitScheduledOn } from './habitSchedule.js'

const versionedHabit = {
  id: 'habit-dsa',
  name: 'DSA practice',
  category: 'Learning',
  startDate: '2026-11-02',
  endDate: '2026-11-30',
  status: 'active',
  versions: [
    {
      effectiveFrom: '2026-11-02',
      frequencyType: 'selected_weekdays',
      scheduledWeekdays: ['mon', 'wed', 'fri'],
      targetType: 'numeric',
      targetValue: 2,
      targetUnit: 'problems',
    },
    {
      effectiveFrom: '2026-11-16',
      frequencyType: 'daily',
      scheduledWeekdays: [],
      targetType: 'numeric',
      targetValue: 3,
      targetUnit: 'problems',
    },
  ],
}

describe('getEffectiveVersion', () => {
  it('returns null when dateKey is before the first version', () => {
    expect(getEffectiveVersion(versionedHabit, '2026-11-01')).toBeNull()
  })

  it('returns the matching version on exact effectiveFrom and before/after a change', () => {
    expect(
      getEffectiveVersion(versionedHabit, '2026-11-02')?.effectiveFrom,
    ).toBe('2026-11-02')
    expect(
      getEffectiveVersion(versionedHabit, '2026-11-15')?.frequencyType,
    ).toBe('selected_weekdays')
    expect(
      getEffectiveVersion(versionedHabit, '2026-11-16')?.frequencyType,
    ).toBe('daily')
    expect(
      getEffectiveVersion(versionedHabit, '2026-11-20')?.targetValue,
    ).toBe(3)
  })

  it('does not depend on the order of the versions array', () => {
    const outOfOrderHabit = {
      ...versionedHabit,
      versions: [versionedHabit.versions[1], versionedHabit.versions[0]],
    }

    expect(
      getEffectiveVersion(outOfOrderHabit, '2026-11-15')?.effectiveFrom,
    ).toBe('2026-11-02')
    expect(
      getEffectiveVersion(outOfOrderHabit, '2026-11-16')?.effectiveFrom,
    ).toBe('2026-11-16')
    expect(getEffectiveVersion(outOfOrderHabit, '2026-11-01')).toBeNull()
  })

  it('throws on invalid date keys', () => {
    expect(() => getEffectiveVersion(versionedHabit, '2026-02-30')).toThrow()
  })
})

describe('isHabitScheduledOn', () => {
  it('respects startDate and endDate boundaries', () => {
    const dailyHabit = {
      startDate: '2026-11-02',
      endDate: '2026-11-10',
      versions: [
        {
          effectiveFrom: '2026-11-02',
          frequencyType: 'daily',
          scheduledWeekdays: [],
          targetType: 'boolean',
          targetValue: null,
          targetUnit: null,
        },
      ],
    }

    expect(isHabitScheduledOn(dailyHabit, '2026-11-01')).toBe(false)
    expect(isHabitScheduledOn(dailyHabit, '2026-11-02')).toBe(true)
    expect(isHabitScheduledOn(dailyHabit, '2026-11-10')).toBe(true)
    expect(isHabitScheduledOn(dailyHabit, '2026-11-11')).toBe(false)
  })

  it('remains scheduled when endDate is null', () => {
    const openEndedHabit = {
      startDate: '2026-11-02',
      endDate: null,
      versions: [
        {
          effectiveFrom: '2026-11-02',
          frequencyType: 'daily',
          scheduledWeekdays: [],
          targetType: 'boolean',
          targetValue: null,
          targetUnit: null,
        },
      ],
    }

    expect(isHabitScheduledOn(openEndedHabit, '2027-06-15')).toBe(true)
  })

  it('evaluates selected_weekdays for Mon/Wed/Fri on Tuesday (false) and Wednesday (true)', () => {
    const mwfHabit = {
      startDate: '2026-11-02',
      endDate: null,
      versions: [
        {
          effectiveFrom: '2026-11-02',
          frequencyType: 'selected_weekdays',
          scheduledWeekdays: ['mon', 'wed', 'fri'],
          targetType: 'boolean',
          targetValue: null,
          targetUnit: null,
        },
      ],
    }

    // 2026-11-03 is Tuesday; 2026-11-04 is Wednesday.
    expect(isHabitScheduledOn(mwfHabit, '2026-11-03')).toBe(false)
    expect(isHabitScheduledOn(mwfHabit, '2026-11-04')).toBe(true)
  })

  it('returns false when frequencyType is selected_weekdays and scheduledWeekdays is empty', () => {
    const emptyWeekdaysHabit = {
      startDate: '2026-11-02',
      endDate: null,
      versions: [
        {
          effectiveFrom: '2026-11-02',
          frequencyType: 'selected_weekdays',
          scheduledWeekdays: [],
          targetType: 'boolean',
          targetValue: null,
          targetUnit: null,
        },
      ],
    }

    expect(isHabitScheduledOn(emptyWeekdaysHabit, '2026-11-02')).toBe(false)
  })

  it('evaluates past and future dates using the version effective on each date', () => {
    // 2026-11-10 is Tuesday (before Nov 16 daily change -> false)
    // 2026-11-17 is Tuesday (after Nov 16 daily change -> true)
    expect(isHabitScheduledOn(versionedHabit, '2026-11-10')).toBe(false)
    expect(isHabitScheduledOn(versionedHabit, '2026-11-17')).toBe(true)
  })

  it('does not filter out archived habits', () => {
    const archivedHabit = {
      ...versionedHabit,
      status: 'archived',
    }

    expect(isHabitScheduledOn(archivedHabit, '2026-11-02')).toBe(true)
  })

  it('throws on invalid date keys', () => {
    expect(() => isHabitScheduledOn(versionedHabit, '2026-02-30')).toThrow()
  })
})
