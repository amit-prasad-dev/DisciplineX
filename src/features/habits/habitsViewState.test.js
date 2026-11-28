import { describe, expect, it, vi } from 'vitest'
import { createHabitsController, selectActiveHabits } from './habitsController.js'
import { getHabitsViewState, getInvalidHabitsNotice } from './habitsViewState.js'

describe('getHabitsViewState', () => {
  it.each([
    [{ status: 'idle' }, 'loading'],
    [{ status: 'loading' }, 'loading'],
    [{ status: 'loadError' }, 'loadError'],
    [{ status: 'unconfirmed' }, 'unconfirmed'],
    [{ status: 'ready' }, 'ready'],
    [null, 'loading'],
    [undefined, 'loading'],
    [{ status: 'unexpected' }, 'loading'],
  ])('maps snapshot %o to "%s"', (snapshot, expected) => {
    expect(getHabitsViewState(snapshot)).toBe(expected)
  })
})

describe('getInvalidHabitsNotice', () => {
  it('returns null when invalid list is empty or missing', () => {
    expect(getInvalidHabitsNotice([])).toBeNull()
    expect(getInvalidHabitsNotice(null)).toBeNull()
    expect(getInvalidHabitsNotice(undefined)).toBeNull()
  })

  it('uses singular wording for 1 invalid habit and lists only document ids', () => {
    const notice = getInvalidHabitsNotice([
      { id: 'doc-1', reason: 'invalid-name', leaked: 'SECRET' },
    ])
    expect(notice).toEqual({
      summary: "1 saved habit couldn't be read and is hidden.",
      idsLine: 'Document IDs: doc-1',
    })
    expect(notice.summary).not.toContain('SECRET')
    expect(notice.idsLine).not.toContain('SECRET')
  })

  it('uses plural wording for multiple invalid habits and lists all document ids', () => {
    const notice = getInvalidHabitsNotice([
      { id: 'doc-a', reason: 'invalid-category' },
      { id: 'doc-b', reason: 'invalid-dates' },
    ])
    expect(notice).toEqual({
      summary: "2 saved habits couldn't be read and are hidden.",
      idsLine: 'Document IDs: doc-a, doc-b',
    })
  })
})

describe('createHabitsController integration with view helpers', () => {
  it('places a newly created habit into snapshot activeHabits immediately upon resolution', async () => {
    const service = {
      newHabitId: vi.fn(() => 'created-id-1'),
      loadHabits: vi.fn(async () => ({ habits: [], invalid: [] })),
      saveHabit: vi.fn(async () => {}),
    }
    const controller = createHabitsController({
      uid: 'owner-1',
      service,
      getNow: () => '2026-05-05T10:00:00.000Z',
      getTodayKey: () => '2026-05-05',
    })

    controller.start()
    await vi.waitFor(() => {
      expect(getHabitsViewState(controller.getState())).toBe('ready')
    })

    const result = await controller.createHabit({
      name: 'Evening Journal',
      description: null,
      category: 'Personal',
      icon: null,
      targetTimeLabel: null,
      startDate: '2026-05-05',
      endDate: null,
      frequencyType: 'daily',
      scheduledWeekdays: [],
      targetType: 'boolean',
      targetValue: null,
      targetUnit: null,
    })

    expect(result.ok).toBe(true)
    const snapshot = controller.getState()
    expect(getHabitsViewState(snapshot)).toBe('ready')
    expect(selectActiveHabits(snapshot).map((h) => h.id)).toEqual([
      'created-id-1',
    ])
  })
})
