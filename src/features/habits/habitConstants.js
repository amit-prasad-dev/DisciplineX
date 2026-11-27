import { WEEKDAY_KEYS } from '../../utils/date.js'

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

export const HABIT_CATEGORIES = Object.freeze([
  'Learning',
  'Fitness',
  'Personal',
  'Health',
])

export const HABIT_STATUSES = Object.freeze({
  ACTIVE: 'active',
  ARCHIVED: 'archived',
})

export const FREQUENCY_TYPES = Object.freeze(['daily', 'selected_weekdays'])

export const TARGET_TYPES = Object.freeze(['boolean', 'numeric'])

export const HABIT_FIELD_LIMITS = Object.freeze({
  nameMaxLength: 80,
  descriptionMaxLength: 300,
  targetTimeLabelMaxLength: 40,
  targetUnitMaxLength: 30,
  iconMaxLength: 40,
})
