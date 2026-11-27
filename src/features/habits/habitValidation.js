import { WEEKDAY_KEYS, parseDateKey } from '../../utils/date.js'
import {
  FREQUENCY_TYPES,
  HABIT_CATEGORIES,
  HABIT_FIELD_LIMITS,
  TARGET_TYPES,
} from './habitConstants.js'

const VALID_WEEKDAY_SET = new Set(WEEKDAY_KEYS)

function normalizeOptionalString(value, fieldLabel, maxLength, errors, fieldKey) {
  if (value === undefined || value === null) {
    return null
  }
  if (typeof value !== 'string') {
    errors[fieldKey] = `${fieldLabel} must be text.`
    return null
  }
  const trimmed = value.trim()
  if (trimmed.length === 0) {
    return null
  }
  if (trimmed.length > maxLength) {
    errors[fieldKey] = `${fieldLabel} must be ${maxLength} characters or fewer.`
  }
  return trimmed
}

function isValidDateKey(value) {
  if (typeof value !== 'string') {
    return false
  }
  try {
    parseDateKey(value)
    return true
  } catch {
    return false
  }
}

export function validateDetailsFields(input, targetType) {
  const errors = {}
  const source = input && typeof input === 'object' ? input : {}

  let name = ''
  if (typeof source.name !== 'string') {
    errors.name = 'Enter a habit name.'
  } else {
    name = source.name.trim()
    if (name.length === 0) {
      errors.name = 'Enter a habit name.'
    } else if (name.length > HABIT_FIELD_LIMITS.nameMaxLength) {
      errors.name = `Habit name must be ${HABIT_FIELD_LIMITS.nameMaxLength} characters or fewer.`
    }
  }

  const description = normalizeOptionalString(
    source.description,
    'Description',
    HABIT_FIELD_LIMITS.descriptionMaxLength,
    errors,
    'description',
  )

  if (!HABIT_CATEGORIES.includes(source.category)) {
    errors.category = 'Choose a valid category.'
  }

  const icon = normalizeOptionalString(
    source.icon,
    'Icon',
    HABIT_FIELD_LIMITS.iconMaxLength,
    errors,
    'icon',
  )

  const targetTimeLabel = normalizeOptionalString(
    source.targetTimeLabel,
    'Time label',
    HABIT_FIELD_LIMITS.targetTimeLabelMaxLength,
    errors,
    'targetTimeLabel',
  )

  if (targetTimeLabel !== null && targetType === 'numeric') {
    errors.targetTimeLabel =
      'Time label is only available for simple completion habits.'
  }

  return {
    errors,
    normalized: {
      name,
      description,
      category: source.category,
      icon,
      targetTimeLabel,
    },
  }
}

export function validateScheduleAndTargetFields(input) {
  const errors = {}
  const source = input && typeof input === 'object' ? input : {}

  if (!FREQUENCY_TYPES.includes(source.frequencyType)) {
    errors.frequencyType = 'Choose a valid frequency.'
  }

  let scheduledWeekdays = []
  if (source.frequencyType === 'selected_weekdays') {
    if (!Array.isArray(source.scheduledWeekdays)) {
      errors.scheduledWeekdays = 'Select at least one weekday.'
    } else if (source.scheduledWeekdays.length === 0) {
      errors.scheduledWeekdays = 'Select at least one weekday.'
    } else {
      const seen = new Set()
      let hasInvalid = false
      let hasDuplicate = false

      for (const day of source.scheduledWeekdays) {
        if (typeof day !== 'string' || !VALID_WEEKDAY_SET.has(day)) {
          hasInvalid = true
        } else if (seen.has(day)) {
          hasDuplicate = true
        } else {
          seen.add(day)
        }
      }

      if (hasInvalid) {
        errors.scheduledWeekdays = 'Selected weekdays contain an invalid day.'
      } else if (hasDuplicate) {
        errors.scheduledWeekdays = 'Remove duplicate weekdays.'
      } else {
        scheduledWeekdays = WEEKDAY_KEYS.filter((day) => seen.has(day))
      }
    }
  }

  if (!TARGET_TYPES.includes(source.targetType)) {
    errors.targetType = 'Choose a valid target type.'
  }

  let targetValue = null
  let targetUnit = null

  if (source.targetType === 'numeric') {
    if (
      typeof source.targetValue !== 'number' ||
      !Number.isFinite(source.targetValue) ||
      source.targetValue <= 0
    ) {
      errors.targetValue = 'Enter a target value greater than 0.'
    } else {
      targetValue = source.targetValue
    }

    targetUnit = normalizeOptionalString(
      source.targetUnit,
      'Target unit',
      HABIT_FIELD_LIMITS.targetUnitMaxLength,
      errors,
      'targetUnit',
    )
  }

  return {
    errors,
    normalized: {
      frequencyType: source.frequencyType,
      scheduledWeekdays,
      targetType: source.targetType,
      targetValue,
      targetUnit,
    },
  }
}

export function validateAndNormalizeHabitInput(input) {
  const source = input && typeof input === 'object' ? input : {}

  const scheduleTargetResult = validateScheduleAndTargetFields(source)
  const detailsResult = validateDetailsFields(
    source,
    scheduleTargetResult.normalized.targetType,
  )

  const errors = {
    ...detailsResult.errors,
    ...scheduleTargetResult.errors,
  }

  const startDateValid = isValidDateKey(source.startDate)
  if (!startDateValid) {
    errors.startDate = 'Enter a valid start date (YYYY-MM-DD).'
  }

  let endDate = null
  if (
    source.endDate !== undefined &&
    source.endDate !== null &&
    !(typeof source.endDate === 'string' && source.endDate.trim() === '')
  ) {
    if (!isValidDateKey(source.endDate)) {
      errors.endDate = 'Enter a valid end date (YYYY-MM-DD).'
    } else {
      endDate = source.endDate
      if (startDateValid && endDate < source.startDate) {
        errors.endDate = 'End date cannot be earlier than start date.'
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    normalized: {
      ...detailsResult.normalized,
      ...scheduleTargetResult.normalized,
      startDate: source.startDate,
      endDate,
    },
  }
}

export function validateHabitInput(input) {
  const { valid, errors } = validateAndNormalizeHabitInput(input)
  return { valid, errors }
}
