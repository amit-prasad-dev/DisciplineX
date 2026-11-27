import { describe, expect, it } from 'vitest'
import {
  WEEKDAY_OPTIONS,
  createInitialHabitFormValues,
  parseNumericTargetInput,
  toCreateHabitInput,
} from './habitFormUtils.js'

describe('WEEKDAY_OPTIONS', () => {
  it('lists all 7 weekdays in Monday-first order with short and full names', () => {
    expect(WEEKDAY_OPTIONS.map((day) => day.key)).toEqual([
      'mon',
      'tue',
      'wed',
      'thu',
      'fri',
      'sat',
      'sun',
    ])
    expect(WEEKDAY_OPTIONS[0]).toEqual({
      key: 'mon',
      shortLabel: 'Mon',
      fullLabel: 'Monday',
    })
    expect(WEEKDAY_OPTIONS[6]).toEqual({
      key: 'sun',
      shortLabel: 'Sun',
      fullLabel: 'Sunday',
    })
  })
})

describe('createInitialHabitFormValues', () => {
  it('sets startDate to the supplied local date key and clean defaults', () => {
    expect(createInitialHabitFormValues('2026-11-27')).toEqual({
      name: '',
      description: '',
      category: 'Learning',
      frequencyType: 'daily',
      scheduledWeekdays: [],
      targetType: 'boolean',
      targetTimeLabel: '',
      targetValue: '',
      targetUnit: '',
      startDate: '2026-11-27',
      endDate: '',
    })
  })
})

describe('parseNumericTargetInput', () => {
  it('converts empty strings to null and non-numeric strings to NaN', () => {
    expect(parseNumericTargetInput('')).toBeNull()
    expect(parseNumericTargetInput('   ')).toBeNull()
    expect(parseNumericTargetInput(null)).toBeNull()
    expect(parseNumericTargetInput(undefined)).toBeNull()
    expect(Number.isNaN(parseNumericTargetInput('abc'))).toBe(true)
    expect(parseNumericTargetInput('60')).toBe(60)
    expect(parseNumericTargetInput('0')).toBe(0)
    expect(parseNumericTargetInput('-5')).toBe(-5)
  })
})

describe('toCreateHabitInput', () => {
  it('includes only relevant fields for boolean + daily habits', () => {
    const input = toCreateHabitInput({
      name: 'Wake up early',
      description: '',
      category: 'Personal',
      frequencyType: 'daily',
      scheduledWeekdays: ['mon', 'wed'],
      targetType: 'boolean',
      targetTimeLabel: '5:00 AM',
      targetValue: '60',
      targetUnit: 'minutes',
      startDate: '2026-11-27',
      endDate: '',
    })

    expect(input).toEqual({
      name: 'Wake up early',
      description: '',
      category: 'Personal',
      icon: null,
      frequencyType: 'daily',
      scheduledWeekdays: [],
      targetType: 'boolean',
      targetTimeLabel: '5:00 AM',
      targetValue: null,
      targetUnit: null,
      startDate: '2026-11-27',
      endDate: '',
    })
  })

  it('includes only relevant fields for numeric + selected_weekdays habits', () => {
    const input = toCreateHabitInput({
      name: 'Core Java',
      description: 'Daily practice',
      category: 'Learning',
      frequencyType: 'selected_weekdays',
      scheduledWeekdays: ['mon', 'wed', 'fri'],
      targetType: 'numeric',
      targetTimeLabel: '6:00 AM',
      targetValue: '60',
      targetUnit: 'minutes',
      startDate: '2026-11-27',
      endDate: '2026-12-31',
    })

    expect(input).toEqual({
      name: 'Core Java',
      description: 'Daily practice',
      category: 'Learning',
      icon: null,
      frequencyType: 'selected_weekdays',
      scheduledWeekdays: ['mon', 'wed', 'fri'],
      targetType: 'numeric',
      targetTimeLabel: null,
      targetValue: 60,
      targetUnit: 'minutes',
      startDate: '2026-11-27',
      endDate: '2026-12-31',
    })
  })

  it('preserves empty targetValue as null and non-numeric targetValue as NaN for numeric targets', () => {
    const emptyVal = toCreateHabitInput({
      name: 'Read',
      description: '',
      category: 'Learning',
      frequencyType: 'daily',
      scheduledWeekdays: [],
      targetType: 'numeric',
      targetTimeLabel: '',
      targetValue: '',
      targetUnit: 'pages',
      startDate: '2026-11-27',
      endDate: '',
    })
    expect(emptyVal.targetValue).toBeNull()

    const badVal = toCreateHabitInput({
      name: 'Read',
      description: '',
      category: 'Learning',
      frequencyType: 'daily',
      scheduledWeekdays: [],
      targetType: 'numeric',
      targetTimeLabel: '',
      targetValue: 'twenty',
      targetUnit: 'pages',
      startDate: '2026-11-27',
      endDate: '',
    })
    expect(Number.isNaN(badVal.targetValue)).toBe(true)
  })
})
