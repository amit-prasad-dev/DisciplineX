import {
  isAmbiguousFirestoreError,
  mapFirestoreError,
  SAVE_TIMEOUT_ERROR_CODE,
} from '../../services/firebase/firestoreErrors.js'
import { DEFAULT_TIME_ZONE, getLocalDateKey } from '../../utils/date.js'
import {
  archiveHabitInList,
  createHabitInList,
  findHabitById as findHabitInList,
  restoreHabitInList,
  selectActiveHabits as selectActiveHabitsInList,
  selectArchivedHabits as selectArchivedHabitsInList,
  updateHabitDatesInList,
  updateHabitDetailsInList,
  updateHabitInList,
  updateHabitScheduleOrTargetInList,
} from './habitStoreLogic.js'

const EMPTY_LIST = Object.freeze([])

const UNCONFIRMED_SAVE_MESSAGE =
  "Couldn't confirm the last save. Reload the page to see what was saved."
const NOT_READY_MESSAGE = 'Reload the page to continue.'
const SAVE_IN_FLIGHT_MESSAGE =
  'Another save is in progress. Please wait a moment.'

// Wrap global timers so calling them off this object never throws "Illegal invocation" in browsers.
const defaultTimers = Object.freeze({
  setTimeout: (fn, ms) => globalThis.setTimeout(fn, ms),
  clearTimeout: (id) => globalThis.clearTimeout(id),
})

const defaultGetNow = () => new Date().toISOString()
const defaultGetTodayKey = () => getLocalDateKey(new Date(), DEFAULT_TIME_ZONE)

function assertValidUid(uid) {
  if (
    typeof uid !== 'string' ||
    uid.length === 0 ||
    uid.includes('/') ||
    /\s/.test(uid)
  ) {
    const error = new Error(
      'Invalid uid: expected a non-empty string without spaces or "/".',
    )
    error.code = 'invalid-argument-local'
    throw error
  }
}

function buildSnapshot(fields) {
  return Object.freeze({
    status: fields.status,
    habits: fields.habits,
    invalid: fields.invalid,
    loadError: fields.loadError,
    slowLoad: fields.slowLoad,
    isSaving: fields.isSaving,
    unconfirmedMessage: fields.unconfirmedMessage,
  })
}

export function selectActiveHabits(state) {
  if (!state || !Array.isArray(state.habits)) {
    return []
  }
  return selectActiveHabitsInList(state.habits)
}

export function selectArchivedHabits(state) {
  if (!state || !Array.isArray(state.habits)) {
    return []
  }
  return selectArchivedHabitsInList(state.habits)
}

export function findHabitById(state, habitId) {
  if (!state || !Array.isArray(state.habits)) {
    return null
  }
  return findHabitInList(state.habits, habitId)
}

/**
 * Create a framework-free controller for async Firestore habit loading and saving
 * with immutable snapshots suitable for React's useSyncExternalStore.
 */
export function createHabitsController({
  uid,
  service,
  getNow = defaultGetNow,
  getTodayKey = defaultGetTodayKey,
  timers = defaultTimers,
  saveTimeoutMs = 15000,
  slowLoadMs = 10000,
} = {}) {
  assertValidUid(uid)

  if (
    !service ||
    typeof service.newHabitId !== 'function' ||
    typeof service.loadHabits !== 'function' ||
    typeof service.saveHabit !== 'function'
  ) {
    throw new Error(
      'createHabitsController requires a service with newHabitId, loadHabits, and saveHabit.',
    )
  }

  let state = buildSnapshot({
    status: 'idle',
    habits: EMPTY_LIST,
    invalid: EMPTY_LIST,
    loadError: null,
    slowLoad: false,
    isSaving: false,
    unconfirmedMessage: null,
  })

  const listeners = new Set()
  const pendingStopHandlers = new Set()

  let active = false
  let disposed = false
  let sessionId = 0
  let loadGeneration = 0
  let saveGeneration = 0
  let inFlightSave = false
  let slowLoadTimerId = null
  let activeSaveTimerId = null

  function notify() {
    for (const listener of [...listeners]) {
      listener()
    }
  }

  function updateState(patch) {
    const nextFields = {
      status: 'status' in patch ? patch.status : state.status,
      habits: 'habits' in patch ? patch.habits : state.habits,
      invalid: 'invalid' in patch ? patch.invalid : state.invalid,
      loadError: 'loadError' in patch ? patch.loadError : state.loadError,
      slowLoad: 'slowLoad' in patch ? patch.slowLoad : state.slowLoad,
      isSaving: 'isSaving' in patch ? patch.isSaving : state.isSaving,
      unconfirmedMessage:
        'unconfirmedMessage' in patch
          ? patch.unconfirmedMessage
          : state.unconfirmedMessage,
    }

    const unchanged =
      nextFields.status === state.status &&
      nextFields.habits === state.habits &&
      nextFields.invalid === state.invalid &&
      nextFields.loadError === state.loadError &&
      nextFields.slowLoad === state.slowLoad &&
      nextFields.isSaving === state.isSaving &&
      nextFields.unconfirmedMessage === state.unconfirmedMessage

    if (unchanged) {
      return
    }

    state = buildSnapshot(nextFields)
    notify()
  }

  function clearSlowLoadTimer() {
    if (slowLoadTimerId !== null) {
      timers.clearTimeout(slowLoadTimerId)
      slowLoadTimerId = null
    }
  }

  function clearSaveTimer() {
    if (activeSaveTimerId !== null) {
      timers.clearTimeout(activeSaveTimerId)
      activeSaveTimerId = null
    }
  }

  async function beginLoad() {
    loadGeneration += 1
    const currentSession = sessionId
    const currentLoadId = loadGeneration

    clearSlowLoadTimer()
    updateState({
      status: 'loading',
      habits: EMPTY_LIST,
      invalid: EMPTY_LIST,
      loadError: null,
      slowLoad: false,
      isSaving: false,
      unconfirmedMessage: null,
    })

    slowLoadTimerId = timers.setTimeout(() => {
      slowLoadTimerId = null
      if (
        disposed ||
        !active ||
        currentSession !== sessionId ||
        currentLoadId !== loadGeneration
      ) {
        return
      }
      if (state.status === 'loading') {
        updateState({ slowLoad: true })
      }
    }, slowLoadMs)

    try {
      const result = await service.loadHabits(uid)
      if (
        disposed ||
        !active ||
        currentSession !== sessionId ||
        currentLoadId !== loadGeneration
      ) {
        return
      }
      clearSlowLoadTimer()
      const habits = Array.isArray(result?.habits)
        ? Object.freeze([...result.habits])
        : EMPTY_LIST
      const invalid = Array.isArray(result?.invalid)
        ? Object.freeze(
            result.invalid.map((item) =>
              Object.freeze({ id: item.id, reason: item.reason }),
            ),
          )
        : EMPTY_LIST

      updateState({
        status: 'ready',
        habits,
        invalid,
        loadError: null,
        slowLoad: false,
      })
    } catch (error) {
      if (
        disposed ||
        !active ||
        currentSession !== sessionId ||
        currentLoadId !== loadGeneration
      ) {
        return
      }
      clearSlowLoadTimer()
      updateState({
        status: 'loadError',
        habits: EMPTY_LIST,
        invalid: EMPTY_LIST,
        loadError: mapFirestoreError(error, { action: 'load' }).message,
        slowLoad: false,
      })
    }
  }

  function start() {
    if (active) {
      return
    }

    disposed = false
    active = true
    sessionId += 1
    inFlightSave = false
    beginLoad()
  }

  function retry() {
    if (disposed || !active || state.status !== 'loadError') {
      return
    }
    beginLoad()
  }

  function stop() {
    disposed = true
    active = false
    sessionId += 1
    loadGeneration += 1
    saveGeneration += 1
    inFlightSave = false

    clearSlowLoadTimer()
    clearSaveTimer()

    for (const resolveStop of [...pendingStopHandlers]) {
      resolveStop()
    }
    pendingStopHandlers.clear()
  }

  function getState() {
    return state
  }

  function subscribe(listener) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }

  function computeMonotonicNow(habitId) {
    const rawNow = getNow()
    if (!habitId) {
      return rawNow
    }
    const existing = findHabitInList(state.habits, habitId)
    if (!existing || typeof existing.updatedAt !== 'string') {
      return rawNow
    }
    return rawNow < existing.updatedAt ? existing.updatedAt : rawNow
  }

  async function runMutation({ habitId = null, isCreate = false, compute }) {
    if (disposed) {
      return { ok: false, errors: { form: UNCONFIRMED_SAVE_MESSAGE } }
    }

    if (state.status !== 'ready') {
      return { ok: false, errors: { form: NOT_READY_MESSAGE } }
    }

    if (inFlightSave) {
      return { ok: false, errors: { form: SAVE_IN_FLIGHT_MESSAGE } }
    }

    const currentHabits = state.habits
    const invalidCount = state.invalid.length
    const todayKey = getTodayKey()
    const now = computeMonotonicNow(habitId)

    let transition = compute(currentHabits, {
      id: isCreate ? '__validation__' : habitId,
      todayKey,
      now,
      invalidCount,
    })

    if (!transition.ok) {
      return { ok: false, errors: transition.errors }
    }

    if (transition.habits === currentHabits) {
      return { ok: true, habit: transition.habit }
    }

    if (isCreate) {
      const nextId = service.newHabitId(uid)
      transition = compute(currentHabits, {
        id: nextId,
        todayKey,
        now,
        invalidCount,
      })
      if (!transition.ok) {
        return { ok: false, errors: transition.errors }
      }
    }

    inFlightSave = true
    saveGeneration += 1
    const currentSession = sessionId
    const currentSaveId = saveGeneration

    updateState({ isSaving: true })

    let stopHandler = null
    const stopPromise = new Promise((resolve) => {
      stopHandler = () => resolve({ kind: 'stopped' })
      pendingStopHandlers.add(stopHandler)
    })

    const timeoutPromise = new Promise((resolve) => {
      activeSaveTimerId = timers.setTimeout(() => {
        activeSaveTimerId = null
        resolve({
          kind: 'timeout',
          error: { code: SAVE_TIMEOUT_ERROR_CODE },
        })
      }, saveTimeoutMs)
    })

    const savePromise = Promise.resolve()
      .then(() => service.saveHabit(uid, transition.habit))
      .then(
        () => ({ kind: 'ok' }),
        (error) => ({ kind: 'error', error }),
      )

    const outcome = await Promise.race([savePromise, timeoutPromise, stopPromise])

    clearSaveTimer()
    if (stopHandler) {
      pendingStopHandlers.delete(stopHandler)
    }

    if (
      disposed ||
      !active ||
      currentSession !== sessionId ||
      currentSaveId !== saveGeneration ||
      outcome.kind === 'stopped'
    ) {
      return { ok: false, errors: { form: UNCONFIRMED_SAVE_MESSAGE } }
    }

    inFlightSave = false

    if (outcome.kind === 'ok') {
      updateState({
        habits: Object.freeze([...transition.habits]),
        isSaving: false,
      })
      return { ok: true, habit: transition.habit }
    }

    if (outcome.kind === 'timeout' || isAmbiguousFirestoreError(outcome.error)) {
      updateState({
        status: 'unconfirmed',
        isSaving: false,
        unconfirmedMessage: UNCONFIRMED_SAVE_MESSAGE,
      })
      return {
        ok: false,
        errors: { form: UNCONFIRMED_SAVE_MESSAGE },
      }
    }

    updateState({ isSaving: false })
    return {
      ok: false,
      errors: {
        form: mapFirestoreError(outcome.error, { action: 'save' }).message,
      },
    }
  }

  function createHabit(input) {
    return runMutation({
      isCreate: true,
      compute: (habits, { id, now, invalidCount }) =>
        createHabitInList(habits, input, { id, now, invalidCount }),
    })
  }

  function updateHabit(habitId, changes) {
    return runMutation({
      habitId,
      compute: (habits, { todayKey, now }) =>
        updateHabitInList(habits, habitId, changes, { todayKey, now }),
    })
  }

  function updateHabitDetails(habitId, changes) {
    return runMutation({
      habitId,
      compute: (habits, { now }) =>
        updateHabitDetailsInList(habits, habitId, changes, { now }),
    })
  }

  function updateHabitScheduleOrTarget(habitId, changes) {
    return runMutation({
      habitId,
      compute: (habits, { todayKey, now }) =>
        updateHabitScheduleOrTargetInList(habits, habitId, changes, {
          todayKey,
          now,
        }),
    })
  }

  function updateHabitDates(habitId, changes) {
    return runMutation({
      habitId,
      compute: (habits, { todayKey, now }) =>
        updateHabitDatesInList(habits, habitId, changes, { todayKey, now }),
    })
  }

  function archiveHabit(habitId) {
    return runMutation({
      habitId,
      compute: (habits, { now }) => archiveHabitInList(habits, habitId, { now }),
    })
  }

  function restoreHabit(habitId) {
    return runMutation({
      habitId,
      compute: (habits, { now }) => restoreHabitInList(habits, habitId, { now }),
    })
  }

  return {
    start,
    retry,
    stop,
    getState,
    subscribe,
    createHabit,
    updateHabit,
    updateHabitDetails,
    updateHabitScheduleOrTarget,
    updateHabitDates,
    archiveHabit,
    restoreHabit,
  }
}
