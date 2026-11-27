import { describe, expect, it } from 'vitest'
import { HABIT_FIELD_LIMITS } from './habitConstants.js'
import {
  archiveHabit,
  createHabit,
  restoreHabit,
  updateHabitDates,
  updateHabitDetails,
  updateHabitScheduleOrTarget,
} from './habitOperations.js'
import { validateHabitInput } from './habitValidation.js'

const BASE_INPUT = {
  name: '  Core Java  ',
  description: '  Review collections and streams  ',
  category: 'Learning',
  icon: '  book-open  ',
  targetTimeLabel: null,
  startDate: '2026-11-10',
  endDate: null,
  frequencyType: 'selected_weekdays',
  scheduledWeekdays: ['fri', 'mon', 'wed'],
  targetType: 'numeric',
  targetValue: 60,
  targetUnit: '  minutes  ',
}

const TIME_BASED_INPUT = {
  name: 'Wake up early',
  description: '   ',
  category: 'Personal',
  icon: '',
  targetTimeLabel: ' 5:00 AM ',
  startDate: '2026-11-10',
  endDate: null,
  frequencyType: 'daily',
  scheduledWeekdays: ['mon'],
  targetType: 'boolean',
  targetValue: 99,
  targetUnit: 'ignored',
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value))
}

describe('validateHabitInput', () => {
  it('accepts valid numeric and boolean time-labeled habit inputs', () => {
    expect(validateHabitInput(BASE_INPUT)).toEqual({ valid: true, errors: {} })
    expect(validateHabitInput(TIME_BASED_INPUT)).toEqual({
      valid: true,
      errors: {},
    })
  })

  it('rejects empty or whitespace-only name and over-limit lengths', () => {
    const emptyName = validateHabitInput({ ...BASE_INPUT, name: '   ' })
    expect(emptyName.valid).toBe(false)
    expect(emptyName.errors.name).toBeTruthy()

    const longName = validateHabitInput({
      ...BASE_INPUT,
      name: 'a'.repeat(HABIT_FIELD_LIMITS.nameMaxLength + 1),
    })
    expect(longName.valid).toBe(false)
    expect(longName.errors.name).toBeTruthy()

    const longDesc = validateHabitInput({
      ...BASE_INPUT,
      description: 'a'.repeat(HABIT_FIELD_LIMITS.descriptionMaxLength + 1),
    })
    expect(longDesc.valid).toBe(false)
    expect(longDesc.errors.description).toBeTruthy()

    const longUnit = validateHabitInput({
      ...BASE_INPUT,
      targetUnit: 'a'.repeat(HABIT_FIELD_LIMITS.targetUnitMaxLength + 1),
    })
    expect(longUnit.valid).toBe(false)
    expect(longUnit.errors.targetUnit).toBeTruthy()

    const longTimeLabel = validateHabitInput({
      ...TIME_BASED_INPUT,
      targetTimeLabel: 'a'.repeat(
        HABIT_FIELD_LIMITS.targetTimeLabelMaxLength + 1,
      ),
    })
    expect(longTimeLabel.valid).toBe(false)
    expect(longTimeLabel.errors.targetTimeLabel).toBeTruthy()
  })

  it('rejects invalid category, invalid dates, and endDate before startDate', () => {
    const badCategory = validateHabitInput({
      ...BASE_INPUT,
      category: 'Routine',
    })
    expect(badCategory.valid).toBe(false)
    expect(badCategory.errors.category).toBeTruthy()

    const badStart = validateHabitInput({
      ...BASE_INPUT,
      startDate: '2026-02-30',
    })
    expect(badStart.valid).toBe(false)
    expect(badStart.errors.startDate).toBeTruthy()

    const earlyEnd = validateHabitInput({
      ...BASE_INPUT,
      startDate: '2026-11-10',
      endDate: '2026-11-09',
    })
    expect(earlyEnd.valid).toBe(false)
    expect(earlyEnd.errors.endDate).toBeTruthy()
  })

  it('rejects empty, invalid, or duplicate weekdays for selected_weekdays', () => {
    const emptyWeekdays = validateHabitInput({
      ...BASE_INPUT,
      scheduledWeekdays: [],
    })
    expect(emptyWeekdays.valid).toBe(false)
    expect(emptyWeekdays.errors.scheduledWeekdays).toBeTruthy()

    const dupWeekdays = validateHabitInput({
      ...BASE_INPUT,
      scheduledWeekdays: ['mon', 'mon'],
    })
    expect(dupWeekdays.valid).toBe(false)
    expect(dupWeekdays.errors.scheduledWeekdays).toBeTruthy()

    const invalidWeekday = validateHabitInput({
      ...BASE_INPUT,
      scheduledWeekdays: ['monday'],
    })
    expect(invalidWeekday.valid).toBe(false)
    expect(invalidWeekday.errors.scheduledWeekdays).toBeTruthy()
  })

  it('rejects invalid numeric targets (0, negative, NaN) and targetTimeLabel on numeric habits', () => {
    for (const badValue of [0, -5, Number.NaN, Infinity, '60']) {
      const result = validateHabitInput({
        ...BASE_INPUT,
        targetValue: badValue,
      })
      expect(result.valid).toBe(false)
      expect(result.errors.targetValue).toBeTruthy()
    }

    const labelOnNumeric = validateHabitInput({
      ...BASE_INPUT,
      targetTimeLabel: '6:00 AM',
    })
    expect(labelOnNumeric.valid).toBe(false)
    expect(labelOnNumeric.errors.targetTimeLabel).toBeTruthy()
  })
})

describe('createHabit', () => {
  it('creates an active habit with normalized fields, Monday-first weekdays, and one initial version', () => {
    const inputSnapshot = deepClone(BASE_INPUT)
    const result = createHabit(BASE_INPUT, {
      id: 'habit-1',
      now: '2026-11-10T06:00:00Z',
    })

    expect(BASE_INPUT).toEqual(inputSnapshot)
    expect(result.ok).toBe(true)
    expect(result.habit).toEqual({
      id: 'habit-1',
      name: 'Core Java',
      description: 'Review collections and streams',
      category: 'Learning',
      icon: 'book-open',
      targetTimeLabel: null,
      startDate: '2026-11-10',
      endDate: null,
      status: 'active',
      versions: [
        {
          effectiveFrom: '2026-11-10',
          frequencyType: 'selected_weekdays',
          scheduledWeekdays: ['mon', 'wed', 'fri'],
          targetType: 'numeric',
          targetValue: 60,
          targetUnit: 'minutes',
        },
      ],
      createdAt: '2026-11-10T06:00:00Z',
      updatedAt: '2026-11-10T06:00:00Z',
    })
  })

  it('normalizes empty optional strings to null and clears targetValue/targetUnit/weekdays when boolean & daily', () => {
    const result = createHabit(TIME_BASED_INPUT, {
      id: 'habit-2',
      now: '2026-11-10T06:00:00Z',
    })

    expect(result.ok).toBe(true)
    expect(result.habit.description).toBeNull()
    expect(result.habit.icon).toBeNull()
    expect(result.habit.targetTimeLabel).toBe('5:00 AM')
    expect(result.habit.versions[0]).toEqual({
      effectiveFrom: '2026-11-10',
      frequencyType: 'daily',
      scheduledWeekdays: [],
      targetType: 'boolean',
      targetValue: null,
      targetUnit: null,
    })
  })
})

describe('updateHabitDetails', () => {
  it('updates metadata in place without creating a new version and does not mutate input', () => {
    const created = createHabit(TIME_BASED_INPUT, {
      id: 'habit-2',
      now: '2026-11-10T06:00:00Z',
    }).habit
    const beforeSnapshot = deepClone(created)

    const updated = updateHabitDetails(
      created,
      {
        name: '  Wake up early  ',
        description: '  Out of bed immediately  ',
        category: 'Health',
        targetTimeLabel: ' 5:30 AM ',
      },
      { now: '2026-11-15T07:00:00Z' },
    )

    expect(created).toEqual(beforeSnapshot)
    expect(updated.ok).toBe(true)
    expect(updated.habit.versions).toEqual(beforeSnapshot.versions)
    expect(updated.habit.name).toBe('Wake up early')
    expect(updated.habit.description).toBe('Out of bed immediately')
    expect(updated.habit.category).toBe('Health')
    expect(updated.habit.targetTimeLabel).toBe('5:30 AM')
    expect(updated.habit.updatedAt).toBe('2026-11-15T07:00:00Z')
  })

  it('rejects fields belonging to schedule/target/date operations with errors.form', () => {
    const habit = createHabit(BASE_INPUT, {
      id: 'habit-1',
      now: '2026-11-10T06:00:00Z',
    }).habit

    const result = updateHabitDetails(
      habit,
      { name: 'Java', targetValue: 90 },
      { now: '2026-11-15T07:00:00Z' },
    )

    expect(result.ok).toBe(false)
    expect(result.errors.form).toBeTruthy()
  })

  it('rejects setting a non-empty targetTimeLabel on a numeric habit', () => {
    const habit = createHabit(BASE_INPUT, {
      id: 'habit-1',
      now: '2026-11-10T06:00:00Z',
    }).habit

    const result = updateHabitDetails(
      habit,
      { targetTimeLabel: '6:00 AM' },
      { now: '2026-11-15T07:00:00Z' },
    )

    expect(result.ok).toBe(false)
    expect(result.errors.targetTimeLabel).toBeTruthy()
  })
})

describe('updateHabitScheduleOrTarget', () => {
  it('appends a new version on a started habit without altering earlier versions', () => {
    const habit = createHabit(BASE_INPUT, {
      id: 'habit-1',
      now: '2026-11-10T06:00:00Z',
    }).habit
    const beforeSnapshot = deepClone(habit)

    const result = updateHabitScheduleOrTarget(
      habit,
      { frequencyType: 'daily', targetValue: 90 },
      { todayKey: '2026-11-20', now: '2026-11-20T08:00:00Z' },
    )

    expect(habit).toEqual(beforeSnapshot)
    expect(result.ok).toBe(true)
    expect(result.habit.versions).toHaveLength(2)
    expect(result.habit.versions[0]).toEqual(beforeSnapshot.versions[0])
    expect(result.habit.versions[1]).toEqual({
      effectiveFrom: '2026-11-20',
      frequencyType: 'daily',
      scheduledWeekdays: [],
      targetType: 'numeric',
      targetValue: 90,
      targetUnit: 'minutes',
    })
  })

  it('replaces the latest version in place on a second edit on the same day', () => {
    const habit = createHabit(BASE_INPUT, {
      id: 'habit-1',
      now: '2026-11-10T06:00:00Z',
    }).habit
    const firstEdit = updateHabitScheduleOrTarget(
      habit,
      { targetValue: 75 },
      { todayKey: '2026-11-20', now: '2026-11-20T08:00:00Z' },
    ).habit

    const secondEdit = updateHabitScheduleOrTarget(
      firstEdit,
      { targetValue: 90 },
      { todayKey: '2026-11-20', now: '2026-11-20T18:00:00Z' },
    )

    expect(secondEdit.ok).toBe(true)
    expect(secondEdit.habit.versions).toHaveLength(2)
    expect(secondEdit.habit.versions[0]).toEqual(habit.versions[0])
    expect(secondEdit.habit.versions[1].targetValue).toBe(90)
    expect(secondEdit.habit.versions[1].effectiveFrom).toBe('2026-11-20')
  })

  it('replaces the initial version in place on a not-yet-started habit keeping startDate as effectiveFrom', () => {
    const futureHabit = createHabit(
      { ...BASE_INPUT, startDate: '2026-12-05' },
      { id: 'habit-future', now: '2026-11-27T08:00:00Z' },
    ).habit

    const result = updateHabitScheduleOrTarget(
      futureHabit,
      { targetValue: 45 },
      { todayKey: '2026-11-27', now: '2026-11-27T09:00:00Z' },
    )

    expect(result.ok).toBe(true)
    expect(result.habit.versions).toHaveLength(1)
    expect(result.habit.versions[0].effectiveFrom).toBe('2026-12-05')
    expect(result.habit.versions[0].targetValue).toBe(45)
  })

  it('returns the habit unchanged when the normalized change is a no-op', () => {
    const habit = createHabit(BASE_INPUT, {
      id: 'habit-1',
      now: '2026-11-10T06:00:00Z',
    }).habit

    const result = updateHabitScheduleOrTarget(
      habit,
      { scheduledWeekdays: ['wed', 'fri', 'mon'] },
      { todayKey: '2026-11-20', now: '2026-11-20T08:00:00Z' },
    )

    expect(result.ok).toBe(true)
    expect(result.habit).toBe(habit)
    expect(result.habit.versions).toHaveLength(1)
  })

  it('rejects switching to selected_weekdays without weekdays, clears targetValue/unit on boolean, and clears targetTimeLabel on numeric', () => {
    const timeHabit = createHabit(TIME_BASED_INPUT, {
      id: 'habit-2',
      now: '2026-11-10T06:00:00Z',
    }).habit

    const badSwitch = updateHabitScheduleOrTarget(
      timeHabit,
      { frequencyType: 'selected_weekdays' },
      { todayKey: '2026-11-20', now: '2026-11-20T08:00:00Z' },
    )
    expect(badSwitch.ok).toBe(false)
    expect(badSwitch.errors.scheduledWeekdays).toBeTruthy()

    const toNumeric = updateHabitScheduleOrTarget(
      timeHabit,
      { targetType: 'numeric', targetValue: 30, targetUnit: 'minutes' },
      { todayKey: '2026-11-20', now: '2026-11-20T08:00:00Z' },
    )
    expect(toNumeric.ok).toBe(true)
    expect(toNumeric.habit.targetTimeLabel).toBeNull()

    const backToBoolean = updateHabitScheduleOrTarget(
      toNumeric.habit,
      { targetType: 'boolean' },
      { todayKey: '2026-11-21', now: '2026-11-21T08:00:00Z' },
    )
    expect(backToBoolean.ok).toBe(true)
    expect(backToBoolean.habit.versions[2]).toEqual({
      effectiveFrom: '2026-11-21',
      frequencyType: 'daily',
      scheduledWeekdays: [],
      targetType: 'boolean',
      targetValue: null,
      targetUnit: null,
    })
  })

  it('rejects details/date fields with errors.form and throws on malformed todayKey', () => {
    const habit = createHabit(BASE_INPUT, {
      id: 'habit-1',
      now: '2026-11-10T06:00:00Z',
    }).habit

    const foreignField = updateHabitScheduleOrTarget(
      habit,
      { name: 'Changed' },
      { todayKey: '2026-11-20', now: '2026-11-20T08:00:00Z' },
    )
    expect(foreignField.ok).toBe(false)
    expect(foreignField.errors.form).toBeTruthy()

    expect(() =>
      updateHabitScheduleOrTarget(
        habit,
        { targetValue: 90 },
        { todayKey: '2026-02-30', now: '2026-11-20T08:00:00Z' },
      ),
    ).toThrow()
  })

  it('rejects schedule/target changes when endDate is before todayKey, and allows editing when endDate equals todayKey', () => {
    const endedHabit = createHabit(
      { ...BASE_INPUT, endDate: '2026-11-26' },
      { id: 'habit-ended', now: '2026-11-10T06:00:00Z' },
    ).habit
    const endedSnapshot = deepClone(endedHabit)

    const rejected = updateHabitScheduleOrTarget(
      endedHabit,
      { targetValue: 90 },
      { todayKey: '2026-11-27', now: '2026-11-27T09:00:00Z' },
    )
    expect(rejected.ok).toBe(false)
    expect(rejected.errors.form).toBeTruthy()
    expect(endedHabit).toEqual(endedSnapshot)

    const endsTodayHabit = createHabit(
      { ...BASE_INPUT, endDate: '2026-11-27' },
      { id: 'habit-ends-today', now: '2026-11-10T06:00:00Z' },
    ).habit

    const allowed = updateHabitScheduleOrTarget(
      endsTodayHabit,
      { targetValue: 90 },
      { todayKey: '2026-11-27', now: '2026-11-27T09:00:00Z' },
    )
    expect(allowed.ok).toBe(true)
    expect(allowed.habit.versions).toHaveLength(2)
    expect(allowed.habit.versions[1].effectiveFrom).toBe('2026-11-27')
    expect(allowed.habit.versions[1].targetValue).toBe(90)
  })
})

describe('updateHabitDates', () => {
  it('allows changing startDate while current startDate is in the future and moves initial effectiveFrom', () => {
    const futureHabit = createHabit(
      { ...BASE_INPUT, startDate: '2026-12-05' },
      { id: 'habit-future', now: '2026-11-27T08:00:00Z' },
    ).habit

    const result = updateHabitDates(
      futureHabit,
      { startDate: '2026-12-01', endDate: '2026-12-31' },
      { todayKey: '2026-11-27', now: '2026-11-27T09:00:00Z' },
    )

    expect(result.ok).toBe(true)
    expect(result.habit.startDate).toBe('2026-12-01')
    expect(result.habit.endDate).toBe('2026-12-31')
    expect(result.habit.versions[0].effectiveFrom).toBe('2026-12-01')
  })

  it('rejects changing startDate after it has started, allows unchanged startDate when updating endDate, and rejects endDate in the past', () => {
    const startedHabit = createHabit(BASE_INPUT, {
      id: 'habit-1',
      now: '2026-11-10T06:00:00Z',
    }).habit

    const changeStart = updateHabitDates(
      startedHabit,
      { startDate: '2026-11-28' },
      { todayKey: '2026-11-27', now: '2026-11-27T09:00:00Z' },
    )
    expect(changeStart.ok).toBe(false)
    expect(changeStart.errors.startDate).toBeTruthy()

    const sameStartNewEnd = updateHabitDates(
      startedHabit,
      { startDate: '2026-11-10', endDate: '2026-12-10' },
      { todayKey: '2026-11-27', now: '2026-11-27T09:00:00Z' },
    )
    expect(sameStartNewEnd.ok).toBe(true)
    expect(sameStartNewEnd.habit.endDate).toBe('2026-12-10')

    const pastEnd = updateHabitDates(
      startedHabit,
      { endDate: '2026-11-26' },
      { todayKey: '2026-11-27', now: '2026-11-27T09:00:00Z' },
    )
    expect(pastEnd.ok).toBe(false)
    expect(pastEnd.errors.endDate).toBeTruthy()
  })

  it('rejects non-date fields with errors.form', () => {
    const habit = createHabit(BASE_INPUT, {
      id: 'habit-1',
      now: '2026-11-10T06:00:00Z',
    }).habit

    const result = updateHabitDates(
      habit,
      { name: 'Nope', endDate: '2026-12-01' },
      { todayKey: '2026-11-27', now: '2026-11-27T09:00:00Z' },
    )
    expect(result.ok).toBe(false)
    expect(result.errors.form).toBeTruthy()
  })
})

describe('archiveHabit, restoreHabit, and archived-edit rejection', () => {
  it('archives and restores idempotently without modifying versions, and rejects edits on archived habits', () => {
    const active = createHabit(BASE_INPUT, {
      id: 'habit-1',
      now: '2026-11-10T06:00:00Z',
    }).habit
    const beforeSnapshot = deepClone(active)

    const archivedResult = archiveHabit(active, { now: '2026-11-27T10:00:00Z' })
    expect(active).toEqual(beforeSnapshot)
    expect(archivedResult.ok).toBe(true)
    expect(archivedResult.habit.status).toBe('archived')
    expect(archivedResult.habit.versions).toEqual(beforeSnapshot.versions)

    const archivedAgain = archiveHabit(archivedResult.habit, {
      now: '2026-11-27T11:00:00Z',
    })
    expect(archivedAgain.ok).toBe(true)
    expect(archivedAgain.habit).toBe(archivedResult.habit)

    const editDetails = updateHabitDetails(
      archivedResult.habit,
      { name: 'Updated' },
      { now: '2026-11-27T11:00:00Z' },
    )
    expect(editDetails.ok).toBe(false)
    expect(editDetails.errors.form).toBeTruthy()

    const editSchedule = updateHabitScheduleOrTarget(
      archivedResult.habit,
      { targetValue: 90 },
      { todayKey: '2026-11-27', now: '2026-11-27T11:00:00Z' },
    )
    expect(editSchedule.ok).toBe(false)
    expect(editSchedule.errors.form).toBeTruthy()

    const editDates = updateHabitDates(
      archivedResult.habit,
      { endDate: '2026-12-31' },
      { todayKey: '2026-11-27', now: '2026-11-27T11:00:00Z' },
    )
    expect(editDates.ok).toBe(false)
    expect(editDates.errors.form).toBeTruthy()

    const restored = restoreHabit(archivedResult.habit, {
      now: '2026-11-28T08:00:00Z',
    })
    expect(restored.ok).toBe(true)
    expect(restored.habit.status).toBe('active')
    expect(restored.habit.versions).toEqual(beforeSnapshot.versions)

    const restoredAgain = restoreHabit(restored.habit, {
      now: '2026-11-28T09:00:00Z',
    })
    expect(restoredAgain.ok).toBe(true)
    expect(restoredAgain.habit).toBe(restored.habit)
  })
})
