import { WEEKDAY_KEYS, getLocalDateKey } from '../../utils/date.js'
import { HABIT_CATEGORIES } from './habitConstants.js'

const WEEKDAY_NAMES = Object.freeze({
  mon: { shortLabel: 'Mon', fullLabel: 'Monday' },
  tue: { shortLabel: 'Tue', fullLabel: 'Tuesday' },
  wed: { shortLabel: 'Wed', fullLabel: 'Wednesday' },
  thu: { shortLabel: 'Thu', fullLabel: 'Thursday' },
  fri: { shortLabel: 'Fri', fullLabel: 'Friday' },
  sat: { shortLabel: 'Sat', fullLabel: 'Saturday' },
  sun: { shortLabel: 'Sun', fullLabel: 'Sunday' },
})

export const WEEKDAY_OPTIONS = Object.freeze(
  WEEKDAY_KEYS.map((key) => ({
    key,
    shortLabel: WEEKDAY_NAMES[key].shortLabel,
    fullLabel: WEEKDAY_NAMES[key].fullLabel,
  })),
)

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
