import { validateStoredHabitDocument } from '../../features/habits/habitValidation.js'

function cloneStoredVersion(version) {
  return {
    effectiveFrom: version.effectiveFrom,
    frequencyType: version.frequencyType,
    scheduledWeekdays: Array.isArray(version.scheduledWeekdays)
      ? [...version.scheduledWeekdays]
      : version.scheduledWeekdays,
    targetType: version.targetType,
    targetValue: version.targetValue ?? null,
    targetUnit: version.targetUnit ?? null,
  }
}

/**
 * Map a domain Habit object into a plain, deep-copied Firestore document payload
 * containing schemaVersion: 1, no id field, and no undefined values.
 */
export function habitToDocument(habit) {
  if (!habit || typeof habit !== 'object') {
    throw new TypeError('Invalid habit: expected a habit object.')
  }

  return {
    schemaVersion: 1,
    name: habit.name,
    description: habit.description ?? null,
    category: habit.category,
    icon: habit.icon ?? null,
    targetTimeLabel: habit.targetTimeLabel ?? null,
    startDate: habit.startDate,
    endDate: habit.endDate ?? null,
    status: habit.status,
    versions: Array.isArray(habit.versions)
      ? habit.versions.map(cloneStoredVersion)
      : habit.versions,
    createdAt: habit.createdAt,
    updatedAt: habit.updatedAt,
  }
}

/**
 * Convert a raw Firestore habit document snapshot back into a validated domain
 * Habit object with id, or return a short machine reason code without leaking content.
 */
export function documentToHabit(id, data) {
  return validateStoredHabitDocument(id, data)
}
