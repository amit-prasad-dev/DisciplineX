import { getWeekdayKeyFromDateKey, parseDateKey } from '../../utils/date.js'

/**
 * Return the habit version effective on `dateKey` (the version with the
 * latest `effectiveFrom` <= `dateKey`), or `null` if `dateKey` precedes all
 * versions. Does not depend on the ordering of `habit.versions`.
 */
export function getEffectiveVersion(habit, dateKey) {
  parseDateKey(dateKey)

  if (!habit || !Array.isArray(habit.versions)) {
    throw new Error('Invalid habit: expected an object with a versions array')
  }

  let effectiveVersion = null

  for (const version of habit.versions) {
    parseDateKey(version.effectiveFrom)
    if (
      version.effectiveFrom <= dateKey &&
      (!effectiveVersion || version.effectiveFrom > effectiveVersion.effectiveFrom)
    ) {
      effectiveVersion = version
    }
  }

  return effectiveVersion
}

/**
 * Return true if `habit` is scheduled on `dateKey` (within `[startDate, endDate]`
 * and matching the effective version's frequency). Does not inspect `status`
 * (archived state is handled separately).
 */
export function isHabitScheduledOn(habit, dateKey) {
  parseDateKey(dateKey)

  if (!habit || typeof habit !== 'object') {
    throw new Error('Invalid habit: expected a habit object')
  }

  parseDateKey(habit.startDate)
  if (habit.endDate != null) {
    parseDateKey(habit.endDate)
  }

  if (dateKey < habit.startDate) {
    return false
  }

  if (habit.endDate != null && dateKey > habit.endDate) {
    return false
  }

  const version = getEffectiveVersion(habit, dateKey)
  if (!version) {
    return false
  }

  if (version.frequencyType === 'daily') {
    return true
  }

  if (version.frequencyType === 'selected_weekdays') {
    if (!Array.isArray(version.scheduledWeekdays) || version.scheduledWeekdays.length === 0) {
      return false
    }
    const weekday = getWeekdayKeyFromDateKey(dateKey)
    return version.scheduledWeekdays.includes(weekday)
  }

  throw new Error(
    `Unsupported frequencyType: "${String(version.frequencyType)}"`,
  )
}
