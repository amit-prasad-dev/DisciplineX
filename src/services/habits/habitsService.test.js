import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { createHabit } from '../../features/habits/habitOperations.js'
import { habitToDocument } from './habitDocument.js'
import { createHabitsService } from './habitsService.js'

function makeHabit({ id, createdAt, name = 'Read' }) {
  const result = createHabit(
    {
      name,
      description: '',
      category: 'Learning',
      icon: null,
      targetTimeLabel: null,
      startDate: '2026-05-01',
      endDate: null,
      frequencyType: 'daily',
      scheduledWeekdays: [],
      targetType: 'boolean',
    },
    { id, now: createdAt },
  )
  expect(result.ok).toBe(true)
  return result.habit
}

function createFakeFirestoreHarness(snapshotDocs = []) {
  const fakeDb = { kind: 'fake-db' }
  const fns = {
    collection: vi.fn((db, ...segments) => ({
      db,
      path: segments.join('/'),
    })),
    doc: vi.fn((arg, ...segments) => {
      if (segments.length === 0) {
        return { id: 'generated-habit-id-1', collectionPath: arg.path }
      }
      return { db: arg, path: segments.join('/') }
    }),
    getDocs: vi.fn(async () => ({ docs: snapshotDocs })),
    setDoc: vi.fn(async () => {}),
  }

  const service = createHabitsService({ db: fakeDb, fns })
  return { fakeDb, fns, service }
}

describe('createHabitsService', () => {
  it('generates a habit id via doc(collection(db, "users", uid, "habits")) without network calls', () => {
    const { fakeDb, fns, service } = createFakeFirestoreHarness()
    const id = service.newHabitId('owner-1')

    expect(id).toBe('generated-habit-id-1')
    expect(fns.collection).toHaveBeenCalledWith(
      fakeDb,
      'users',
      'owner-1',
      'habits',
    )
    expect(fns.getDocs).not.toHaveBeenCalled()
    expect(fns.setDoc).not.toHaveBeenCalled()
  })

  it('loadHabits returns valid habits sorted by createdAt asc then id asc, isolating malformed docs without leaking content', async () => {
    const habitLater = makeHabit({
      id: 'h-later',
      createdAt: '2026-05-02T08:00:00.000Z',
    })
    const habitTieB = makeHabit({
      id: 'h-b',
      createdAt: '2026-05-01T08:00:00.000Z',
    })
    const habitTieA = makeHabit({
      id: 'h-a',
      createdAt: '2026-05-01T08:00:00.000Z',
    })

    const docs = [
      { id: habitLater.id, data: () => habitToDocument(habitLater) },
      {
        id: 'h-corrupt',
        data: () => ({
          ...habitToDocument(habitTieA),
          name: 'SECRET_CORRUPT_CONTENT',
          category: 'InvalidCat',
        }),
      },
      { id: habitTieB.id, data: () => habitToDocument(habitTieB) },
      { id: habitTieA.id, data: () => habitToDocument(habitTieA) },
    ]

    const { fakeDb, fns, service } = createFakeFirestoreHarness(docs)
    const loaded = await service.loadHabits('owner-1')

    expect(fns.collection).toHaveBeenCalledWith(
      fakeDb,
      'users',
      'owner-1',
      'habits',
    )
    expect(loaded.habits.map((h) => h.id)).toEqual(['h-a', 'h-b', 'h-later'])
    expect(loaded.invalid).toEqual([
      { id: 'h-corrupt', reason: 'invalid-category' },
    ])
    expect(JSON.stringify(loaded.invalid)).not.toContain('SECRET_CORRUPT_CONTENT')
  })

  it('saveHabit calls setDoc on users/{uid}/habits/{habitId} with mapped doc and NO merge option', async () => {
    const habit = makeHabit({
      id: 'h-save-1',
      createdAt: '2026-05-01T08:00:00.000Z',
    })
    const { fakeDb, fns, service } = createFakeFirestoreHarness()

    await service.saveHabit('owner-1', habit)

    expect(fns.doc).toHaveBeenCalledWith(
      fakeDb,
      'users',
      'owner-1',
      'habits',
      'h-save-1',
    )
    expect(fns.setDoc).toHaveBeenCalledTimes(1)
    expect(fns.setDoc.mock.calls[0]).toHaveLength(2)
    expect(fns.setDoc.mock.calls[0][0]).toEqual({
      db: fakeDb,
      path: 'users/owner-1/habits/h-save-1',
    })
    expect(fns.setDoc.mock.calls[0][1]).toEqual(habitToDocument(habit))
  })

  it('saveHabit validates the mapped document before calling setDoc and throws on programmer errors with code "invalid-habit-document"', async () => {
    const badHabit = {
      ...makeHabit({
        id: 'h-bad',
        createdAt: '2026-05-01T08:00:00.000Z',
      }),
      description: '',
    }
    const { fns, service } = createFakeFirestoreHarness()

    let caught = null
    try {
      await service.saveHabit('owner-1', badHabit)
    } catch (error) {
      caught = error
    }
    expect(caught).toBeInstanceOf(Error)
    expect(caught.code).toBe('invalid-habit-document')
    expect(caught.message).toMatch(/invalid-description/)
    expect(fns.setDoc).not.toHaveBeenCalled()
  })

  it('propagates Firestore errors from loadHabits and saveHabit instead of swallowing them', async () => {
    const { fns, service } = createFakeFirestoreHarness()
    fns.getDocs.mockRejectedValueOnce({ code: 'unavailable' })
    await expect(service.loadHabits('owner-1')).rejects.toEqual({
      code: 'unavailable',
    })

    const habit = makeHabit({
      id: 'h-1',
      createdAt: '2026-05-01T08:00:00.000Z',
    })
    fns.setDoc.mockRejectedValueOnce({ code: 'permission-denied' })
    await expect(service.saveHabit('owner-1', habit)).rejects.toEqual({
      code: 'permission-denied',
    })
  })

  it.each(['', '   ', 'uid/slash', 'uid space', null, undefined])(
    'rejects invalid uid (%s) with code "invalid-argument-local" across all service methods',
    async (badUid) => {
      const { service } = createFakeFirestoreHarness()
      const habit = makeHabit({
        id: 'h-1',
        createdAt: '2026-05-01T08:00:00.000Z',
      })

      try {
        service.newHabitId(badUid)
        expect.unreachable()
      } catch (error) {
        expect(error.code).toBe('invalid-argument-local')
        expect(error.message).toMatch(/Invalid uid/)
      }

      await expect(service.loadHabits(badUid)).rejects.toMatchObject({
        code: 'invalid-argument-local',
      })
      await expect(service.saveHabit(badUid, habit)).rejects.toMatchObject({
        code: 'invalid-argument-local',
      })
    },
  )

  it.each(['', '   ', 'id/slash', 'id space', null, undefined])(
    'rejects invalid habit id (%s) with code "invalid-argument-local" in saveHabit',
    async (badId) => {
      const { service } = createFakeFirestoreHarness()
      const habit = makeHabit({
        id: 'valid-1',
        createdAt: '2026-05-01T08:00:00.000Z',
      })

      await expect(
        service.saveHabit('owner-1', { ...habit, id: badId }),
      ).rejects.toMatchObject({
        code: 'invalid-argument-local',
      })
    },
  )

  it('exposes no delete method and neither habitsService.js nor habitsServiceInstance.js references deleteDoc or Firebase imports in habitsService.js', () => {
    const { service } = createFakeFirestoreHarness()
    const keys = Object.keys(service)
    expect(keys.some((k) => k.toLowerCase().includes('delete'))).toBe(false)
    expect(keys.sort()).toEqual(['loadHabits', 'newHabitId', 'saveHabit'])

    const serviceSource = readFileSync(
      path.resolve(process.cwd(), 'src/services/habits/habitsService.js'),
      'utf8',
    )
    const instanceSource = readFileSync(
      path.resolve(
        process.cwd(),
        'src/services/habits/habitsServiceInstance.js',
      ),
      'utf8',
    )

    expect(serviceSource).not.toMatch(/firebase/)
    expect(serviceSource).not.toMatch(/deleteDoc/)
    expect(instanceSource).not.toMatch(/deleteDoc/)
  })
})
