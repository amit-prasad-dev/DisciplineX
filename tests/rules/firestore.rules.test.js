// Note: The owner-allowed tests below are what prove firestore.rules was
// actually loaded into the emulator, since "denied" assertions alone would also
// pass if no rules or empty default-deny rules were active.

import { readFileSync } from 'node:fs'
import path from 'node:path'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing'
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { parseOwnerUidFromRules } from '../../scripts/rulesConfig.js'
import { HABIT_FIELD_LIMITS } from '../../src/features/habits/habitConstants.js'
import {
  archiveHabit,
  createHabit,
  restoreHabit,
  updateHabitDetails,
  updateHabitScheduleOrTarget,
} from '../../src/features/habits/habitOperations.js'
import {
  documentToHabit,
  habitToDocument,
} from '../../src/services/habits/habitDocument.js'

const RULES_PATH = path.resolve(process.cwd(), 'firestore.rules')
const RULES_TEXT = readFileSync(RULES_PATH, 'utf8')
const OWNER_UID = parseOwnerUidFromRules(RULES_TEXT)
const OTHER_UID = 'fake-non-owner-uid-12345'
const PROJECT_ID = 'demo-disciplinex'

const CREATED_NOW = '2026-05-01T08:00:00.000Z'
const UPDATED_NOW = '2026-05-02T08:00:00.000Z'
const LATER_NOW = '2026-05-03T08:00:00.000Z'

function makeAppHabit(overrides = {}) {
  const result = createHabit(
    {
      name: 'Morning Run',
      description: 'Quick aerobic session',
      category: 'Fitness',
      icon: 'run',
      targetTimeLabel: '6:00 AM',
      startDate: '2026-05-01',
      endDate: null,
      frequencyType: 'daily',
      scheduledWeekdays: [],
      targetType: 'boolean',
      ...overrides,
    },
    { id: 'habit-fixture-1', now: CREATED_NOW },
  )
  expect(result.ok).toBe(true)
  return result.habit
}

function makeValidHabitDoc(overrides = {}) {
  return {
    ...habitToDocument(makeAppHabit()),
    ...overrides,
  }
}

function makeValidProfileDoc(overrides = {}) {
  return {
    schemaVersion: 1,
    timeZone: 'Asia/Kolkata',
    createdAt: CREATED_NOW,
    updatedAt: CREATED_NOW,
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

function omitKey(obj, key) {
  const clone = { ...obj }
  delete clone[key]
  return clone
}

let testEnv

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      host: '127.0.0.1',
      port: 8080,
      rules: RULES_TEXT,
    },
  })
})

afterEach(async () => {
  if (testEnv) {
    await testEnv.clearFirestore()
  }
})

afterAll(async () => {
  if (testEnv) {
    await testEnv.cleanup()
  }
})

describe('firestore.rules', () => {
  describe('fixture sync with app mapping', () => {
    it('valid habit fixture produced via createHabit + habitToDocument passes documentToHabit and emulator create', async () => {
      const domainHabit = makeAppHabit()
      const firestoreDoc = habitToDocument(domainHabit)
      expect(documentToHabit(domainHabit.id, firestoreDoc)).toEqual({
        ok: true,
        habit: domainHabit,
      })

      const ownerDb = testEnv.authenticatedContext(OWNER_UID).firestore()
      await assertSucceeds(
        setDoc(
          doc(ownerDb, `users/${OWNER_UID}/habits/${domainHabit.id}`),
          firestoreDoc,
        ),
      )
    })
  })

  describe('access control & baseline paths', () => {
    it.each(['habits', 'dailyLogs', 'challenges'])(
      'allows the owner to query (%s)',
      async (colName) => {
        const ownerDb = testEnv.authenticatedContext(OWNER_UID).firestore()
        await assertSucceeds(
          getDocs(collection(ownerDb, `users/${OWNER_UID}/${colName}`)),
        )
      },
    )

    it('allows the owner to read profile/main and denies listing profile or reading other profile doc ids', async () => {
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(
          doc(ctx.firestore(), `users/${OWNER_UID}/profile/main`),
          makeValidProfileDoc(),
        )
        await setDoc(
          doc(ctx.firestore(), `users/${OWNER_UID}/profile/other`),
          makeValidProfileDoc(),
        )
      })

      const ownerDb = testEnv.authenticatedContext(OWNER_UID).firestore()
      await assertSucceeds(getDoc(doc(ownerDb, `users/${OWNER_UID}/profile/main`)))
      await assertFails(getDocs(collection(ownerDb, `users/${OWNER_UID}/profile`)))
      await assertFails(getDoc(doc(ownerDb, `users/${OWNER_UID}/profile/other`)))
    })

    it.each(['dailyLogs', 'challenges'])(
      'keeps %s owner-only read/write/delete in Phase 5',
      async (colName) => {
        const ownerDb = testEnv.authenticatedContext(OWNER_UID).firestore()
        const docRef = doc(ownerDb, `users/${OWNER_UID}/${colName}/sample-1`)

        await assertSucceeds(setDoc(docRef, { label: `fake-${colName}` }))
        await assertSucceeds(getDoc(docRef))
        await assertSucceeds(updateDoc(docRef, { label: `updated-${colName}` }))
        await assertSucceeds(deleteDoc(docRef))
      },
    )

    it.each([
      ['profile', 'main', makeValidProfileDoc()],
      ['habits', 'seeded-1', makeValidHabitDoc()],
      ['dailyLogs', 'seeded-1', { label: 'seeded' }],
      ['challenges', 'seeded-1', { label: 'seeded' }],
    ])(
      'denies unauthenticated read, query, and write on %s',
      async (colName, docId, seededData) => {
        await testEnv.withSecurityRulesDisabled(async (ctx) => {
          await setDoc(
            doc(ctx.firestore(), `users/${OWNER_UID}/${colName}/${docId}`),
            seededData,
          )
        })

        const unauthDb = testEnv.unauthenticatedContext().firestore()
        const docRef = doc(unauthDb, `users/${OWNER_UID}/${colName}/${docId}`)
        const colRef = collection(unauthDb, `users/${OWNER_UID}/${colName}`)

        await assertFails(getDoc(docRef))
        await assertFails(getDocs(colRef))
        await assertFails(setDoc(docRef, seededData))
      },
    )

    it('denies a signed-in non-owner on their own path (uid == path uid)', async () => {
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(
          doc(ctx.firestore(), `users/${OTHER_UID}/habits/h1`),
          makeValidHabitDoc(),
        )
      })

      const otherDb = testEnv.authenticatedContext(OTHER_UID).firestore()
      await assertFails(getDoc(doc(otherDb, `users/${OTHER_UID}/habits/h1`)))
      await assertFails(
        getDocs(collection(otherDb, `users/${OTHER_UID}/habits`)),
      )
      await assertFails(
        setDoc(
          doc(otherDb, `users/${OTHER_UID}/habits/h2`),
          makeValidHabitDoc(),
        ),
      )
    })

    it.each([
      ['profile', 'main', makeValidProfileDoc()],
      ['habits', 'h1', makeValidHabitDoc()],
      ['dailyLogs', 'h1', { label: 'seeded' }],
      ['challenges', 'h1', { label: 'seeded' }],
    ])(
      'denies a signed-in non-owner on the owner %s collection',
      async (colName, docId, payload) => {
        await testEnv.withSecurityRulesDisabled(async (ctx) => {
          await setDoc(
            doc(ctx.firestore(), `users/${OWNER_UID}/${colName}/${docId}`),
            payload,
          )
        })

        const otherDb = testEnv.authenticatedContext(OTHER_UID).firestore()
        await assertFails(
          getDoc(doc(otherDb, `users/${OWNER_UID}/${colName}/${docId}`)),
        )
        await assertFails(
          getDocs(collection(otherDb, `users/${OWNER_UID}/${colName}`)),
        )
        await assertFails(
          setDoc(
            doc(otherDb, `users/${OWNER_UID}/${colName}/new-1`),
            payload,
          ),
        )
      },
    )

    it('denies the owner on another user path', async () => {
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(
          doc(ctx.firestore(), `users/${OTHER_UID}/habits/h1`),
          makeValidHabitDoc(),
        )
      })

      const ownerDb = testEnv.authenticatedContext(OWNER_UID).firestore()
      await assertFails(getDoc(doc(ownerDb, `users/${OTHER_UID}/habits/h1`)))
      await assertFails(
        setDoc(
          doc(ownerDb, `users/${OTHER_UID}/habits/h2`),
          makeValidHabitDoc(),
        ),
      )
    })

    it('denies the owner on unlisted subcollections under users/{uid}', async () => {
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), `users/${OWNER_UID}/journals/j1`), {
          entry: 'Future',
        })
      })

      const ownerDb = testEnv.authenticatedContext(OWNER_UID).firestore()
      await assertFails(getDoc(doc(ownerDb, `users/${OWNER_UID}/journals/j1`)))
      await assertFails(
        setDoc(doc(ownerDb, `users/${OWNER_UID}/journals/j2`), {
          entry: 'Blocked',
        }),
      )
    })

    it('denies the owner on nested subcollections under users/{uid}/habits/{id}', async () => {
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(
          doc(ctx.firestore(), `users/${OWNER_UID}/habits/h1/revisions/r1`),
          { note: 'Nested' },
        )
      })

      const ownerDb = testEnv.authenticatedContext(OWNER_UID).firestore()
      await assertFails(
        getDoc(doc(ownerDb, `users/${OWNER_UID}/habits/h1/revisions/r1`)),
      )
      await assertFails(
        setDoc(
          doc(ownerDb, `users/${OWNER_UID}/habits/h1/revisions/r2`),
          { note: 'Blocked' },
        ),
      )
    })

    it('denies the owner on root-level collections and top-level users/{uid} document', async () => {
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(
          doc(ctx.firestore(), 'habits/root-h1'),
          makeValidHabitDoc(),
        )
        await setDoc(doc(ctx.firestore(), `users/${OWNER_UID}`), {
          topLevel: true,
        })
      })

      const ownerDb = testEnv.authenticatedContext(OWNER_UID).firestore()
      await assertFails(getDoc(doc(ownerDb, 'habits/root-h1')))
      await assertFails(
        setDoc(doc(ownerDb, 'habits/root-h2'), makeValidHabitDoc()),
      )
      await assertFails(getDoc(doc(ownerDb, `users/${OWNER_UID}`)))
      await assertFails(setDoc(doc(ownerDb, `users/${OWNER_UID}`), { a: 1 }))
    })
  })

  describe('habits allowed writes', () => {
    it('allows creating a valid boolean habit and a valid numeric habit', async () => {
      const ownerDb = testEnv.authenticatedContext(OWNER_UID).firestore()

      const boolDoc = makeValidHabitDoc()
      await assertSucceeds(
        setDoc(doc(ownerDb, `users/${OWNER_UID}/habits/h-bool`), boolDoc),
      )

      const numHabit = makeAppHabit({
        targetTimeLabel: null,
        frequencyType: 'selected_weekdays',
        scheduledWeekdays: ['mon', 'wed', 'fri'],
        targetType: 'numeric',
        targetValue: 5,
        targetUnit: 'pages',
      })
      await assertSucceeds(
        setDoc(
          doc(ownerDb, `users/${OWNER_UID}/habits/h-num`),
          habitToDocument(numHabit),
        ),
      )
    })

    it('allows habit details edit on update', async () => {
      const ownerDb = testEnv.authenticatedContext(OWNER_UID).firestore()
      const ref = doc(ownerDb, `users/${OWNER_UID}/habits/h-edit`)
      const initial = makeAppHabit()

      await assertSucceeds(setDoc(ref, habitToDocument(initial)))
      const edited = updateHabitDetails(
        initial,
        { name: 'Evening Walk', description: null },
        { now: UPDATED_NOW },
      )
      expect(edited.ok).toBe(true)
      await assertSucceeds(setDoc(ref, habitToDocument(edited.habit)))
    })

    it('allows update where only updatedAt and status change (archive) and subsequent restore', async () => {
      const ownerDb = testEnv.authenticatedContext(OWNER_UID).firestore()
      const ref = doc(ownerDb, `users/${OWNER_UID}/habits/h-archive`)
      const initial = makeAppHabit()

      await assertSucceeds(setDoc(ref, habitToDocument(initial)))

      const archived = archiveHabit(initial, { now: UPDATED_NOW })
      await assertSucceeds(
        updateDoc(ref, {
          status: archived.habit.status,
          updatedAt: archived.habit.updatedAt,
        }),
      )

      const restored = restoreHabit(archived.habit, { now: LATER_NOW })
      await assertSucceeds(
        updateDoc(ref, {
          status: restored.habit.status,
          updatedAt: restored.habit.updatedAt,
        }),
      )
    })

    it('allows appending a version and replacing the latest version in place', async () => {
      const ownerDb = testEnv.authenticatedContext(OWNER_UID).firestore()
      const ref = doc(ownerDb, `users/${OWNER_UID}/habits/h-versions`)
      const initial = makeAppHabit()

      await assertSucceeds(setDoc(ref, habitToDocument(initial)))

      const appended = updateHabitScheduleOrTarget(
        initial,
        {
          frequencyType: 'selected_weekdays',
          scheduledWeekdays: ['mon', 'thu'],
        },
        { todayKey: '2026-05-05', now: UPDATED_NOW },
      )
      expect(appended.ok).toBe(true)
      expect(appended.habit.versions).toHaveLength(2)
      await assertSucceeds(setDoc(ref, habitToDocument(appended.habit)))

      const replacedLatest = updateHabitScheduleOrTarget(
        appended.habit,
        {
          frequencyType: 'selected_weekdays',
          scheduledWeekdays: ['mon', 'tue', 'thu'],
        },
        { todayKey: '2026-05-05', now: LATER_NOW },
      )
      expect(replacedLatest.ok).toBe(true)
      expect(replacedLatest.habit.versions).toHaveLength(2)
      await assertSucceeds(setDoc(ref, habitToDocument(replacedLatest.habit)))
    })

    it.each([
      ['name at max limit', { name: 'a'.repeat(HABIT_FIELD_LIMITS.nameMaxLength) }],
      [
        'description at max limit',
        { description: 'b'.repeat(HABIT_FIELD_LIMITS.descriptionMaxLength) },
      ],
      ['icon at max limit', { icon: 'c'.repeat(HABIT_FIELD_LIMITS.iconMaxLength) }],
      [
        'targetTimeLabel at max limit',
        { targetTimeLabel: 'd'.repeat(HABIT_FIELD_LIMITS.targetTimeLabelMaxLength) },
      ],
      [
        'targetUnit at max limit',
        {
          targetTimeLabel: null,
          versions: [
            makeVersion({
              targetType: 'numeric',
              targetValue: 1,
              targetUnit: 'u'.repeat(HABIT_FIELD_LIMITS.targetUnitMaxLength),
            }),
          ],
        },
      ],
      [
        'versions at max limit (400)',
        {
          startDate: '2026-01-01',
          versions: Array.from({ length: 400 }, (_, i) =>
            makeVersion({
              effectiveFrom: i === 0 ? '2026-01-01' : '2026-05-01',
            }),
          ),
        },
      ],
    ])('allows habit with %s', async (_label, overrides) => {
      const ownerDb = testEnv.authenticatedContext(OWNER_UID).firestore()
      await assertSucceeds(
        setDoc(
          doc(ownerDb, `users/${OWNER_UID}/habits/h-limit`),
          makeValidHabitDoc(overrides),
        ),
      )
    })
  })

  describe('habits create denials', () => {
    const tooManyVersions = Array.from({ length: 401 }, (_, i) =>
      makeVersion({ effectiveFrom: i === 0 ? '2026-01-01' : '2026-05-01' }),
    )

    it.each([
      ['missing required key', omitKey(makeValidHabitDoc(), 'updatedAt')],
      ['extra unknown key', makeValidHabitDoc({ extraField: 'nope' })],
      ['stored id key included', makeValidHabitDoc({ id: 'h-deny' })],
      ['wrong schemaVersion', makeValidHabitDoc({ schemaVersion: 2 })],
      ['name empty', makeValidHabitDoc({ name: '' })],
      [
        'name limit + 1',
        makeValidHabitDoc({
          name: 'a'.repeat(HABIT_FIELD_LIMITS.nameMaxLength + 1),
        }),
      ],
      ['description empty string', makeValidHabitDoc({ description: '' })],
      [
        'description limit + 1',
        makeValidHabitDoc({
          description: 'b'.repeat(HABIT_FIELD_LIMITS.descriptionMaxLength + 1),
        }),
      ],
      ['icon empty string', makeValidHabitDoc({ icon: '' })],
      [
        'icon limit + 1',
        makeValidHabitDoc({
          icon: 'c'.repeat(HABIT_FIELD_LIMITS.iconMaxLength + 1),
        }),
      ],
      ['targetTimeLabel empty string', makeValidHabitDoc({ targetTimeLabel: '' })],
      [
        'targetTimeLabel limit + 1',
        makeValidHabitDoc({
          targetTimeLabel: 'd'.repeat(
            HABIT_FIELD_LIMITS.targetTimeLabelMaxLength + 1,
          ),
        }),
      ],
      [
        'targetUnit empty string',
        makeValidHabitDoc({
          targetTimeLabel: null,
          versions: [
            makeVersion({
              targetType: 'numeric',
              targetValue: 5,
              targetUnit: '',
            }),
          ],
        }),
      ],
      [
        'targetUnit limit + 1',
        makeValidHabitDoc({
          targetTimeLabel: null,
          versions: [
            makeVersion({
              targetType: 'numeric',
              targetValue: 5,
              targetUnit: 'u'.repeat(HABIT_FIELD_LIMITS.targetUnitMaxLength + 1),
            }),
          ],
        }),
      ],
      ['bad category', makeValidHabitDoc({ category: 'Work' })],
      ['bad status', makeValidHabitDoc({ status: 'paused' })],
      ['status "archived" on create', makeValidHabitDoc({ status: 'archived' })],
      ['bad startDate format', makeValidHabitDoc({ startDate: '2026/05/01' })],
      ['bad endDate format', makeValidHabitDoc({ endDate: '05-10-2026' })],
      [
        'endDate before startDate',
        makeValidHabitDoc({ startDate: '2026-05-10', endDate: '2026-05-09' }),
      ],
      [
        'bad createdAt format',
        makeValidHabitDoc({
          createdAt: '2026-05-01T08:00:00Z',
          updatedAt: '2026-05-01T08:00:00Z',
        }),
      ],
      [
        'createdAt != updatedAt on create',
        makeValidHabitDoc({
          createdAt: CREATED_NOW,
          updatedAt: UPDATED_NOW,
        }),
      ],
      ['versions empty', makeValidHabitDoc({ versions: [] })],
      [
        'versions length 401 (> 400)',
        makeValidHabitDoc({
          startDate: '2026-01-01',
          versions: tooManyVersions,
        }),
      ],
      [
        'first version effectiveFrom != startDate',
        makeValidHabitDoc({
          startDate: '2026-05-01',
          versions: [makeVersion({ effectiveFrom: '2026-05-02' })],
        }),
      ],
      [
        'first version wrong keys',
        makeValidHabitDoc({ versions: [makeVersion({ extra: true })] }),
      ],
      [
        'first version bad frequencyType',
        makeValidHabitDoc({
          versions: [makeVersion({ frequencyType: 'weekly' })],
        }),
      ],
      [
        'first version bad targetType',
        makeValidHabitDoc({ versions: [makeVersion({ targetType: 'time' })] }),
      ],
      [
        'first version boolean with numeric targetValue',
        makeValidHabitDoc({
          versions: [makeVersion({ targetType: 'boolean', targetValue: 1 })],
        }),
      ],
      [
        'first version numeric without positive targetValue',
        makeValidHabitDoc({
          versions: [
            makeVersion({
              targetType: 'numeric',
              targetValue: 0,
              targetUnit: 'pages',
            }),
          ],
        }),
      ],
      [
        'first version daily with weekdays',
        makeValidHabitDoc({
          versions: [
            makeVersion({ frequencyType: 'daily', scheduledWeekdays: ['mon'] }),
          ],
        }),
      ],
      [
        'weekday element not in allowed list',
        makeValidHabitDoc({
          versions: [
            makeVersion({
              frequencyType: 'selected_weekdays',
              scheduledWeekdays: ['monday'],
            }),
          ],
        }),
      ],
      [
        'duplicate weekday in scheduledWeekdays',
        makeValidHabitDoc({
          versions: [
            makeVersion({
              frequencyType: 'selected_weekdays',
              scheduledWeekdays: ['mon', 'mon'],
            }),
          ],
        }),
      ],
      [
        'last version wrong keys',
        makeValidHabitDoc({
          versions: [
            makeVersion(),
            makeVersion({ effectiveFrom: '2026-05-02', extra: true }),
          ],
        }),
      ],
      [
        'last version bad frequencyType',
        makeValidHabitDoc({
          versions: [
            makeVersion(),
            makeVersion({ effectiveFrom: '2026-05-02', frequencyType: 'hourly' }),
          ],
        }),
      ],
      [
        'last version bad targetType',
        makeValidHabitDoc({
          versions: [
            makeVersion(),
            makeVersion({ effectiveFrom: '2026-05-02', targetType: 'time' }),
          ],
        }),
      ],
      [
        'last version boolean with targetValue',
        makeValidHabitDoc({
          versions: [
            makeVersion(),
            makeVersion({
              effectiveFrom: '2026-05-02',
              targetType: 'boolean',
              targetValue: 5,
            }),
          ],
        }),
      ],
      [
        'last version numeric without targetValue',
        makeValidHabitDoc({
          versions: [
            makeVersion(),
            makeVersion({
              effectiveFrom: '2026-05-02',
              targetType: 'numeric',
              targetValue: null,
              targetUnit: 'mins',
            }),
          ],
        }),
      ],
      [
        'last version daily with weekdays',
        makeValidHabitDoc({
          versions: [
            makeVersion(),
            makeVersion({
              effectiveFrom: '2026-05-02',
              frequencyType: 'daily',
              scheduledWeekdays: ['tue'],
            }),
          ],
        }),
      ],
    ])('denies habit create when %s', async (_label, invalidDoc) => {
      const ownerDb = testEnv.authenticatedContext(OWNER_UID).firestore()
      await assertFails(
        setDoc(doc(ownerDb, `users/${OWNER_UID}/habits/h-bad`), invalidDoc),
      )
    })
  })

  describe('habits update & delete denials', () => {
    it('denies changing createdAt on habit update', async () => {
      const ownerDb = testEnv.authenticatedContext(OWNER_UID).firestore()
      const ref = doc(ownerDb, `users/${OWNER_UID}/habits/h-u1`)
      await assertSucceeds(setDoc(ref, makeValidHabitDoc()))

      await assertFails(
        updateDoc(ref, {
          createdAt: UPDATED_NOW,
          updatedAt: LATER_NOW,
        }),
      )
    })

    it('denies moving updatedAt backwards on habit update', async () => {
      const ownerDb = testEnv.authenticatedContext(OWNER_UID).firestore()
      const ref = doc(ownerDb, `users/${OWNER_UID}/habits/h-u2`)
      await assertSucceeds(setDoc(ref, makeValidHabitDoc()))

      await assertFails(
        updateDoc(ref, {
          updatedAt: '2026-04-30T08:00:00.000Z',
        }),
      )
    })

    it('denies shrinking versions on habit update', async () => {
      const ownerDb = testEnv.authenticatedContext(OWNER_UID).firestore()
      const ref = doc(ownerDb, `users/${OWNER_UID}/habits/h-u3`)
      const twoVersions = [
        makeVersion({ effectiveFrom: '2026-05-01' }),
        makeVersion({
          effectiveFrom: '2026-05-03',
          frequencyType: 'selected_weekdays',
          scheduledWeekdays: ['mon'],
        }),
      ]
      await assertSucceeds(
        setDoc(ref, makeValidHabitDoc({ versions: twoVersions })),
      )

      await assertFails(
        updateDoc(ref, {
          versions: [twoVersions[0]],
          updatedAt: UPDATED_NOW,
        }),
      )
    })

    it('denies replacing versions[0] when 2 or more versions exist', async () => {
      const ownerDb = testEnv.authenticatedContext(OWNER_UID).firestore()
      const ref = doc(ownerDb, `users/${OWNER_UID}/habits/h-u4`)
      const v0 = makeVersion({ effectiveFrom: '2026-05-01' })
      const v1 = makeVersion({
        effectiveFrom: '2026-05-03',
        frequencyType: 'selected_weekdays',
        scheduledWeekdays: ['mon'],
      })
      await assertSucceeds(
        setDoc(ref, makeValidHabitDoc({ versions: [v0, v1] })),
      )

      const alteredV0 = makeVersion({
        effectiveFrom: '2026-05-01',
        frequencyType: 'selected_weekdays',
        scheduledWeekdays: ['fri'],
      })
      await assertFails(
        updateDoc(ref, {
          versions: [alteredV0, v1],
          updatedAt: UPDATED_NOW,
        }),
      )
    })

    it('denies deleting a habit document for both owner and non-owner', async () => {
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(
          doc(ctx.firestore(), `users/${OWNER_UID}/habits/h-del`),
          makeValidHabitDoc(),
        )
      })

      const ownerDb = testEnv.authenticatedContext(OWNER_UID).firestore()
      const otherDb = testEnv.authenticatedContext(OTHER_UID).firestore()

      await assertFails(deleteDoc(doc(ownerDb, `users/${OWNER_UID}/habits/h-del`)))
      await assertFails(deleteDoc(doc(otherDb, `users/${OWNER_UID}/habits/h-del`)))
    })
  })

  describe('profile rules', () => {
    it('allows the owner to create and update users/{uid}/profile/main with unchanged createdAt', async () => {
      const ownerDb = testEnv.authenticatedContext(OWNER_UID).firestore()
      const ref = doc(ownerDb, `users/${OWNER_UID}/profile/main`)

      await assertSucceeds(setDoc(ref, makeValidProfileDoc()))
      await assertSucceeds(
        updateDoc(ref, {
          timeZone: 'UTC',
          updatedAt: UPDATED_NOW,
        }),
      )
    })

    it('denies profile writes under any doc id other than main', async () => {
      const ownerDb = testEnv.authenticatedContext(OWNER_UID).firestore()
      await assertFails(
        setDoc(
          doc(ownerDb, `users/${OWNER_UID}/profile/secondary`),
          makeValidProfileDoc(),
        ),
      )
    })

    it.each([
      ['extra key', makeValidProfileDoc({ email: 'user@example.com' })],
      ['missing key', omitKey(makeValidProfileDoc(), 'timeZone')],
      ['wrong schemaVersion', makeValidProfileDoc({ schemaVersion: 2 })],
      ['wrong timeZone type', makeValidProfileDoc({ timeZone: 123 })],
      ['empty timeZone', makeValidProfileDoc({ timeZone: '' })],
      ['timeZone over 64 chars', makeValidProfileDoc({ timeZone: 'z'.repeat(65) })],
      ['bad createdAt format', makeValidProfileDoc({ createdAt: 'not-iso' })],
    ])('denies profile create with %s', async (_label, invalidProfile) => {
      const ownerDb = testEnv.authenticatedContext(OWNER_UID).firestore()
      await assertFails(
        setDoc(doc(ownerDb, `users/${OWNER_UID}/profile/main`), invalidProfile),
      )
    })

    it('denies changing createdAt on profile update', async () => {
      const ownerDb = testEnv.authenticatedContext(OWNER_UID).firestore()
      const ref = doc(ownerDb, `users/${OWNER_UID}/profile/main`)
      await assertSucceeds(setDoc(ref, makeValidProfileDoc()))

      await assertFails(
        updateDoc(ref, {
          createdAt: UPDATED_NOW,
          updatedAt: LATER_NOW,
        }),
      )
    })

    it('denies moving updatedAt backwards on profile update', async () => {
      const ownerDb = testEnv.authenticatedContext(OWNER_UID).firestore()
      const ref = doc(ownerDb, `users/${OWNER_UID}/profile/main`)
      await assertSucceeds(
        setDoc(ref, makeValidProfileDoc({ updatedAt: UPDATED_NOW })),
      )

      await assertFails(
        updateDoc(ref, {
          timeZone: 'UTC',
          updatedAt: CREATED_NOW,
        }),
      )
    })

    it('denies deleting users/{uid}/profile/main even for the owner', async () => {
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(
          doc(ctx.firestore(), `users/${OWNER_UID}/profile/main`),
          makeValidProfileDoc(),
        )
      })

      const ownerDb = testEnv.authenticatedContext(OWNER_UID).firestore()
      await assertFails(deleteDoc(doc(ownerDb, `users/${OWNER_UID}/profile/main`)))
    })
  })
})
