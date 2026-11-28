import { WEEKDAY_KEYS, parseDateKey } from '../../utils/date.js'
import {
  FREQUENCY_TYPES,
  HABIT_CATEGORIES,
  HABIT_FIELD_LIMITS,
  HABIT_STATUSES,
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

const STORED_HABIT_KEYS = Object.freeze([
  'schemaVersion',
  'name',
  'description',
  'category',
  'icon',
  'targetTimeLabel',
  'startDate',
  'endDate',
  'status',
  'versions',
  'createdAt',
  'updatedAt',
])
const STORED_HABIT_KEY_SET = new Set(STORED_HABIT_KEYS)

const STORED_VERSION_KEYS = Object.freeze([
  'effectiveFrom',
  'frequencyType',
  'scheduledWeekdays',
  'targetType',
  'targetValue',
  'targetUnit',
])
const STORED_VERSION_KEY_SET = new Set(STORED_VERSION_KEYS)

const MAX_STORED_VERSIONS = 400
const VALID_STATUS_SET = new Set(Object.values(HABIT_STATUSES))
const STRICT_ISO_UTC_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function hasExactKeys(obj, expectedKeys, allowedKeySet) {
  const keys = Object.keys(obj)
  for (const key of keys) {
    if (!allowedKeySet.has(key)) {
      return { ok: false, reason: 'unknown-keys' }
    }
  }
  for (const key of expectedKeys) {
    if (!Object.hasOwn(obj, key)) {
      return { ok: false, reason: 'missing-keys' }
    }
  }
  return { ok: true }
}

function isCanonicalOptionalString(value, maxLength) {
  if (value === null) {
    return true
  }
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.trim() === value &&
    value.length <= maxLength
  )
}

function isStrictIsoUtcTimestamp(value) {
  if (typeof value !== 'string' || !STRICT_ISO_UTC_PATTERN.test(value)) {
    return false
  }
  const datePart = value.slice(0, 10)
  if (!isValidDateKey(datePart)) {
    return false
  }
  const ms = Date.parse(value)
  return !Number.isNaN(ms) && new Date(ms).toISOString() === value
}

function validateStoredVersion(version, index, prevEffectiveFrom, startDate) {
  if (!isPlainObject(version)) {
    return { ok: false, reason: 'invalid-version-keys' }
  }

  const versionKeysCheck = hasExactKeys(
    version,
    STORED_VERSION_KEYS,
    STORED_VERSION_KEY_SET,
  )
  if (!versionKeysCheck.ok) {
    return { ok: false, reason: 'invalid-version-keys' }
  }

  if (!isValidDateKey(version.effectiveFrom)) {
    return { ok: false, reason: 'invalid-version-effective-from' }
  }
  if (index === 0 && version.effectiveFrom !== startDate) {
    return { ok: false, reason: 'invalid-version-effective-from' }
  }
  if (prevEffectiveFrom !== null && version.effectiveFrom <= prevEffectiveFrom) {
    return { ok: false, reason: 'invalid-version-effective-from' }
  }

  if (!FREQUENCY_TYPES.includes(version.frequencyType)) {
    return { ok: false, reason: 'invalid-version-schedule' }
  }
  if (!Array.isArray(version.scheduledWeekdays)) {
    return { ok: false, reason: 'invalid-version-schedule' }
  }
  if (
    version.frequencyType === 'daily' &&
    version.scheduledWeekdays.length !== 0
  ) {
    return { ok: false, reason: 'invalid-version-schedule' }
  }
  if (version.frequencyType === 'selected_weekdays') {
    const weekdayCheck = validateScheduleAndTargetFields({
      frequencyType: version.frequencyType,
      scheduledWeekdays: version.scheduledWeekdays,
      targetType: 'boolean',
    })
    if (weekdayCheck.errors.scheduledWeekdays) {
      return { ok: false, reason: 'invalid-version-schedule' }
    }
    const canonicalWeekdays = weekdayCheck.normalized.scheduledWeekdays
    if (
      canonicalWeekdays.length !== version.scheduledWeekdays.length ||
      canonicalWeekdays.some(
        (day, dayIndex) => day !== version.scheduledWeekdays[dayIndex],
      )
    ) {
      return { ok: false, reason: 'invalid-version-schedule' }
    }
  }

  if (!TARGET_TYPES.includes(version.targetType)) {
    return { ok: false, reason: 'invalid-version-target' }
  }
  if (version.targetType === 'boolean') {
    if (version.targetValue !== null || version.targetUnit !== null) {
      return { ok: false, reason: 'invalid-version-target' }
    }
  } else {
    if (
      typeof version.targetValue !== 'number' ||
      !Number.isFinite(version.targetValue) ||
      version.targetValue <= 0
    ) {
      return { ok: false, reason: 'invalid-version-target' }
    }
    if (
      !isCanonicalOptionalString(
        version.targetUnit,
        HABIT_FIELD_LIMITS.targetUnitMaxLength,
      )
    ) {
      return { ok: false, reason: 'invalid-version-target' }
    }
  }

  return {
    ok: true,
    version: {
      effectiveFrom: version.effectiveFrom,
      frequencyType: version.frequencyType,
      scheduledWeekdays: [...version.scheduledWeekdays],
      targetType: version.targetType,
      targetValue: version.targetValue,
      targetUnit: version.targetUnit,
    },
  }
}

/**
 * Strictly validate a canonical stored Firestore habit document and convert it
 * to a fresh domain Habit object with `id`. Rejects unnormalized values rather
 * than silently normalizing them, and returns only short reason codes on failure.
 */
export function validateStoredHabitDocument(id, data) {
  if (
    typeof id !== 'string' ||
    id.length === 0 ||
    id.trim() !== id ||
    id.includes('/') ||
    /\s/.test(id)
  ) {
    return { ok: false, reason: 'invalid-id' }
  }

  if (!isPlainObject(data)) {
    return { ok: false, reason: 'not-an-object' }
  }

  const keysCheck = hasExactKeys(data, STORED_HABIT_KEYS, STORED_HABIT_KEY_SET)
  if (!keysCheck.ok) {
    return keysCheck
  }

  if (data.schemaVersion !== 1) {
    return { ok: false, reason: 'invalid-schema-version' }
  }

  if (typeof data.status !== 'string' || !VALID_STATUS_SET.has(data.status)) {
    return { ok: false, reason: 'invalid-status' }
  }

  if (!isStrictIsoUtcTimestamp(data.createdAt)) {
    return { ok: false, reason: 'invalid-created-at' }
  }

  if (!isStrictIsoUtcTimestamp(data.updatedAt)) {
    return { ok: false, reason: 'invalid-updated-at' }
  }

  if (!isValidDateKey(data.startDate)) {
    return { ok: false, reason: 'invalid-start-date' }
  }

  if (data.endDate !== null && !isValidDateKey(data.endDate)) {
    return { ok: false, reason: 'invalid-end-date' }
  }

  if (data.endDate !== null && data.endDate < data.startDate) {
    return { ok: false, reason: 'end-before-start' }
  }

  if (
    typeof data.name !== 'string' ||
    data.name.length === 0 ||
    data.name.trim() !== data.name ||
    data.name.length > HABIT_FIELD_LIMITS.nameMaxLength
  ) {
    return { ok: false, reason: 'invalid-name' }
  }

  if (
    !isCanonicalOptionalString(
      data.description,
      HABIT_FIELD_LIMITS.descriptionMaxLength,
    )
  ) {
    return { ok: false, reason: 'invalid-description' }
  }

  if (
    typeof data.category !== 'string' ||
    !HABIT_CATEGORIES.includes(data.category)
  ) {
    return { ok: false, reason: 'invalid-category' }
  }

  if (!isCanonicalOptionalString(data.icon, HABIT_FIELD_LIMITS.iconMaxLength)) {
    return { ok: false, reason: 'invalid-icon' }
  }

  if (
    !isCanonicalOptionalString(
      data.targetTimeLabel,
      HABIT_FIELD_LIMITS.targetTimeLabelMaxLength,
    )
  ) {
    return { ok: false, reason: 'invalid-target-time-label' }
  }

  if (
    !Array.isArray(data.versions) ||
    data.versions.length === 0 ||
    data.versions.length > MAX_STORED_VERSIONS
  ) {
    return { ok: false, reason: 'invalid-versions-array' }
  }

  const normalizedVersions = []
  let prevEffectiveFrom = null
  for (let i = 0; i < data.versions.length; i += 1) {
    const versionResult = validateStoredVersion(
      data.versions[i],
      i,
      prevEffectiveFrom,
      data.startDate,
    )
    if (!versionResult.ok) {
      return versionResult
    }
    normalizedVersions.push(versionResult.version)
    prevEffectiveFrom = versionResult.version.effectiveFrom
  }

  const latestVersion = normalizedVersions[normalizedVersions.length - 1]
  if (data.targetTimeLabel !== null && latestVersion.targetType === 'numeric') {
    return { ok: false, reason: 'target-time-label-on-numeric' }
  }

  return {
    ok: true,
    habit: {
      id,
      name: data.name,
      description: data.description,
      category: data.category,
      icon: data.icon,
      targetTimeLabel: data.targetTimeLabel,
      startDate: data.startDate,
      endDate: data.endDate,
      status: data.status,
      versions: normalizedVersions,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    },
  }
}
