import { WEEKDAY_KEYS, getLocalDateKey } from '../../utils/date.js'
import { HABIT_CATEGORIES, WEEKDAY_OPTIONS } from './habitConstants.js'
import { getEarliestVersion } from './habitDisplay.js'
import { getEffectiveVersion } from './habitSchedule.js'

export { WEEKDAY_OPTIONS }

export function createInitialHabitFormValues(todayKey = getLocalDateKey()) {
  return {
    name: '',
    description: '',
    category: HABIT_CATEGORIES[0],
    frequencyType: 'daily',
    scheduledWeekdays: [],
    targetType: 'boolean',
    targetTimeLabel: '',
    targetValue: '',
    targetUnit: '',
    startDate: todayKey,
    endDate: '',
  }
}

export function createEditHabitFormValues(habit, todayKey = getLocalDateKey()) {
  let effectiveVersion = null
  try {
    effectiveVersion = getEffectiveVersion(habit, todayKey)
  } catch {
    effectiveVersion = null
  }
  const version = effectiveVersion ?? getEarliestVersion(habit.versions)

  return {
    name: habit.name ?? '',
    description: habit.description ?? '',
    category: habit.category ?? HABIT_CATEGORIES[0],
    frequencyType: version?.frequencyType ?? 'daily',
    scheduledWeekdays: Array.isArray(version?.scheduledWeekdays)
      ? [...version.scheduledWeekdays]
      : [],
    targetType: version?.targetType ?? 'boolean',
    targetTimeLabel: habit.targetTimeLabel ?? '',
    targetValue:
      version?.targetValue !== null && version?.targetValue !== undefined
        ? String(version.targetValue)
        : '',
    targetUnit: version?.targetUnit ?? '',
    startDate: habit.startDate ?? todayKey,
    endDate: habit.endDate ?? '',
  }
}

export function parseNumericTargetInput(rawValue) {
  if (rawValue === null || rawValue === undefined) {
    return null
  }
  if (typeof rawValue === 'number') {
    return rawValue
  }
  if (typeof rawValue === 'string') {
    const trimmed = rawValue.trim()
    if (trimmed === '') {
      return null
    }
    return Number(trimmed)
  }
  return Number.NaN
}

function normalizeOptionalFormText(value) {
  if (value === null || value === undefined) {
    return null
  }
  if (typeof value !== 'string') {
    return value
  }
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

function areArraysEqual(a, b) {
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

export function toCreateHabitInput(formValues) {
  const isSelectedWeekdays = formValues.frequencyType === 'selected_weekdays'
  const isNumeric = formValues.targetType === 'numeric'

  return {
    name: formValues.name,
    description: formValues.description,
    category: formValues.category,
    icon: null,
    frequencyType: formValues.frequencyType,
    scheduledWeekdays: isSelectedWeekdays
      ? [...formValues.scheduledWeekdays]
      : [],
    targetType: formValues.targetType,
    targetTimeLabel: isNumeric ? null : formValues.targetTimeLabel,
    targetValue: isNumeric
      ? parseNumericTargetInput(formValues.targetValue)
      : null,
    targetUnit: isNumeric ? formValues.targetUnit : null,
    startDate: formValues.startDate,
    endDate: formValues.endDate,
  }
}

export function buildHabitUpdate(habit, formValues, todayKey) {
  let effectiveVersion = null
  try {
    effectiveVersion = getEffectiveVersion(habit, todayKey)
  } catch {
    effectiveVersion = null
  }
  const currentVersion = effectiveVersion ?? getEarliestVersion(habit.versions)

  const details = {}
  const nextName =
    typeof formValues.name === 'string'
      ? formValues.name.trim()
      : formValues.name
  if (nextName !== habit.name) {
    details.name = formValues.name
  }

  const nextDescription = normalizeOptionalFormText(formValues.description)
  if (nextDescription !== (habit.description ?? null)) {
    details.description = nextDescription
  }

  if (formValues.category !== habit.category) {
    details.category = formValues.category
  }

  if (formValues.targetType === 'boolean') {
    const nextTimeLabel = normalizeOptionalFormText(formValues.targetTimeLabel)
    if (nextTimeLabel !== (habit.targetTimeLabel ?? null)) {
      details.targetTimeLabel = nextTimeLabel
    }
  }

  const scheduleTarget = {}
  const nextFrequencyType = formValues.frequencyType
  const frequencyChanged = nextFrequencyType !== currentVersion.frequencyType

  if (frequencyChanged) {
    scheduleTarget.frequencyType = nextFrequencyType
  }

  if (nextFrequencyType === 'selected_weekdays') {
    const nextWeekdays = WEEKDAY_KEYS.filter((key) =>
      formValues.scheduledWeekdays.includes(key),
    )
    const currentWeekdays = WEEKDAY_KEYS.filter((key) =>
      (currentVersion.scheduledWeekdays ?? []).includes(key),
    )
    if (frequencyChanged || !areArraysEqual(nextWeekdays, currentWeekdays)) {
      scheduleTarget.scheduledWeekdays = nextWeekdays
    }
  }

  const nextTargetType = formValues.targetType
  const targetTypeChanged = nextTargetType !== currentVersion.targetType
  if (targetTypeChanged) {
    scheduleTarget.targetType = nextTargetType
  }

  if (nextTargetType === 'numeric') {
    const nextTargetValue = parseNumericTargetInput(formValues.targetValue)
    if (targetTypeChanged || nextTargetValue !== currentVersion.targetValue) {
      scheduleTarget.targetValue = nextTargetValue
    }

    const nextTargetUnit = normalizeOptionalFormText(formValues.targetUnit)
    if (nextTargetUnit !== (currentVersion.targetUnit ?? null)) {
      scheduleTarget.targetUnit = nextTargetUnit
    }
  }

  const dates = {}
  const isStartDateEditable = habit.startDate > todayKey
  if (isStartDateEditable && formValues.startDate !== habit.startDate) {
    dates.startDate = formValues.startDate
  }

  const nextEndDate = normalizeOptionalFormText(formValues.endDate)
  if (nextEndDate !== (habit.endDate ?? null)) {
    dates.endDate = nextEndDate
  }

  return {
    details: Object.keys(details).length > 0 ? details : null,
    scheduleTarget:
      Object.keys(scheduleTarget).length > 0 ? scheduleTarget : null,
    dates: Object.keys(dates).length > 0 ? dates : null,
  }
}

export function getErrorSummaryItems(errors, fieldElementIds) {
  return Object.entries(errors).map(([fieldKey, message]) => ({
    fieldKey,
    message,
    targetId:
      fieldKey !== 'form' && fieldElementIds[fieldKey]
        ? fieldElementIds[fieldKey]
        : null,
  }))
}
