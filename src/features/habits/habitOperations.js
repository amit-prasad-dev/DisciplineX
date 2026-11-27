import { parseDateKey } from '../../utils/date.js'
import { HABIT_STATUSES } from './habitConstants.js'
import {
  validateAndNormalizeHabitInput,
  validateDetailsFields,
  validateScheduleAndTargetFields,
} from './habitValidation.js'

const DETAILS_KEYS = new Set([
  'name',
  'description',
  'category',
  'icon',
  'targetTimeLabel',
])

const SCHEDULE_TARGET_KEYS = new Set([
  'frequencyType',
  'scheduledWeekdays',
  'targetType',
  'targetValue',
  'targetUnit',
])

const DATE_KEYS = new Set(['startDate', 'endDate'])

function assertNonEmptyString(value, name) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Invalid ${name}: expected a non-empty string`)
  }
}

function assertValidHabit(habit) {
  if (!habit || typeof habit !== 'object') {
    throw new Error('Invalid habit: expected a habit object')
  }
  parseDateKey(habit.startDate)
  if (!Array.isArray(habit.versions) || habit.versions.length === 0) {
    throw new Error('Invalid habit: expected a non-empty versions array')
  }
}

function getLatestVersionIndex(versions) {
  let latestIndex = 0
  for (let i = 0; i < versions.length; i += 1) {
    parseDateKey(versions[i].effectiveFrom)
    if (versions[i].effectiveFrom >= versions[latestIndex].effectiveFrom) {
      latestIndex = i
    }
  }
  return latestIndex
}

function cloneVersion(version) {
  return {
    ...version,
    scheduledWeekdays: Array.isArray(version.scheduledWeekdays)
      ? [...version.scheduledWeekdays]
      : [],
  }
}

function cloneHabit(habit) {
  return {
    ...habit,
    versions: habit.versions.map(cloneVersion),
  }
}

function findDisallowedKeys(changes, allowedKeys) {
  return Object.keys(changes).filter((key) => !allowedKeys.has(key))
}

function areStringArraysEqual(a, b) {
  if (a.length !== b.length) {
    return false
  }
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) {
      return false
    }
  }
  return true
}

function isSameScheduleAndTarget(version, normalized) {
  return (
    version.frequencyType === normalized.frequencyType &&
    areStringArraysEqual(
      version.scheduledWeekdays ?? [],
      normalized.scheduledWeekdays,
    ) &&
    version.targetType === normalized.targetType &&
    version.targetValue === normalized.targetValue &&
    version.targetUnit === normalized.targetUnit
  )
}

export function createHabit(input, { id, now } = {}) {
  assertNonEmptyString(id, 'id')
  assertNonEmptyString(now, 'now')

  const { valid, errors, normalized } = validateAndNormalizeHabitInput(input)
  if (!valid) {
    return { ok: false, errors }
  }

  return {
    ok: true,
    habit: {
      id,
      name: normalized.name,
      description: normalized.description,
      category: normalized.category,
      icon: normalized.icon,
      targetTimeLabel: normalized.targetTimeLabel,
      startDate: normalized.startDate,
      endDate: normalized.endDate,
      status: HABIT_STATUSES.ACTIVE,
      versions: [
        {
          effectiveFrom: normalized.startDate,
          frequencyType: normalized.frequencyType,
          scheduledWeekdays: [...normalized.scheduledWeekdays],
          targetType: normalized.targetType,
          targetValue: normalized.targetValue,
          targetUnit: normalized.targetUnit,
        },
      ],
      createdAt: now,
      updatedAt: now,
    },
  }
}

export function updateHabitDetails(habit, changes, { now } = {}) {
  assertValidHabit(habit)
  assertNonEmptyString(now, 'now')

  if (habit.status === HABIT_STATUSES.ARCHIVED) {
    return {
      ok: false,
      errors: { form: 'Restore this habit before editing it.' },
    }
  }

  const changeInput = changes && typeof changes === 'object' ? changes : {}
  const disallowed = findDisallowedKeys(changeInput, DETAILS_KEYS)
  if (disallowed.length > 0) {
    return {
      ok: false,
      errors: {
        form: `Details update only supports name, description, category, icon, and targetTimeLabel (received ${disallowed.join(', ')}).`,
      },
    }
  }

  const latestVersion = habit.versions[getLatestVersionIndex(habit.versions)]
  const mergedDetails = {
    name: 'name' in changeInput ? changeInput.name : habit.name,
    description:
      'description' in changeInput ? changeInput.description : habit.description,
    category: 'category' in changeInput ? changeInput.category : habit.category,
    icon: 'icon' in changeInput ? changeInput.icon : habit.icon,
    targetTimeLabel:
      'targetTimeLabel' in changeInput
        ? changeInput.targetTimeLabel
        : habit.targetTimeLabel,
  }

  const { errors, normalized } = validateDetailsFields(
    mergedDetails,
    latestVersion.targetType,
  )

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors }
  }

  return {
    ok: true,
    habit: {
      ...cloneHabit(habit),
      name: normalized.name,
      description: normalized.description,
      category: normalized.category,
      icon: normalized.icon,
      targetTimeLabel: normalized.targetTimeLabel,
      updatedAt: now,
    },
  }
}

export function updateHabitScheduleOrTarget(
  habit,
  changes,
  { todayKey, now } = {},
) {
  assertValidHabit(habit)
  parseDateKey(todayKey)
  assertNonEmptyString(now, 'now')

  if (habit.status === HABIT_STATUSES.ARCHIVED) {
    return {
      ok: false,
      errors: { form: 'Restore this habit before editing it.' },
    }
  }

  if (habit.endDate != null) {
    parseDateKey(habit.endDate)
    if (habit.endDate < todayKey) {
      return {
        ok: false,
        errors: {
          form: 'This habit has ended. Extend or clear its end date to change its schedule or target.',
        },
      }
    }
  }

  const changeInput = changes && typeof changes === 'object' ? changes : {}
  const disallowed = findDisallowedKeys(changeInput, SCHEDULE_TARGET_KEYS)
  if (disallowed.length > 0) {
    return {
      ok: false,
      errors: {
        form: `Schedule and target update does not accept ${disallowed.join(', ')}.`,
      },
    }
  }

  const latestIndex = getLatestVersionIndex(habit.versions)
  const latestVersion = habit.versions[latestIndex]

  const nextFrequencyType =
    'frequencyType' in changeInput
      ? changeInput.frequencyType
      : latestVersion.frequencyType

  let nextScheduledWeekdays
  if (nextFrequencyType === 'daily') {
    nextScheduledWeekdays = []
  } else if ('scheduledWeekdays' in changeInput) {
    nextScheduledWeekdays = changeInput.scheduledWeekdays
  } else {
    nextScheduledWeekdays = latestVersion.scheduledWeekdays
  }

  const nextTargetType =
    'targetType' in changeInput
      ? changeInput.targetType
      : latestVersion.targetType

  let nextTargetValue = null
  let nextTargetUnit = null
  if (nextTargetType === 'numeric') {
    nextTargetValue =
      'targetValue' in changeInput
        ? changeInput.targetValue
        : latestVersion.targetValue
    nextTargetUnit =
      'targetUnit' in changeInput
        ? changeInput.targetUnit
        : latestVersion.targetUnit
  }

  const { errors, normalized } = validateScheduleAndTargetFields({
    frequencyType: nextFrequencyType,
    scheduledWeekdays: nextScheduledWeekdays,
    targetType: nextTargetType,
    targetValue: nextTargetValue,
    targetUnit: nextTargetUnit,
  })

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors }
  }

  if (isSameScheduleAndTarget(latestVersion, normalized)) {
    return { ok: true, habit }
  }

  const nextVersions = habit.versions.map(cloneVersion)
  const nextTargetTimeLabel =
    normalized.targetType === 'numeric' ? null : habit.targetTimeLabel

  if (habit.startDate > todayKey) {
    nextVersions[0] = {
      effectiveFrom: habit.startDate,
      frequencyType: normalized.frequencyType,
      scheduledWeekdays: [...normalized.scheduledWeekdays],
      targetType: normalized.targetType,
      targetValue: normalized.targetValue,
      targetUnit: normalized.targetUnit,
    }
  } else if (latestVersion.effectiveFrom === todayKey) {
    nextVersions[latestIndex] = {
      effectiveFrom: todayKey,
      frequencyType: normalized.frequencyType,
      scheduledWeekdays: [...normalized.scheduledWeekdays],
      targetType: normalized.targetType,
      targetValue: normalized.targetValue,
      targetUnit: normalized.targetUnit,
    }
  } else {
    nextVersions.push({
      effectiveFrom: todayKey,
      frequencyType: normalized.frequencyType,
      scheduledWeekdays: [...normalized.scheduledWeekdays],
      targetType: normalized.targetType,
      targetValue: normalized.targetValue,
      targetUnit: normalized.targetUnit,
    })
  }

  return {
    ok: true,
    habit: {
      ...habit,
      targetTimeLabel: nextTargetTimeLabel,
      versions: nextVersions,
      updatedAt: now,
    },
  }
}

export function updateHabitDates(habit, changes, { todayKey, now } = {}) {
  assertValidHabit(habit)
  parseDateKey(todayKey)
  assertNonEmptyString(now, 'now')

  if (habit.status === HABIT_STATUSES.ARCHIVED) {
    return {
      ok: false,
      errors: { form: 'Restore this habit before editing it.' },
    }
  }

  const changeInput = changes && typeof changes === 'object' ? changes : {}
  const disallowed = findDisallowedKeys(changeInput, DATE_KEYS)
  if (disallowed.length > 0) {
    return {
      ok: false,
      errors: {
        form: `Date update only supports startDate and endDate (received ${disallowed.join(', ')}).`,
      },
    }
  }

  const errors = {}
  const hasStartDate = 'startDate' in changeInput
  let nextStartDate = habit.startDate

  if (hasStartDate && changeInput.startDate !== habit.startDate) {
    let validStart = false
    if (typeof changeInput.startDate === 'string') {
      try {
        parseDateKey(changeInput.startDate)
        validStart = true
      } catch {
        validStart = false
      }
    }

    if (!validStart) {
      errors.startDate = 'Enter a valid start date (YYYY-MM-DD).'
    } else if (habit.startDate <= todayKey) {
      errors.startDate = 'Start date cannot be changed once the habit has started.'
    } else if (changeInput.startDate < todayKey) {
      errors.startDate = 'Start date cannot be earlier than today.'
    } else {
      nextStartDate = changeInput.startDate
    }
  }

  const hasEndDate = 'endDate' in changeInput
  let nextEndDate = habit.endDate ?? null

  if (hasEndDate) {
    const rawEndDate = changeInput.endDate
    if (
      rawEndDate === null ||
      rawEndDate === undefined ||
      (typeof rawEndDate === 'string' && rawEndDate.trim() === '')
    ) {
      nextEndDate = null
    } else {
      let validEnd = false
      if (typeof rawEndDate === 'string') {
        try {
          parseDateKey(rawEndDate)
          validEnd = true
        } catch {
          validEnd = false
        }
      }

      if (!validEnd) {
        errors.endDate = 'Enter a valid end date (YYYY-MM-DD).'
      } else if (rawEndDate < todayKey) {
        errors.endDate = 'End date cannot be earlier than today.'
      } else if (rawEndDate < nextStartDate) {
        errors.endDate = 'End date cannot be earlier than start date.'
      } else {
        nextEndDate = rawEndDate
      }
    }
  } else if (nextEndDate !== null && nextEndDate < nextStartDate) {
    errors.endDate = 'End date cannot be earlier than start date.'
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors }
  }

  const nextHabit = cloneHabit(habit)
  nextHabit.startDate = nextStartDate
  nextHabit.endDate = nextEndDate
  if (nextStartDate !== habit.startDate) {
    nextHabit.versions[0].effectiveFrom = nextStartDate
  }
  nextHabit.updatedAt = now

  return { ok: true, habit: nextHabit }
}

export function archiveHabit(habit, { now } = {}) {
  assertValidHabit(habit)
  assertNonEmptyString(now, 'now')

  if (habit.status === HABIT_STATUSES.ARCHIVED) {
    return { ok: true, habit }
  }

  return {
    ok: true,
    habit: {
      ...cloneHabit(habit),
      status: HABIT_STATUSES.ARCHIVED,
      updatedAt: now,
    },
  }
}

export function restoreHabit(habit, { now } = {}) {
  assertValidHabit(habit)
  assertNonEmptyString(now, 'now')

  if (habit.status === HABIT_STATUSES.ACTIVE) {
    return { ok: true, habit }
  }

  return {
    ok: true,
    habit: {
      ...cloneHabit(habit),
      status: HABIT_STATUSES.ACTIVE,
      updatedAt: now,
    },
  }
}
