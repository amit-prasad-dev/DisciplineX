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
