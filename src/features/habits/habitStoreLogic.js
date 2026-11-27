import { HABIT_STATUSES } from './habitConstants.js'
import {
  archiveHabit,
  createHabit,
  restoreHabit,
  updateHabitDates,
  updateHabitDetails,
  updateHabitScheduleOrTarget,
} from './habitOperations.js'

let fallbackIdCounter = 0

/**
 * Generate a unique habit ID using crypto.randomUUID when available, with a
 * monotonic timestamp+counter fallback for non-secure HTTP contexts.
 */
export function generateHabitId(cryptoObj = globalThis.crypto) {
  if (cryptoObj && typeof cryptoObj.randomUUID === 'function') {
    return cryptoObj.randomUUID()
  }
  fallbackIdCounter += 1
  return `habit-${Date.now()}-${fallbackIdCounter}`
}

export function findHabitById(habits, habitId) {
  return habits.find((habit) => habit.id === habitId) ?? null
}

export function selectActiveHabits(habits) {
  return habits.filter((habit) => habit.status === HABIT_STATUSES.ACTIVE)
}

export function selectArchivedHabits(habits) {
  return habits.filter((habit) => habit.status === HABIT_STATUSES.ARCHIVED)
}

export function createHabitInList(habits, input, { id, now }) {
  const result = createHabit(input, { id, now })
  if (!result.ok) {
    return { ok: false, habits, habit: null, errors: result.errors }
  }
  return {
    ok: true,
    habits: [...habits, result.habit],
    habit: result.habit,
    errors: null,
  }
}

function applyOperationById(habits, habitId, runOperation) {
  const index = habits.findIndex((habit) => habit.id === habitId)
  if (index === -1) {
    return {
      ok: false,
      habits,
      habit: null,
      errors: { form: 'Habit not found.' },
    }
  }

  const targetHabit = habits[index]
  const result = runOperation(targetHabit)
  if (!result.ok) {
    return {
      ok: false,
      habits,
      habit: null,
      errors: result.errors,
    }
  }

  if (result.habit === targetHabit) {
    return {
      ok: true,
      habits,
      habit: result.habit,
      errors: null,
    }
  }

  const nextHabits = habits.map((habit, i) =>
    i === index ? result.habit : habit,
  )

  return {
    ok: true,
    habits: nextHabits,
    habit: result.habit,
    errors: null,
  }
}

export function updateHabitDetailsInList(habits, habitId, changes, { now }) {
  return applyOperationById(habits, habitId, (habit) =>
    updateHabitDetails(habit, changes, { now }),
  )
}

export function updateHabitScheduleOrTargetInList(
  habits,
  habitId,
  changes,
  { todayKey, now },
) {
  return applyOperationById(habits, habitId, (habit) =>
    updateHabitScheduleOrTarget(habit, changes, { todayKey, now }),
  )
}

export function updateHabitDatesInList(
  habits,
  habitId,
  changes,
  { todayKey, now },
) {
  return applyOperationById(habits, habitId, (habit) =>
    updateHabitDates(habit, changes, { todayKey, now }),
  )
}

export function archiveHabitInList(habits, habitId, { now }) {
  return applyOperationById(habits, habitId, (habit) =>
    archiveHabit(habit, { now }),
  )
}

export function restoreHabitInList(habits, habitId, { now }) {
  return applyOperationById(habits, habitId, (habit) =>
    restoreHabit(habit, { now }),
  )
}
