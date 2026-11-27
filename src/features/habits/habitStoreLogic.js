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

function hasKeys(obj) {
  return Boolean(obj && typeof obj === 'object' && Object.keys(obj).length > 0)
}

function getLatestEffectiveVersion(versions) {
  let latest = versions[0]
  for (let i = 1; i < versions.length; i += 1) {
    if (versions[i].effectiveFrom >= latest.effectiveFrom) {
      latest = versions[i]
    }
  }
  return latest
}

/**
 * Atomically apply dates -> scheduleTarget -> details to a habit in `habits`.
 * Pre-validates each supplied group independently against the original habit to
 * merge errors across groups, then applies them in order on a working copy so
 * a failure in any step leaves `habits` completely unchanged.
 */
export function updateHabitInList(
  habits,
  habitId,
  { details, scheduleTarget, dates } = {},
  { todayKey, now },
) {
  return applyOperationById(habits, habitId, (originalHabit) => {
    const hasDates = hasKeys(dates)
    const hasScheduleTarget = hasKeys(scheduleTarget)
    const hasDetails = hasKeys(details)

    if (!hasDates && !hasScheduleTarget && !hasDetails) {
      return { ok: true, habit: originalHabit }
    }

    if (originalHabit.status === HABIT_STATUSES.ARCHIVED) {
      return {
        ok: false,
        errors: { form: 'Restore this habit before editing it.' },
      }
    }

    const mergedErrors = {}

    if (hasDates) {
      const datesCheck = updateHabitDates(originalHabit, dates, {
        todayKey,
        now,
      })
      if (!datesCheck.ok) {
        Object.assign(mergedErrors, datesCheck.errors)
      }
    }

    let scheduleTargetCheck = null
    if (hasScheduleTarget) {
      scheduleTargetCheck = updateHabitScheduleOrTarget(
        originalHabit,
        scheduleTarget,
        { todayKey, now },
      )
      if (!scheduleTargetCheck.ok) {
        Object.assign(mergedErrors, scheduleTargetCheck.errors)
      }
    }

    if (hasDetails) {
      let detailsBaseHabit = originalHabit
      if (hasScheduleTarget) {
        if (scheduleTargetCheck?.ok) {
          detailsBaseHabit = scheduleTargetCheck.habit
        } else if (
          scheduleTarget &&
          typeof scheduleTarget === 'object' &&
          'targetType' in scheduleTarget
        ) {
          const latestVersion = getLatestEffectiveVersion(
            originalHabit.versions,
          )
          detailsBaseHabit = {
            ...originalHabit,
            versions: [
              {
                ...latestVersion,
                targetType: scheduleTarget.targetType,
              },
            ],
          }
        }
      }

      const detailsCheck = updateHabitDetails(detailsBaseHabit, details, {
        now,
      })
      if (!detailsCheck.ok) {
        Object.assign(mergedErrors, detailsCheck.errors)
      }
    }

    if (Object.keys(mergedErrors).length > 0) {
      return { ok: false, errors: mergedErrors }
    }

    let workingHabit = originalHabit

    if (hasDates) {
      const datesResult = updateHabitDates(workingHabit, dates, {
        todayKey,
        now,
      })
      if (!datesResult.ok) {
        return { ok: false, errors: datesResult.errors }
      }
      workingHabit = datesResult.habit
    }

    if (hasScheduleTarget) {
      const scheduleTargetResult = updateHabitScheduleOrTarget(
        workingHabit,
        scheduleTarget,
        { todayKey, now },
      )
      if (!scheduleTargetResult.ok) {
        return { ok: false, errors: scheduleTargetResult.errors }
      }
      workingHabit = scheduleTargetResult.habit
    }

    if (hasDetails) {
      const detailsResult = updateHabitDetails(workingHabit, details, { now })
      if (!detailsResult.ok) {
        return { ok: false, errors: detailsResult.errors }
      }
      workingHabit = detailsResult.habit
    }

    return { ok: true, habit: workingHabit }
  })
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
