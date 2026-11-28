import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { createHabit } from './habitOperations.js'
import {
  archiveHabitInList,
  createHabitInList,
  MAX_HABITS_PER_USER,
  updateHabitInList,
} from './habitStoreLogic.js'
import {
  createHabitsController,
  findHabitById,
  selectActiveHabits,
  selectArchivedHabits,
} from './habitsController.js'

const VALID_INPUT = {
  name: 'Morning Run',
  description: null,
  category: 'Fitness',
  icon: null,
  targetTimeLabel: '6:00 AM',
  startDate: '2026-05-01',
  endDate: null,
  frequencyType: 'daily',
  scheduledWeekdays: [],
  targetType: 'boolean',
  targetValue: null,
  targetUnit: null,
}

function createDeferred() {
  let resolve
  let reject
  const promise = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function createFakeTimers() {
  let nextId = 1
  const pending = new Map()

  return {
    timers: {
      setTimeout: vi.fn((fn, ms) => {
        const id = nextId++
        pending.set(id, { fn, ms })
        return id
      }),
      clearTimeout: vi.fn((id) => {
        pending.delete(id)
      }),
    },
    fireNext() {
      const first = pending.entries().next()
      if (first.done) {
        return false
      }
      const [id, entry] = first.value
      pending.delete(id)
      entry.fn()
      return true
    },
    fireAll() {
      for (const [id, entry] of [...pending.entries()]) {
        pending.delete(id)
        entry.fn()
      }
    },
    pendingCount: () => pending.size,
  }
}

function makeHabit(id, now = '2026-05-01T08:00:00.000Z', name = 'Read') {
  const res = createHabit(
    { ...VALID_INPUT, name },
    { id, now },
  )
  expect(res.ok).toBe(true)
  return res.habit
}

function createHarness({
  uid = 'secret-owner-uid-999',
  habits = [],
  invalid = [],
  now = '2026-05-05T10:00:00.000Z',
  todayKey = '2026-05-05',
  saveTimeoutMs = 15000,
  slowLoadMs = 10000,
} = {}) {
  let nextIdNum = 1
  const timerHarness = createFakeTimers()

  const service = {
    newHabitId: vi.fn(() => `new-habit-${nextIdNum++}`),
    loadHabits: vi.fn(async () => ({ habits, invalid })),
    saveHabit: vi.fn(async () => {}),
  }

  let currentNow = now
  const controller = createHabitsController({
    uid,
    service,
    getNow: () => currentNow,
    getTodayKey: () => todayKey,
    timers: timerHarness.timers,
    saveTimeoutMs,
    slowLoadMs,
  })

  return {
    controller,
    service,
    timerHarness,
    uid,
    setNow: (nextNow) => {
      currentNow = nextNow
    },
  }
}

async function startReadyHarness(options = {}) {
  const harness = createHarness(options)
  harness.controller.start()
  await vi.waitFor(() => {
    expect(harness.controller.getState().status).toBe('ready')
  })
  return harness
}

describe('createHabitsController', () => {
  it('validates uid like the service and refuses direct firebase imports', () => {
    const fakeService = {
      newHabitId: () => 'id',
      loadHabits: async () => ({ habits: [], invalid: [] }),
      saveHabit: async () => {},
    }
    expect(() =>
      createHabitsController({ uid: 'bad/uid', service: fakeService }),
    ).toThrowError(/Invalid uid/)
    expect(() =>
      createHabitsController({ uid: '   ', service: fakeService }),
    ).toThrowError(/Invalid uid/)

    const source = readFileSync(
      path.resolve(process.cwd(), 'src/features/habits/habitsController.js'),
      'utf8',
    )
    expect(source).not.toMatch(/from\s+['"]firebase\//)
  })

  it('starts in loading, transitions to ready with habits & invalid list, and keeps snapshot identity stable', async () => {
    const h1 = makeHabit('h-1', '2026-05-01T08:00:00.000Z', 'Habit 1')
    const deferred = createDeferred()
    const { controller, service } = createHarness()
    service.loadHabits.mockReturnValueOnce(deferred.promise)

    const initial = controller.getState()
    expect(initial.status).toBe('idle')
    expect(Object.isFrozen(initial)).toBe(true)
    expect(controller.getState()).toBe(initial)

    controller.start()
    const loadingState = controller.getState()
    expect(loadingState).not.toBe(initial)
    expect(loadingState.status).toBe('loading')
    expect(controller.getState()).toBe(loadingState)

    deferred.resolve({
      habits: [h1],
      invalid: [{ id: 'bad-1', reason: 'invalid-category', leaked: 'SECRET' }],
    })
    await Promise.resolve()
    await Promise.resolve()

    const readyState = controller.getState()
    expect(readyState).not.toBe(loadingState)
    expect(readyState.status).toBe('ready')
    expect(readyState.habits).toEqual([h1])
    expect(readyState.invalid).toEqual([
      { id: 'bad-1', reason: 'invalid-category' },
    ])
    expect(JSON.stringify(readyState.invalid)).not.toContain('SECRET')
    expect(controller.getState()).toBe(readyState)
    expect(selectActiveHabits(readyState)).toEqual([h1])
    expect(selectArchivedHabits(readyState)).toEqual([])
    expect(findHabitById(readyState, 'h-1')).toEqual(h1)
  })

  it('sets loadError without raw error text or uid when start fails, and retry works only from loadError', async () => {
    const { controller, service, uid } = createHarness()
    const rawDetail = `INTERNAL_LOAD_ERR_${uid}_XYZ`
    service.loadHabits.mockRejectedValueOnce({
      code: 'unavailable',
      message: rawDetail,
    })

    controller.start()
    await vi.waitFor(() => {
      expect(controller.getState().status).toBe('loadError')
    })

    const errState = controller.getState()
    expect(errState.loadError).toBe(
      "Couldn't load your habits right now. Check your connection and try again.",
    )
    expect(errState.loadError).not.toContain(rawDetail)
    expect(errState.loadError).not.toContain(uid)

    service.loadHabits.mockResolvedValueOnce({ habits: [], invalid: [] })
    controller.retry()
    await vi.waitFor(() => {
      expect(controller.getState().status).toBe('ready')
    })
    expect(service.loadHabits).toHaveBeenCalledTimes(2)

    // Calling retry when status is ready must not reload
    controller.retry()
    expect(service.loadHabits).toHaveBeenCalledTimes(2)
  })

  it('sets slowLoad true after slowLoadMs while loading and resets it to false when load ends', async () => {
    const deferred = createDeferred()
    const { controller, service, timerHarness } = createHarness({
      slowLoadMs: 10000,
    })
    service.loadHabits.mockReturnValueOnce(deferred.promise)

    controller.start()
    expect(controller.getState().slowLoad).toBe(false)
    expect(timerHarness.pendingCount()).toBe(1)

    timerHarness.fireNext()
    expect(controller.getState().slowLoad).toBe(true)

    deferred.resolve({ habits: [], invalid: [] })
    await Promise.resolve()
    await Promise.resolve()

    expect(controller.getState().status).toBe('ready')
    expect(controller.getState().slowLoad).toBe(false)
    expect(timerHarness.pendingCount()).toBe(0)
  })

  it('stop prevents late load results or timers from changing state, and restart after stop works cleanly', async () => {
    const deferred1 = createDeferred()
    const { controller, service, timerHarness } = createHarness()
    service.loadHabits.mockReturnValueOnce(deferred1.promise)

    controller.start()
    const loadingState = controller.getState()
    controller.stop()
    expect(timerHarness.pendingCount()).toBe(0)

    deferred1.resolve({ habits: [makeHabit('late-h')], invalid: [] })
    await Promise.resolve()
    await Promise.resolve()
    expect(controller.getState()).toBe(loadingState)

    const hFresh = makeHabit('fresh-h')
    service.loadHabits.mockResolvedValueOnce({ habits: [hFresh], invalid: [] })
    controller.start()
    await vi.waitFor(() => {
      expect(controller.getState().status).toBe('ready')
    })
    expect(controller.getState().habits).toEqual([hFresh])
  })

  it('supports createHabit, updateHabit, updateHabitDetails, updateHabitScheduleOrTarget, updateHabitDates, archiveHabit, and restoreHabit in order', async () => {
    const existingOther = makeHabit(
      'h-existing',
      '2026-04-01T08:00:00.000Z',
      'Existing',
    )
    const { controller, service } = await startReadyHarness({
      habits: [existingOther],
      todayKey: '2026-05-05',
      now: '2026-05-05T10:00:00.000Z',
    })

    const created = await controller.createHabit({
      ...VALID_INPUT,
      startDate: '2026-05-10',
      name: 'Study',
    })
    expect(created.ok).toBe(true)
    expect(created.habit.id).toBe('new-habit-1')
    expect(service.saveHabit).toHaveBeenLastCalledWith(
      'secret-owner-uid-999',
      created.habit,
    )
    expect(controller.getState().habits.map((h) => h.id)).toEqual([
      'h-existing',
      'new-habit-1',
    ])

    const dUpd = await controller.updateHabitDetails('new-habit-1', {
      name: 'Deep Study',
    })
    expect(dUpd.ok).toBe(true)
    expect(dUpd.habit.name).toBe('Deep Study')

    const sUpd = await controller.updateHabitScheduleOrTarget('new-habit-1', {
      frequencyType: 'selected_weekdays',
      scheduledWeekdays: ['mon', 'wed'],
    })
    expect(sUpd.ok).toBe(true)
    expect(sUpd.habit.versions[0].scheduledWeekdays).toEqual(['mon', 'wed'])

    const dtUpd = await controller.updateHabitDates('new-habit-1', {
      startDate: '2026-05-12',
    })
    expect(dtUpd.ok).toBe(true)
    expect(dtUpd.habit.startDate).toBe('2026-05-12')

    const comb = await controller.updateHabit('new-habit-1', {
      details: { name: 'Combined Study' },
      dates: { endDate: '2026-06-30' },
    })
    expect(comb.ok).toBe(true)
    expect(comb.habit.name).toBe('Combined Study')
    expect(comb.habit.endDate).toBe('2026-06-30')

    const arch = await controller.archiveHabit('new-habit-1')
    expect(arch.ok).toBe(true)
    expect(arch.habit.status).toBe('archived')
    expect(selectArchivedHabits(controller.getState())).toHaveLength(1)

    const rest = await controller.restoreHabit('new-habit-1')
    expect(rest.ok).toBe(true)
    expect(rest.habit.status).toBe('active')
    expect(controller.getState().habits.map((h) => h.id)).toEqual([
      'h-existing',
      'new-habit-1',
    ])
  })

  it('returns matching error shapes without calling service or locking on validation failure', async () => {
    const h1 = makeHabit('h-1')
    const { controller, service } = await startReadyHarness({ habits: [h1] })

    const asyncCreateErr = await controller.createHabit({
      ...VALID_INPUT,
      name: '',
    })
    const syncCreateErr = createHabitInList([h1], { ...VALID_INPUT, name: '' }, {
      id: 'x',
      now: '2026-05-05T10:00:00.000Z',
    })
    expect(Object.keys(asyncCreateErr)).toEqual(['ok', 'errors'])
    expect(asyncCreateErr.errors).toEqual(syncCreateErr.errors)
    expect(service.newHabitId).not.toHaveBeenCalled()
    expect(service.saveHabit).not.toHaveBeenCalled()
    expect(controller.getState().isSaving).toBe(false)

    const asyncUpdateErr = await controller.updateHabit('h-1', {
      details: { name: '' },
    })
    const syncUpdateErr = updateHabitInList(
      [h1],
      'h-1',
      { details: { name: '' } },
      { todayKey: '2026-05-05', now: '2026-05-05T10:00:00.000Z' },
    )
    expect(Object.keys(asyncUpdateErr)).toEqual(['ok', 'errors'])
    expect(asyncUpdateErr.errors).toEqual(syncUpdateErr.errors)

    const asyncArchErr = await controller.archiveHabit('missing')
    const syncArchErr = archiveHabitInList([h1], 'missing', {
      now: '2026-05-05T10:00:00.000Z',
    })
    expect(asyncArchErr.errors).toEqual(syncArchErr.errors)
  })

  it('refuses mutations while loading or loadError', async () => {
    const deferred = createDeferred()
    const { controller, service } = createHarness()
    service.loadHabits.mockReturnValueOnce(deferred.promise)

    controller.start()
    const duringLoading = await controller.createHabit(VALID_INPUT)
    expect(duringLoading).toEqual({
      ok: false,
      errors: { form: 'Reload the page to continue.' },
    })
    expect(service.saveHabit).not.toHaveBeenCalled()

    deferred.reject({ code: 'permission-denied' })
    await Promise.resolve()
    await Promise.resolve()
    expect(controller.getState().status).toBe('loadError')

    const duringLoadError = await controller.createHabit(VALID_INPUT)
    expect(duringLoadError).toEqual({
      ok: false,
      errors: { form: 'Reload the page to continue.' },
    })
  })

  it('enforces single-flight saves and unlocks after both success and definite failure', async () => {
    const h1 = makeHabit('h-1')
    const { controller, service } = await startReadyHarness({ habits: [h1] })

    const deferred1 = createDeferred()
    service.saveHabit.mockReturnValueOnce(deferred1.promise)

    const first = controller.createHabit({ ...VALID_INPUT, name: 'First' })
    expect(controller.getState().isSaving).toBe(true)

    const secondDuringFlight = await controller.updateHabitDetails('h-1', {
      name: 'Blocked',
    })
    expect(secondDuringFlight).toEqual({
      ok: false,
      errors: { form: 'Another save is in progress. Please wait a moment.' },
    })

    deferred1.resolve()
    expect((await first).ok).toBe(true)
    expect(controller.getState().isSaving).toBe(false)

    // Definite rejection unlocks and leaves state unchanged
    service.saveHabit.mockRejectedValueOnce({
      code: 'permission-denied',
      message: 'RAW_SECRET_UID_leak',
    })
    const failed = await controller.updateHabitDetails('h-1', {
      name: 'Should Not Commit',
    })
    expect(failed.ok).toBe(false)
    expect(failed.errors.form).toBe(
      "You don't have permission to save this change. Nothing was saved.",
    )
    expect(controller.getState().status).toBe('ready')
    expect(controller.getState().isSaving).toBe(false)
    expect(findHabitById(controller.getState(), 'h-1')?.name).toBe('Read')

    // Local pre-network error from service is definite -> ready + unlocked
    const localErr = new Error('Refusing bad doc')
    localErr.code = 'invalid-habit-document'
    service.saveHabit.mockRejectedValueOnce(localErr)
    const localFailed = await controller.updateHabitDetails('h-1', {
      name: 'Still Safe',
    })
    expect(localFailed.ok).toBe(false)
    expect(localFailed.errors.form).toBe(
      "Couldn't save your change. Nothing was saved — please try again.",
    )
    expect(controller.getState().status).toBe('ready')
    expect(controller.getState().isSaving).toBe(false)

    // Subsequent save works after definite rejection
    const nextOk = await controller.updateHabitDetails('h-1', {
      name: 'After Rejection',
    })
    expect(nextOk.ok).toBe(true)
    expect(findHabitById(controller.getState(), 'h-1')?.name).toBe(
      'After Rejection',
    )
  })

  it('transitions to unconfirmed on ambiguous failure and blocks subsequent mutations', async () => {
    const h1 = makeHabit('h-1')
    const { controller, service, uid } = await startReadyHarness({
      habits: [h1],
    })

    service.saveHabit.mockRejectedValueOnce({
      code: 'unavailable',
      message: `RAW_${uid}_UNAVAILABLE`,
    })

    const res = await controller.updateHabitDetails('h-1', { name: 'Pending' })
    expect(res).toEqual({
      ok: false,
      errors: {
        form: "Couldn't confirm the last save. Reload the page to see what was saved.",
      },
    })
    expect(controller.getState().status).toBe('unconfirmed')
    expect(controller.getState().unconfirmedMessage).toBe(res.errors.form)
    expect(controller.getState().isSaving).toBe(false)
    expect(findHabitById(controller.getState(), 'h-1')?.name).toBe('Read')
    expect(JSON.stringify(controller.getState())).not.toContain('RAW_')

    const blocked = await controller.archiveHabit('h-1')
    expect(blocked).toEqual({
      ok: false,
      errors: { form: 'Reload the page to continue.' },
    })
  })

  it('transitions to unconfirmed on save timeout and ignores late settlement', async () => {
    const h1 = makeHabit('h-1')
    const { controller, service, timerHarness } = await startReadyHarness({
      habits: [h1],
      saveTimeoutMs: 15000,
    })

    const slowDeferred = createDeferred()
    service.saveHabit.mockReturnValueOnce(slowDeferred.promise)

    const savePromise = controller.updateHabitDetails('h-1', {
      name: 'Timed Out',
    })
    expect(timerHarness.pendingCount()).toBe(1)
    timerHarness.fireNext()

    const outcome = await savePromise
    expect(outcome).toEqual({
      ok: false,
      errors: {
        form: "Couldn't confirm the last save. Reload the page to see what was saved.",
      },
    })
    const stateAtTimeout = controller.getState()
    expect(stateAtTimeout.status).toBe('unconfirmed')

    // Late resolution must not mutate state
    slowDeferred.resolve()
    await Promise.resolve()
    await Promise.resolve()
    expect(controller.getState()).toBe(stateAtTimeout)
    expect(findHabitById(controller.getState(), 'h-1')?.name).toBe('Read')
  })

  it('keeps state unchanged and still resolves in-flight save promise cleanly when stop() is called', async () => {
    const h1 = makeHabit('h-1')
    const { controller, service, timerHarness } = await startReadyHarness({
      habits: [h1],
    })

    const deferred = createDeferred()
    service.saveHabit.mockReturnValueOnce(deferred.promise)

    const savePromise = controller.updateHabitDetails('h-1', { name: 'MidStop' })
    const stateBeforeStop = controller.getState()
    controller.stop()
    expect(timerHarness.pendingCount()).toBe(0)

    const res = await savePromise
    expect(res).toEqual({
      ok: false,
      errors: {
        form: "Couldn't confirm the last save. Reload the page to see what was saved.",
      },
    })
    deferred.resolve()
    await Promise.resolve()
    expect(controller.getState()).toBe(stateBeforeStop)
  })

  it('handles clock skew so next updatedAt is never earlier than current habit updatedAt', async () => {
    const h1 = makeHabit('h-1', '2026-05-10T12:00:00.000Z', 'Clock Test')
    const { controller } = await startReadyHarness({
      habits: [h1],
      now: '2026-05-01T08:00:00.000Z',
    })

    const res = await controller.updateHabitDetails('h-1', {
      name: 'Clock Updated',
    })
    expect(res.ok).toBe(true)
    expect(res.habit.updatedAt).toBe('2026-05-10T12:00:00.000Z')
  })

  it('enforces the 100-habit cap including invalidCount before generating an id or calling saveHabit', async () => {
    const validHabits = Array.from(
      { length: MAX_HABITS_PER_USER - 2 },
      (_, i) => makeHabit(`h-${i}`, '2026-05-01T08:00:00.000Z', `H${i}`),
    )
    const { controller, service } = await startReadyHarness({
      habits: validHabits,
      invalid: [
        { id: 'bad-1', reason: 'invalid-category' },
        { id: 'bad-2', reason: 'invalid-name' },
      ],
    })

    const capped = await controller.createHabit(VALID_INPUT)
    expect(capped).toEqual({
      ok: false,
      errors: { form: "You've reached the limit of 100 habits." },
    })
    expect(service.newHabitId).not.toHaveBeenCalled()
    expect(service.saveHabit).not.toHaveBeenCalled()
  })
})
