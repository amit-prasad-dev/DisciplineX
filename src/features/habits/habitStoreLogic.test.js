import { describe, expect, it } from 'vitest'
import {
  archiveHabitInList,
  createHabitInList,
  findHabitById,
  generateHabitId,
  MAX_HABITS_PER_USER,
  restoreHabitInList,
  selectActiveHabits,
  selectArchivedHabits,
  updateHabitDatesInList,
  updateHabitDetailsInList,
  updateHabitInList,
  updateHabitScheduleOrTargetInList,
} from './habitStoreLogic.js'

const JAVA_INPUT = {
  name: 'Core Java',
  description: 'Study core concepts',
  category: 'Learning',
  icon: 'book-open',
  targetTimeLabel: null,
  startDate: '2026-11-10',
  endDate: null,
  frequencyType: 'daily',
  scheduledWeekdays: [],
  targetType: 'numeric',
  targetValue: 60,
  targetUnit: 'minutes',
}

const EXERCISE_INPUT = {
  name: 'Exercise',
  description: null,
  category: 'Fitness',
  icon: null,
  targetTimeLabel: '6:30 AM',
  startDate: '2026-12-05',
  endDate: null,
  frequencyType: 'selected_weekdays',
  scheduledWeekdays: ['mon', 'wed', 'fri'],
  targetType: 'boolean',
  targetValue: null,
  targetUnit: null,
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value))
}

describe('generateHabitId', () => {
  it('uses crypto.randomUUID when available', () => {
    const id = generateHabitId({ randomUUID: () => 'uuid-123' })
    expect(id).toBe('uuid-123')
  })

  it('falls back safely to unique string IDs when crypto.randomUUID is unavailable', () => {
    const id1 = generateHabitId(undefined)
    const id2 = generateHabitId({})

    expect(typeof id1).toBe('string')
    expect(typeof id2).toBe('string')
    expect(id1.length).toBeGreaterThan(0)
    expect(id2.length).toBeGreaterThan(0)
    expect(id1).not.toBe(id2)
  })
})

describe('habitStoreLogic', () => {
  it('creates habits with unique IDs without mutating the input array', () => {
    const initial = []
    const first = createHabitInList(initial, JAVA_INPUT, {
      id: 'h-1',
      now: '2026-11-10T06:00:00Z',
    })
    expect(initial).toEqual([])
    expect(first.ok).toBe(true)
    expect(first.habits).toHaveLength(1)

    const beforeSecondSnapshot = deepClone(first.habits)
    const second = createHabitInList(first.habits, EXERCISE_INPUT, {
      id: 'h-2',
      now: '2026-11-10T06:05:00Z',
    })
    expect(first.habits).toEqual(beforeSecondSnapshot)
    expect(second.ok).toBe(true)
    expect(second.habits).toHaveLength(2)
    expect(second.habits[0].id).not.toBe(second.habits[1].id)
    expect(findHabitById(second.habits, 'h-2')?.name).toBe('Exercise')
    expect(findHabitById(second.habits, 'missing')).toBeNull()
  })

  it('updates, archives, and restores only the target habit and leaves others deep-equal', () => {
    const step1 = createHabitInList([], JAVA_INPUT, {
      id: 'h-1',
      now: '2026-11-10T06:00:00Z',
    }).habits
    const list = createHabitInList(step1, EXERCISE_INPUT, {
      id: 'h-2',
      now: '2026-11-10T06:05:00Z',
    }).habits
    const listSnapshot = deepClone(list)

    const detailsRes = updateHabitDetailsInList(
      list,
      'h-1',
      { name: 'Core Java & JVM' },
      { now: '2026-11-27T08:00:00Z' },
    )
    expect(list).toEqual(listSnapshot)
    expect(detailsRes.ok).toBe(true)
    expect(detailsRes.habits[0].name).toBe('Core Java & JVM')
    expect(detailsRes.habits[1]).toEqual(listSnapshot[1])
    expect(detailsRes.habits[1]).toBe(list[1])

    const scheduleRes = updateHabitScheduleOrTargetInList(
      detailsRes.habits,
      'h-1',
      { targetValue: 90 },
      { todayKey: '2026-11-27', now: '2026-11-27T08:10:00Z' },
    )
    expect(scheduleRes.ok).toBe(true)
    expect(scheduleRes.habits[0].versions).toHaveLength(2)
    expect(scheduleRes.habits[1]).toEqual(listSnapshot[1])

    const datesRes = updateHabitDatesInList(
      scheduleRes.habits,
      'h-2',
      { startDate: '2026-12-01' },
      { todayKey: '2026-11-27', now: '2026-11-27T08:15:00Z' },
    )
    expect(datesRes.ok).toBe(true)
    expect(datesRes.habits[1].startDate).toBe('2026-12-01')
    expect(datesRes.habits[0]).toEqual(scheduleRes.habits[0])

    const archivedRes = archiveHabitInList(datesRes.habits, 'h-1', {
      now: '2026-11-27T08:20:00Z',
    })
    expect(archivedRes.ok).toBe(true)
    expect(selectActiveHabits(archivedRes.habits).map((h) => h.id)).toEqual([
      'h-2',
    ])
    expect(selectArchivedHabits(archivedRes.habits).map((h) => h.id)).toEqual([
      'h-1',
    ])
    expect(archivedRes.habits[1]).toEqual(datesRes.habits[1])

    const restoredRes = restoreHabitInList(archivedRes.habits, 'h-1', {
      now: '2026-11-27T08:25:00Z',
    })
    expect(restoredRes.ok).toBe(true)
    expect(selectActiveHabits(restoredRes.habits).map((h) => h.id)).toEqual([
      'h-1',
      'h-2',
    ])
    expect(selectArchivedHabits(restoredRes.habits)).toEqual([])
  })

  it('returns errors and leaves the list unchanged on invalid input or not-found ID', () => {
    const list = createHabitInList([], JAVA_INPUT, {
      id: 'h-1',
      now: '2026-11-10T06:00:00Z',
    }).habits
    const snapshot = deepClone(list)

    const badCreate = createHabitInList(
      list,
      { ...JAVA_INPUT, name: '  ' },
      { id: 'h-2', now: '2026-11-10T06:05:00Z' },
    )
    expect(badCreate.ok).toBe(false)
    expect(badCreate.errors.name).toBeTruthy()
    expect(badCreate.habits).toBe(list)
    expect(list).toEqual(snapshot)

    const badUpdate = updateHabitDetailsInList(
      list,
      'h-1',
      { name: '' },
      { now: '2026-11-27T08:00:00Z' },
    )
    expect(badUpdate.ok).toBe(false)
    expect(badUpdate.errors.name).toBeTruthy()
    expect(badUpdate.habits).toBe(list)

    for (const missingResult of [
      updateHabitDetailsInList(
        list,
        'missing-id',
        { name: 'X' },
        { now: '2026-11-27T08:00:00Z' },
      ),
      updateHabitScheduleOrTargetInList(
        list,
        'missing-id',
        { targetValue: 30 },
        { todayKey: '2026-11-27', now: '2026-11-27T08:00:00Z' },
      ),
      updateHabitDatesInList(
        list,
        'missing-id',
        { endDate: '2026-12-01' },
        { todayKey: '2026-11-27', now: '2026-11-27T08:00:00Z' },
      ),
      archiveHabitInList(list, 'missing-id', {
        now: '2026-11-27T08:00:00Z',
      }),
      restoreHabitInList(list, 'missing-id', {
        now: '2026-11-27T08:00:00Z',
      }),
    ]) {
      expect(missingResult.ok).toBe(false)
      expect(missingResult.errors.form).toBeTruthy()
      expect(missingResult.habits).toBe(list)
    }
  })
})

describe('updateHabitInList (atomic multi-group update)', () => {
  it('updates dates, scheduleTarget, and details atomically and leaves other habits untouched', () => {
    const h1 = createHabitInList([], JAVA_INPUT, {
      id: 'h-1',
      now: '2026-11-10T06:00:00Z',
    }).habits
    const list = createHabitInList(h1, EXERCISE_INPUT, {
      id: 'h-2',
      now: '2026-11-10T06:05:00Z',
    }).habits
    const listSnapshot = deepClone(list)

    const result = updateHabitInList(
      list,
      'h-1',
      {
        dates: { endDate: '2026-12-31' },
        scheduleTarget: {
          frequencyType: 'selected_weekdays',
          scheduledWeekdays: ['mon', 'wed', 'fri'],
          targetValue: 90,
        },
        details: {
          name: 'Core Java Mastery',
          description: 'Updated description',
        },
      },
      { todayKey: '2026-11-27', now: '2026-11-27T09:00:00Z' },
    )

    expect(list).toEqual(listSnapshot)
    expect(result.ok).toBe(true)
    expect(result.habit.name).toBe('Core Java Mastery')
    expect(result.habit.description).toBe('Updated description')
    expect(result.habit.endDate).toBe('2026-12-31')
    expect(result.habit.versions).toHaveLength(2)
    expect(result.habit.versions[1].targetValue).toBe(90)
    expect(result.habits[1]).toEqual(listSnapshot[1])
    expect(result.habits[1]).toBe(list[1])
  })

  it('supports label changes in both directions (boolean -> numeric removes label; numeric -> boolean + new label adds it)', () => {
    const h1 = createHabitInList([], JAVA_INPUT, {
      id: 'h-1',
      now: '2026-11-10T06:00:00Z',
    }).habits
    const list = createHabitInList(h1, EXERCISE_INPUT, {
      id: 'h-2',
      now: '2026-11-10T06:05:00Z',
    }).habits

    const boolToNumeric = updateHabitInList(
      list,
      'h-2',
      {
        scheduleTarget: {
          targetType: 'numeric',
          targetValue: 45,
          targetUnit: 'minutes',
        },
      },
      { todayKey: '2026-11-27', now: '2026-11-27T09:00:00Z' },
    )
    expect(boolToNumeric.ok).toBe(true)
    expect(boolToNumeric.habit.targetTimeLabel).toBeNull()
    expect(boolToNumeric.habit.versions[0].targetType).toBe('numeric')

    const numericToBoolWithLabel = updateHabitInList(
      list,
      'h-1',
      {
        scheduleTarget: { targetType: 'boolean' },
        details: { targetTimeLabel: '7:00 AM' },
      },
      { todayKey: '2026-11-27', now: '2026-11-27T09:00:00Z' },
    )
    expect(numericToBoolWithLabel.ok).toBe(true)
    expect(numericToBoolWithLabel.habit.targetTimeLabel).toBe('7:00 AM')
    expect(numericToBoolWithLabel.habit.versions[1].targetType).toBe('boolean')
  })

  it('collects errors from all groups when multiple groups fail at once and leaves list unchanged', () => {
    const list = createHabitInList([], JAVA_INPUT, {
      id: 'h-1',
      now: '2026-11-10T06:00:00Z',
    }).habits
    const snapshot = deepClone(list)

    const result = updateHabitInList(
      list,
      'h-1',
      {
        dates: { endDate: '2026-11-20' },
        scheduleTarget: { targetValue: 0 },
        details: { name: '   ' },
      },
      { todayKey: '2026-11-27', now: '2026-11-27T09:00:00Z' },
    )

    expect(result.ok).toBe(false)
    expect(result.errors.endDate).toBeTruthy()
    expect(result.errors.targetValue).toBeTruthy()
    expect(result.errors.name).toBeTruthy()
    expect(result.habits).toBe(list)
    expect(list).toEqual(snapshot)
  })

  it('leaves the habit deep-equal if only one group fails (dates, scheduleTarget, or details)', () => {
    const list = createHabitInList([], JAVA_INPUT, {
      id: 'h-1',
      now: '2026-11-10T06:00:00Z',
    }).habits
    const snapshot = deepClone(list)

    const failDates = updateHabitInList(
      list,
      'h-1',
      {
        dates: { startDate: '2026-11-28' },
        scheduleTarget: { targetValue: 90 },
        details: { name: 'Valid Name' },
      },
      { todayKey: '2026-11-27', now: '2026-11-27T09:00:00Z' },
    )
    expect(failDates.ok).toBe(false)
    expect(failDates.errors.startDate).toBeTruthy()
    expect(list).toEqual(snapshot)

    const failSchedule = updateHabitInList(
      list,
      'h-1',
      {
        dates: { endDate: '2026-12-31' },
        scheduleTarget: { frequencyType: 'selected_weekdays' },
        details: { name: 'Valid Name' },
      },
      { todayKey: '2026-11-27', now: '2026-11-27T09:00:00Z' },
    )
    expect(failSchedule.ok).toBe(false)
    expect(failSchedule.errors.scheduledWeekdays).toBeTruthy()
    expect(list).toEqual(snapshot)

    const failDetails = updateHabitInList(
      list,
      'h-1',
      {
        dates: { endDate: '2026-12-31' },
        scheduleTarget: { targetValue: 90 },
        details: { name: '' },
      },
      { todayKey: '2026-11-27', now: '2026-11-27T09:00:00Z' },
    )
    expect(failDetails.ok).toBe(false)
    expect(failDetails.errors.name).toBeTruthy()
    expect(list).toEqual(snapshot)
  })

  it('allows extending or clearing a past endDate with a scheduleTarget change in the same save, and rejects scheduleTarget alone on an ended habit', () => {
    const endedList = createHabitInList(
      [],
      { ...JAVA_INPUT, endDate: '2026-11-20' },
      { id: 'h-ended', now: '2026-11-10T06:00:00Z' },
    ).habits
    const endedSnapshot = deepClone(endedList)

    const rejectedAlone = updateHabitInList(
      endedList,
      'h-ended',
      { scheduleTarget: { targetValue: 75 } },
      { todayKey: '2026-11-27', now: '2026-11-27T09:00:00Z' },
    )
    expect(rejectedAlone.ok).toBe(false)
    expect(rejectedAlone.errors.form).toBeTruthy()
    expect(endedList).toEqual(endedSnapshot)

    const extendedResult = updateHabitInList(
      endedList,
      'h-ended',
      {
        dates: { endDate: '2026-12-15' },
        scheduleTarget: { targetValue: 75 },
      },
      { todayKey: '2026-11-27', now: '2026-11-27T09:00:00Z' },
    )
    expect(extendedResult.ok).toBe(true)
    expect(extendedResult.habit.endDate).toBe('2026-12-15')
    expect(extendedResult.habit.versions).toHaveLength(2)
    expect(extendedResult.habit.versions[1].targetValue).toBe(75)

    const clearedResult = updateHabitInList(
      endedList,
      'h-ended',
      {
        dates: { endDate: null },
        scheduleTarget: { targetValue: 80 },
      },
      { todayKey: '2026-11-27', now: '2026-11-27T09:00:00Z' },
    )
    expect(clearedResult.ok).toBe(true)
    expect(clearedResult.habit.endDate).toBeNull()
    expect(clearedResult.habit.versions).toHaveLength(2)
    expect(clearedResult.habit.versions[1].targetValue).toBe(80)
  })

  it('rejects not-found IDs and archived habits', () => {
    const list = createHabitInList([], JAVA_INPUT, {
      id: 'h-1',
      now: '2026-11-10T06:00:00Z',
    }).habits

    const notFound = updateHabitInList(
      list,
      'missing',
      { details: { name: 'X' } },
      { todayKey: '2026-11-27', now: '2026-11-27T09:00:00Z' },
    )
    expect(notFound.ok).toBe(false)
    expect(notFound.errors.form).toBeTruthy()

    const archivedList = archiveHabitInList(list, 'h-1', {
      now: '2026-11-27T08:00:00Z',
    }).habits

    const editArchived = updateHabitInList(
      archivedList,
      'h-1',
      { details: { name: 'Updated' } },
      { todayKey: '2026-11-27', now: '2026-11-27T09:00:00Z' },
    )
    expect(editArchived.ok).toBe(false)
    expect(editArchived.errors.form).toBeTruthy()
  })

  it('enforces MAX_HABITS_PER_USER (100) including invalidCount', () => {
    const ninetyNineHabits = Array.from(
      { length: MAX_HABITS_PER_USER - 1 },
      (_, i) =>
        createHabitInList([], JAVA_INPUT, {
          id: `h-${i}`,
          now: '2026-11-10T06:00:00Z',
        }).habit,
    )

    const allowed99 = createHabitInList(ninetyNineHabits, JAVA_INPUT, {
      id: 'h-99',
      now: '2026-11-10T06:00:00Z',
    })
    expect(allowed99.ok).toBe(true)
    expect(allowed99.habits).toHaveLength(100)

    const rejected100 = createHabitInList(allowed99.habits, JAVA_INPUT, {
      id: 'h-100',
      now: '2026-11-10T06:00:00Z',
    })
    expect(rejected100.ok).toBe(false)
    expect(rejected100.habits).toBe(allowed99.habits)
    expect(rejected100.errors.form).toBe("You've reached the limit of 100 habits.")

    const ninetyEightHabits = ninetyNineHabits.slice(0, 98)
    const rejectedWithInvalidCount = createHabitInList(
      ninetyEightHabits,
      JAVA_INPUT,
      {
        id: 'h-invalid-cap',
        now: '2026-11-10T06:00:00Z',
        invalidCount: 2,
      },
    )
    expect(rejectedWithInvalidCount.ok).toBe(false)
    expect(rejectedWithInvalidCount.habits).toBe(ninetyEightHabits)
    expect(rejectedWithInvalidCount.errors.form).toBe(
      "You've reached the limit of 100 habits.",
    )
  })
})
