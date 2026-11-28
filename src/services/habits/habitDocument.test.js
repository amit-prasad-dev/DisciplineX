import { describe, expect, it } from 'vitest'
import { HABIT_FIELD_LIMITS } from '../../features/habits/habitConstants.js'
import { createHabit } from '../../features/habits/habitOperations.js'
import { documentToHabit, habitToDocument } from './habitDocument.js'

function makeBooleanHabit() {
  const result = createHabit(
    {
      name: 'Morning Run',
      description: '',
      category: 'Fitness',
      icon: null,
      targetTimeLabel: '5:30 AM',
      startDate: '2026-05-01',
      endDate: null,
      frequencyType: 'daily',
      scheduledWeekdays: [],
      targetType: 'boolean',
    },
    { id: 'habit-bool-1', now: '2026-05-01T00:00:00.000Z' },
  )
  expect(result.ok).toBe(true)
  return result.habit
}

function makeNumericHabit() {
  const result = createHabit(
    {
      name: 'Solve Coding Problems',
      description: 'Daily DSA practice',
      category: 'Learning',
      icon: 'code',
      targetTimeLabel: null,
      startDate: '2026-05-01',
      endDate: '2026-06-30',
      frequencyType: 'selected_weekdays',
      scheduledWeekdays: ['mon', 'wed', 'fri'],
      targetType: 'numeric',
      targetValue: 3,
      targetUnit: 'problems',
    },
    { id: 'habit-num-1', now: '2026-05-01T05:30:00.123Z' },
  )
  expect(result.ok).toBe(true)
  return result.habit
}

function makeValidStoredDoc(overrides = {}) {
  return {
    ...habitToDocument(makeBooleanHabit()),
    ...overrides,
  }
}

function makeVersion(overrides = {}) {
  return {
    effectiveFrom: '2026-05-01',
    frequencyType: 'daily',
    scheduledWeekdays: [],
    targetType: 'boolean',
    targetValue: null,
    targetUnit: null,
    ...overrides,
  }
}

describe('habitToDocument', () => {
  it('maps a habit to exact Firestore keys with schemaVersion: 1, no id, no undefined, and keeps nulls as null', () => {
    const boolHabit = makeBooleanHabit()
    const docData = habitToDocument(boolHabit)

    expect('id' in docData).toBe(false)
    expect(docData.schemaVersion).toBe(1)
    expect(docData.description).toBeNull()
    expect(docData.icon).toBeNull()
    expect(docData.endDate).toBeNull()
    expect(docData.versions[0].targetValue).toBeNull()
    expect(docData.versions[0].targetUnit).toBeNull()

    for (const value of Object.values(docData)) {
      expect(value).not.toBeUndefined()
    }
    for (const version of docData.versions) {
      for (const value of Object.values(version)) {
        expect(value).not.toBeUndefined()
      }
    }
  })

  it('deep-copies without mutating the source habit or nested arrays', () => {
    const habit = makeNumericHabit()
    const snapshotBefore = structuredClone(habit)

    const docData = habitToDocument(habit)
    docData.versions[0].scheduledWeekdays.push('sun')
    docData.name = 'Mutated'

    expect(habit).toEqual(snapshotBefore)
  })
})

describe('documentToHabit', () => {
  it('round-trips boolean and numeric habits with id taken from document id', () => {
    const boolHabit = makeBooleanHabit()
    const boolDoc = habitToDocument(boolHabit)
    expect(documentToHabit(boolHabit.id, boolDoc)).toEqual({
      ok: true,
      habit: boolHabit,
    })

    const numHabit = makeNumericHabit()
    const numDoc = habitToDocument(numHabit)
    expect(documentToHabit('custom-doc-id', numDoc)).toEqual({
      ok: true,
      habit: { ...numHabit, id: 'custom-doc-id' },
    })
  })

  const tooManyVersions = Array.from({ length: 401 }, (_, i) => {
    const month = String(Math.floor(i / 28) + 1).padStart(2, '0')
    const day = String((i % 28) + 1).padStart(2, '0')
    const year = 2026 + Math.floor(i / 336)
    return makeVersion({ effectiveFrom: `${year}-${month}-${day}` })
  })

  const rejectionCases = [
    {
      label: 'empty document id',
      id: '',
      data: makeValidStoredDoc(),
      expectedCode: 'invalid-id',
    },
    {
      label: 'document id containing slash',
      id: 'bad/id',
      data: makeValidStoredDoc(),
      expectedCode: 'invalid-id',
    },
    {
      label: 'document id containing whitespace',
      id: 'bad id',
      data: makeValidStoredDoc(),
      expectedCode: 'invalid-id',
    },
    {
      label: 'non-object data (null)',
      id: 'h1',
      data: null,
      expectedCode: 'not-an-object',
    },
    {
      label: 'array data',
      id: 'h1',
      data: [],
      expectedCode: 'not-an-object',
    },
    {
      label: 'extra unknown top-level key (including stored id)',
      id: 'h1',
      data: makeValidStoredDoc({ id: 'h1' }),
      expectedCode: 'unknown-keys',
    },
    {
      label: 'missing required top-level key',
      id: 'h1',
      data: (() => {
        const docData = makeValidStoredDoc()
        delete docData.updatedAt
        return docData
      })(),
      expectedCode: 'missing-keys',
    },
    {
      label: 'schemaVersion not equal to 1',
      id: 'h1',
      data: makeValidStoredDoc({ schemaVersion: 2 }),
      expectedCode: 'invalid-schema-version',
    },
    {
      label: 'schemaVersion wrong type ("1")',
      id: 'h1',
      data: makeValidStoredDoc({ schemaVersion: '1' }),
      expectedCode: 'invalid-schema-version',
    },
    {
      label: 'status outside active/archived enum',
      id: 'h1',
      data: makeValidStoredDoc({ status: 'deleted' }),
      expectedCode: 'invalid-status',
    },
    {
      label: 'createdAt missing .sssZ format',
      id: 'h1',
      data: makeValidStoredDoc({ createdAt: '2026-05-01T00:00:00Z' }),
      expectedCode: 'invalid-created-at',
    },
    {
      label: 'createdAt with timezone offset instead of Z',
      id: 'h1',
      data: makeValidStoredDoc({ createdAt: '2026-05-01T00:00:00.000+05:30' }),
      expectedCode: 'invalid-created-at',
    },
    {
      label: 'createdAt impossible calendar instant',
      id: 'h1',
      data: makeValidStoredDoc({ createdAt: '2026-02-30T00:00:00.000Z' }),
      expectedCode: 'invalid-created-at',
    },
    {
      label: 'updatedAt non-ISO string',
      id: 'h1',
      data: makeValidStoredDoc({ updatedAt: 'not-a-timestamp' }),
      expectedCode: 'invalid-updated-at',
    },
    {
      label: 'invalid startDate',
      id: 'h1',
      data: makeValidStoredDoc({ startDate: '2026-02-29' }),
      expectedCode: 'invalid-start-date',
    },
    {
      label: 'invalid endDate',
      id: 'h1',
      data: makeValidStoredDoc({ endDate: '2026/06/01' }),
      expectedCode: 'invalid-end-date',
    },
    {
      label: 'endDate earlier than startDate',
      id: 'h1',
      data: makeValidStoredDoc({ startDate: '2026-05-10', endDate: '2026-05-09' }),
      expectedCode: 'end-before-start',
    },
    {
      label: 'untrimmed habit name',
      id: 'h1',
      data: makeValidStoredDoc({ name: '  Morning Run  ' }),
      expectedCode: 'invalid-name',
    },
    {
      label: 'empty habit name',
      id: 'h1',
      data: makeValidStoredDoc({ name: '' }),
      expectedCode: 'invalid-name',
    },
    {
      label: 'habit name over max length',
      id: 'h1',
      data: makeValidStoredDoc({
        name: 'x'.repeat(HABIT_FIELD_LIMITS.nameMaxLength + 1),
      }),
      expectedCode: 'invalid-name',
    },
    {
      label: 'empty string description (canonical is null)',
      id: 'h1',
      data: makeValidStoredDoc({ description: '' }),
      expectedCode: 'invalid-description',
    },
    {
      label: 'untrimmed description',
      id: 'h1',
      data: makeValidStoredDoc({ description: ' padded ' }),
      expectedCode: 'invalid-description',
    },
    {
      label: 'description over max length',
      id: 'h1',
      data: makeValidStoredDoc({
        description: 'x'.repeat(HABIT_FIELD_LIMITS.descriptionMaxLength + 1),
      }),
      expectedCode: 'invalid-description',
    },
    {
      label: 'category outside enum',
      id: 'h1',
      data: makeValidStoredDoc({ category: 'Work' }),
      expectedCode: 'invalid-category',
    },
    {
      label: 'empty string icon (canonical is null)',
      id: 'h1',
      data: makeValidStoredDoc({ icon: '' }),
      expectedCode: 'invalid-icon',
    },
    {
      label: 'untrimmed icon',
      id: 'h1',
      data: makeValidStoredDoc({ icon: ' code ' }),
      expectedCode: 'invalid-icon',
    },
    {
      label: 'icon over max length',
      id: 'h1',
      data: makeValidStoredDoc({
        icon: 'i'.repeat(HABIT_FIELD_LIMITS.iconMaxLength + 1),
      }),
      expectedCode: 'invalid-icon',
    },
    {
      label: 'empty string targetTimeLabel (canonical is null)',
      id: 'h1',
      data: makeValidStoredDoc({ targetTimeLabel: '' }),
      expectedCode: 'invalid-target-time-label',
    },
    {
      label: 'untrimmed targetTimeLabel',
      id: 'h1',
      data: makeValidStoredDoc({ targetTimeLabel: ' 5:30 AM ' }),
      expectedCode: 'invalid-target-time-label',
    },
    {
      label: 'targetTimeLabel over max length',
      id: 'h1',
      data: makeValidStoredDoc({
        targetTimeLabel: 't'.repeat(
          HABIT_FIELD_LIMITS.targetTimeLabelMaxLength + 1,
        ),
      }),
      expectedCode: 'invalid-target-time-label',
    },
    {
      label: 'versions not an array',
      id: 'h1',
      data: makeValidStoredDoc({ versions: 'bad' }),
      expectedCode: 'invalid-versions-array',
    },
    {
      label: 'empty versions array',
      id: 'h1',
      data: makeValidStoredDoc({ versions: [] }),
      expectedCode: 'invalid-versions-array',
    },
    {
      label: 'more than 400 versions',
      id: 'h1',
      data: makeValidStoredDoc({
        startDate: '2026-01-01',
        versions: tooManyVersions,
      }),
      expectedCode: 'invalid-versions-array',
    },
    {
      label: 'version with extra unknown key',
      id: 'h1',
      data: makeValidStoredDoc({
        versions: [makeVersion({ extra: true })],
      }),
      expectedCode: 'invalid-version-keys',
    },
    {
      label: 'version with missing key',
      id: 'h1',
      data: makeValidStoredDoc({
        versions: [
          (() => {
            const v = makeVersion()
            delete v.targetUnit
            return v
          })(),
        ],
      }),
      expectedCode: 'invalid-version-keys',
    },
    {
      label: 'version effectiveFrom invalid date',
      id: 'h1',
      data: makeValidStoredDoc({
        versions: [makeVersion({ effectiveFrom: '2026-13-01' })],
      }),
      expectedCode: 'invalid-version-effective-from',
    },
    {
      label: 'first version effectiveFrom does not equal startDate',
      id: 'h1',
      data: makeValidStoredDoc({
        startDate: '2026-05-01',
        versions: [makeVersion({ effectiveFrom: '2026-05-02' })],
      }),
      expectedCode: 'invalid-version-effective-from',
    },
    {
      label: 'duplicate effectiveFrom across versions',
      id: 'h1',
      data: makeValidStoredDoc({
        versions: [
          makeVersion({ effectiveFrom: '2026-05-01' }),
          makeVersion({ effectiveFrom: '2026-05-01' }),
        ],
      }),
      expectedCode: 'invalid-version-effective-from',
    },
    {
      label: 'non-ascending effectiveFrom across versions',
      id: 'h1',
      data: makeValidStoredDoc({
        startDate: '2026-05-02',
        versions: [
          makeVersion({ effectiveFrom: '2026-05-02' }),
          makeVersion({ effectiveFrom: '2026-05-01' }),
        ],
      }),
      expectedCode: 'invalid-version-effective-from',
    },
    {
      label: 'invalid frequencyType',
      id: 'h1',
      data: makeValidStoredDoc({
        versions: [makeVersion({ frequencyType: 'monthly' })],
      }),
      expectedCode: 'invalid-version-schedule',
    },
    {
      label: 'scheduledWeekdays not in Monday-first canonical order',
      id: 'h1',
      data: makeValidStoredDoc({
        versions: [
          makeVersion({
            frequencyType: 'selected_weekdays',
            scheduledWeekdays: ['fri', 'mon'],
          }),
        ],
      }),
      expectedCode: 'invalid-version-schedule',
    },
    {
      label: 'duplicate weekdays in scheduledWeekdays',
      id: 'h1',
      data: makeValidStoredDoc({
        versions: [
          makeVersion({
            frequencyType: 'selected_weekdays',
            scheduledWeekdays: ['mon', 'mon'],
          }),
        ],
      }),
      expectedCode: 'invalid-version-schedule',
    },
    {
      label: 'selected_weekdays with empty scheduledWeekdays',
      id: 'h1',
      data: makeValidStoredDoc({
        versions: [
          makeVersion({
            frequencyType: 'selected_weekdays',
            scheduledWeekdays: [],
          }),
        ],
      }),
      expectedCode: 'invalid-version-schedule',
    },
    {
      label: 'daily habit with non-empty scheduledWeekdays',
      id: 'h1',
      data: makeValidStoredDoc({
        versions: [
          makeVersion({
            frequencyType: 'daily',
            scheduledWeekdays: ['mon'],
          }),
        ],
      }),
      expectedCode: 'invalid-version-schedule',
    },
    {
      label: 'invalid targetType',
      id: 'h1',
      data: makeValidStoredDoc({
        versions: [makeVersion({ targetType: 'time' })],
      }),
      expectedCode: 'invalid-version-target',
    },
    {
      label: 'boolean habit with non-null targetValue',
      id: 'h1',
      data: makeValidStoredDoc({
        versions: [makeVersion({ targetType: 'boolean', targetValue: 1 })],
      }),
      expectedCode: 'invalid-version-target',
    },
    {
      label: 'boolean habit with non-null targetUnit',
      id: 'h1',
      data: makeValidStoredDoc({
        versions: [
          makeVersion({ targetType: 'boolean', targetUnit: 'times' }),
        ],
      }),
      expectedCode: 'invalid-version-target',
    },
    {
      label: 'numeric habit with non-positive targetValue',
      id: 'h1',
      data: makeValidStoredDoc({
        targetTimeLabel: null,
        versions: [
          makeVersion({
            targetType: 'numeric',
            targetValue: 0,
            targetUnit: 'pages',
          }),
        ],
      }),
      expectedCode: 'invalid-version-target',
    },
    {
      label: 'empty string targetUnit (canonical is null)',
      id: 'h1',
      data: makeValidStoredDoc({
        targetTimeLabel: null,
        versions: [
          makeVersion({
            targetType: 'numeric',
            targetValue: 10,
            targetUnit: '',
          }),
        ],
      }),
      expectedCode: 'invalid-version-target',
    },
    {
      label: 'untrimmed targetUnit',
      id: 'h1',
      data: makeValidStoredDoc({
        targetTimeLabel: null,
        versions: [
          makeVersion({
            targetType: 'numeric',
            targetValue: 10,
            targetUnit: ' pages ',
          }),
        ],
      }),
      expectedCode: 'invalid-version-target',
    },
    {
      label: 'targetUnit over max length',
      id: 'h1',
      data: makeValidStoredDoc({
        targetTimeLabel: null,
        versions: [
          makeVersion({
            targetType: 'numeric',
            targetValue: 10,
            targetUnit: 'u'.repeat(HABIT_FIELD_LIMITS.targetUnitMaxLength + 1),
          }),
        ],
      }),
      expectedCode: 'invalid-version-target',
    },
    {
      label: 'targetTimeLabel set when latest version is numeric',
      id: 'h1',
      data: makeValidStoredDoc({
        targetTimeLabel: '6:00 AM',
        versions: [
          makeVersion({
            targetType: 'numeric',
            targetValue: 20,
            targetUnit: 'minutes',
          }),
        ],
      }),
      expectedCode: 'target-time-label-on-numeric',
    },
  ]

  it.each(rejectionCases)(
    'rejects $label with reason "$expectedCode"',
    ({ id, data, expectedCode }) => {
      const result = documentToHabit(id, data)
      expect(result).toEqual({ ok: false, reason: expectedCode })
    },
  )

  it('never leaks document content in reason', () => {
    const canary = 'SECRET_SENSITIVE_HABIT_NAME_8842'
    const result = documentToHabit(
      'h1',
      makeValidStoredDoc({ name: canary, category: 'BadCategory' }),
    )
    expect(result.ok).toBe(false)
    expect(result.reason).not.toContain(canary)
    expect(result.reason).not.toContain('BadCategory')
  })
})
