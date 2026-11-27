// TEMPORARY IN-MEMORY HABITS STORE:
// Habits live in memory only during Phase 3 and Phase 4 (no localStorage or
// IndexedDB persistence). Real Firestore persistence arrives in Phase 5.

import { useCallback, useMemo, useRef, useState } from 'react'
import {
  archiveHabitInList,
  createHabitInList,
  findHabitById,
  generateHabitId,
  restoreHabitInList,
  selectActiveHabits,
  selectArchivedHabits,
  updateHabitDatesInList,
  updateHabitDetailsInList,
  updateHabitInList,
  updateHabitScheduleOrTargetInList,
} from '../features/habits/habitStoreLogic.js'
import { DEFAULT_TIME_ZONE, getLocalDateKey } from '../utils/date.js'
import { HabitsContext } from './habitsContext.js'

const defaultGenerateId = () => generateHabitId()
const defaultGetNow = () => new Date().toISOString()
const defaultGetTodayKey = () => getLocalDateKey(new Date(), DEFAULT_TIME_ZONE)

export function HabitsProvider({
  children,
  generateId = defaultGenerateId,
  getNow = defaultGetNow,
  getTodayKey = defaultGetTodayKey,
}) {
  const [habits, setHabits] = useState([])
  const habitsRef = useRef(habits)

  const runListAction = useCallback((computeTransition) => {
    const currentHabits = habitsRef.current
    const result = computeTransition(currentHabits)
    if (!result.ok) {
      return { ok: false, errors: result.errors }
    }
    if (result.habits !== currentHabits) {
      habitsRef.current = result.habits
      setHabits(result.habits)
    }
    return { ok: true, habit: result.habit }
  }, [])

  const createHabit = useCallback(
    (input) =>
      runListAction((list) =>
        createHabitInList(list, input, {
          id: generateId(),
          now: getNow(),
        }),
      ),
    [runListAction, generateId, getNow],
  )

  const updateHabitDetails = useCallback(
    (habitId, changes) =>
      runListAction((list) =>
        updateHabitDetailsInList(list, habitId, changes, { now: getNow() }),
      ),
    [runListAction, getNow],
  )

  const updateHabitScheduleOrTarget = useCallback(
    (habitId, changes) =>
      runListAction((list) =>
        updateHabitScheduleOrTargetInList(list, habitId, changes, {
          todayKey: getTodayKey(),
          now: getNow(),
        }),
      ),
    [runListAction, getTodayKey, getNow],
  )

  const updateHabitDates = useCallback(
    (habitId, changes) =>
      runListAction((list) =>
        updateHabitDatesInList(list, habitId, changes, {
          todayKey: getTodayKey(),
          now: getNow(),
        }),
      ),
    [runListAction, getTodayKey, getNow],
  )

  const updateHabit = useCallback(
    (habitId, changes) =>
      runListAction((list) =>
        updateHabitInList(list, habitId, changes, {
          todayKey: getTodayKey(),
          now: getNow(),
        }),
      ),
    [runListAction, getTodayKey, getNow],
  )

  const archiveHabit = useCallback(
    (habitId) =>
      runListAction((list) =>
        archiveHabitInList(list, habitId, { now: getNow() }),
      ),
    [runListAction, getNow],
  )

  const restoreHabit = useCallback(
    (habitId) =>
      runListAction((list) =>
        restoreHabitInList(list, habitId, { now: getNow() }),
      ),
    [runListAction, getNow],
  )

  const activeHabits = useMemo(() => selectActiveHabits(habits), [habits])
  const archivedHabits = useMemo(() => selectArchivedHabits(habits), [habits])
  const getHabitById = useCallback(
    (habitId) => findHabitById(habitsRef.current, habitId),
    [],
  )

  const value = useMemo(
    () => ({
      habits,
      activeHabits,
      archivedHabits,
      getHabitById,
      createHabit,
      updateHabitDetails,
      updateHabitScheduleOrTarget,
      updateHabitDates,
      updateHabit,
      archiveHabit,
      restoreHabit,
    }),
    [
      habits,
      activeHabits,
      archivedHabits,
      getHabitById,
      createHabit,
      updateHabitDetails,
      updateHabitScheduleOrTarget,
      updateHabitDates,
      updateHabit,
      archiveHabit,
      restoreHabit,
    ],
  )

  return (
    <HabitsContext.Provider value={value}>{children}</HabitsContext.Provider>
  )
}
