import { describe, expect, it } from 'vitest'
import {
  archiveHabitInList,
  createHabitInList,
  findHabitById,
  generateHabitId,
  restoreHabitInList,
  selectActiveHabits,
  selectArchivedHabits,
  updateHabitDatesInList,
  updateHabitDetailsInList,
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
