import { describe, expect, it } from 'vitest'
import {
  WEEKDAY_OPTIONS,
  buildHabitUpdate,
  createEditHabitFormValues,
  createInitialHabitFormValues,
  getErrorSummaryItems,
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

describe('createEditHabitFormValues & buildHabitUpdate', () => {
  const startedHabit = {
    id: 'habit-1',
    name: 'Core Java',
    description: 'Practice collections',
    category: 'Learning',
    icon: null,
    targetTimeLabel: null,
    startDate: '2026-11-10',
    endDate: null,
    status: 'active',
    versions: [
      {
        effectiveFrom: '2026-11-10',
        frequencyType: 'selected_weekdays',
        scheduledWeekdays: ['mon', 'wed', 'fri'],
        targetType: 'numeric',
        targetValue: 60,
        targetUnit: 'minutes',
      },
    ],
  }

  const futureHabitOutOfOrder = {
    id: 'habit-2',
    name: 'Wake up early',
    description: null,
    category: 'Personal',
    icon: null,
    targetTimeLabel: '5:00 AM',
    startDate: '2026-12-05',
    endDate: '2026-12-31',
    status: 'active',
    versions: [
      {
        effectiveFrom: '2026-12-10',
        frequencyType: 'daily',
        scheduledWeekdays: [],
        targetType: 'numeric',
        targetValue: 1,
        targetUnit: null,
      },
      {
        effectiveFrom: '2026-12-05',
        frequencyType: 'daily',
        scheduledWeekdays: [],
        targetType: 'boolean',
        targetValue: null,
        targetUnit: null,
      },
    ],
  }

  it('initializes edit form values from the version with smallest effectiveFrom when not started', () => {
    const values = createEditHabitFormValues(futureHabitOutOfOrder, '2026-11-27')
    expect(values.targetType).toBe('boolean')
    expect(values.targetTimeLabel).toBe('5:00 AM')
    expect(values.startDate).toBe('2026-12-05')
    expect(values.endDate).toBe('2026-12-31')
  })

  it('returns all null groups when nothing changed (ignoring whitespace and weekday order)', () => {
    const initial = createEditHabitFormValues(startedHabit, '2026-11-27')
    const update = buildHabitUpdate(
      startedHabit,
      {
        ...initial,
        name: '  Core Java  ',
        scheduledWeekdays: ['fri', 'mon', 'wed'],
        endDate: '   ',
      },
      '2026-11-27',
    )

    expect(update).toEqual({
      details: null,
      scheduleTarget: null,
      dates: null,
    })
  })

  it('routes details, schedule, and dates only to their respective groups', () => {
    const base = createEditHabitFormValues(startedHabit, '2026-11-27')

    expect(
      buildHabitUpdate(
        startedHabit,
        { ...base, description: '   ', category: 'Personal' },
        '2026-11-27',
      ),
    ).toEqual({
      details: { description: null, category: 'Personal' },
      scheduleTarget: null,
      dates: null,
    })

    expect(
      buildHabitUpdate(
        startedHabit,
        { ...base, frequencyType: 'daily' },
        '2026-11-27',
      ),
    ).toEqual({
      details: null,
      scheduleTarget: { frequencyType: 'daily' },
      dates: null,
    })

    expect(
      buildHabitUpdate(
        startedHabit,
        { ...base, endDate: '2026-12-31' },
        '2026-11-27',
      ),
    ).toEqual({
      details: null,
      scheduleTarget: null,
      dates: { endDate: '2026-12-31' },
    })
  })

  it('ignores startDate changes when already started, and includes startDate when future', () => {
    const startedValues = createEditHabitFormValues(startedHabit, '2026-11-27')
    expect(
      buildHabitUpdate(
        startedHabit,
        { ...startedValues, startDate: '2026-11-28' },
        '2026-11-27',
      ),
    ).toEqual({
      details: null,
      scheduleTarget: null,
      dates: null,
    })

    const futureValues = createEditHabitFormValues(
      futureHabitOutOfOrder,
      '2026-11-27',
    )
    expect(
      buildHabitUpdate(
        futureHabitOutOfOrder,
        { ...futureValues, startDate: '2026-12-01' },
        '2026-11-27',
      ),
    ).toEqual({
      details: null,
      scheduleTarget: null,
      dates: { startDate: '2026-12-01' },
    })
  })

  it('handles numeric <-> boolean switches cleanly without leaking cross-type fields', () => {
    const numericValues = createEditHabitFormValues(startedHabit, '2026-11-27')
    expect(
      buildHabitUpdate(
        startedHabit,
        {
          ...numericValues,
          targetType: 'boolean',
          targetTimeLabel: ' 6:30 AM ',
        },
        '2026-11-27',
      ),
    ).toEqual({
      details: { targetTimeLabel: '6:30 AM' },
      scheduleTarget: { targetType: 'boolean' },
      dates: null,
    })

    const boolValues = createEditHabitFormValues(
      futureHabitOutOfOrder,
      '2026-11-27',
    )
    expect(
      buildHabitUpdate(
        futureHabitOutOfOrder,
        {
          ...boolValues,
          targetType: 'numeric',
          targetValue: '30',
          targetUnit: 'minutes',
        },
        '2026-11-27',
      ),
    ).toEqual({
      details: null,
      scheduleTarget: {
        targetType: 'numeric',
        targetValue: 30,
        targetUnit: 'minutes',
      },
      dates: null,
    })
  })

  it('maps error summary items only to visible field IDs and treats non-visible keys as summary-only', () => {
    const items = getErrorSummaryItems(
      {
        form: 'Restore first.',
        name: 'Enter a habit name.',
        startDate: 'Start date cannot be changed.',
      },
      { name: 'habit-name' },
    )

    expect(items).toEqual([
      { fieldKey: 'form', message: 'Restore first.', targetId: null },
      { fieldKey: 'name', message: 'Enter a habit name.', targetId: 'habit-name' },
      {
        fieldKey: 'startDate',
        message: 'Start date cannot be changed.',
        targetId: null,
      },
    ])
  })
})
