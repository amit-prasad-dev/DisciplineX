import { WEEKDAY_KEYS, parseDateKey } from '../../utils/date.js'
import { WEEKDAY_OPTIONS } from './habitConstants.js'
import { getEffectiveVersion } from './habitSchedule.js'

const MONTH_SHORT_NAMES = Object.freeze([
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
])

const WEEKDAY_SHORT_BY_KEY = Object.freeze(
  Object.fromEntries(WEEKDAY_OPTIONS.map((day) => [day.key, day.shortLabel])),
)

/**
 * Format a YYYY-MM-DD date key from its calendar parts (e.g. "27 Nov 2026")
 * without constructing a local-time Date. Returns "Date unavailable" on
 * malformed or impossible keys.
 */
export function formatDateKeyForDisplay(dateKey) {
  try {
    const { year, month, day } = parseDateKey(dateKey)
    return `${day} ${MONTH_SHORT_NAMES[month - 1]} ${year}`
  } catch {
    return 'Date unavailable'
  }
}

export function formatScheduleSummary(version) {
  if (!version) {
    return '—'
  }

  if (version.frequencyType === 'daily') {
    return 'Every day'
  }

  if (version.frequencyType === 'selected_weekdays') {
    const selectedSet = new Set(
      Array.isArray(version.scheduledWeekdays) ? version.scheduledWeekdays : [],
    )
    const orderedKeys = WEEKDAY_KEYS.filter((key) => selectedSet.has(key))

    if (orderedKeys.length === 0) {
      return 'No weekdays selected'
    }

    const formatted = orderedKeys
      .map((key) => WEEKDAY_SHORT_BY_KEY[key])
      .join(', ')

    if (orderedKeys.length === WEEKDAY_KEYS.length) {
      return `Selected weekdays: ${formatted}`
    }

    return formatted
  }

  return '—'
}

export function formatTargetSummary(version, targetTimeLabel) {
  if (!version) {
    return '—'
  }

  if (version.targetType === 'boolean') {
    return targetTimeLabel
      ? `Simple completion \u00b7 ${targetTimeLabel}`
      : 'Simple completion'
  }

  if (version.targetType === 'numeric') {
    if (version.targetUnit) {
      return `${version.targetValue} ${version.targetUnit}`
    }
    return String(version.targetValue)
  }

  return '—'
}

export function getEarliestVersion(versions) {
  if (!Array.isArray(versions) || versions.length === 0) {
    return null
  }
  let earliest = versions[0]
  for (let i = 1; i < versions.length; i += 1) {
    if (versions[i].effectiveFrom < earliest.effectiveFrom) {
      earliest = versions[i]
    }
  }
  return earliest
}

export function getHabitDisplayInfo(habit, todayKey) {
  let effectiveVersion = null
  try {
    effectiveVersion = getEffectiveVersion(habit, todayKey)
  } catch {
    effectiveVersion = null
  }

  const displayVersion = effectiveVersion ?? getEarliestVersion(habit?.versions)
  const startDateLabel = formatDateKeyForDisplay(habit?.startDate)
  const endDateLabel = habit?.endDate
    ? formatDateKeyForDisplay(habit.endDate)
    : 'No end date'

  let hasValidStart = false
  try {
    parseDateKey(habit?.startDate)
    parseDateKey(todayKey)
    hasValidStart = true
  } catch {
    hasValidStart = false
  }

  const isNotStarted =
    effectiveVersion === null || (hasValidStart && habit.startDate > todayKey)

  let isEnded = false
  if (habit?.endDate) {
    try {
      parseDateKey(habit.endDate)
      parseDateKey(todayKey)
      isEnded = habit.endDate < todayKey
    } catch {
      isEnded = false
    }
  }

  return {
    scheduleSummary: formatScheduleSummary(displayVersion),
    targetSummary: formatTargetSummary(displayVersion, habit?.targetTimeLabel),
    startDateLabel,
    endDateLabel,
    statusLabel: habit?.status === 'archived' ? 'Archived' : 'Active',
    startBadgeLabel: isNotStarted ? `Starts ${startDateLabel}` : null,
    endBadgeLabel: isEnded ? `Ended ${endDateLabel}` : null,
  }
}
