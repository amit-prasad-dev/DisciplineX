import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import {
  createHabitsController,
  findHabitById,
  selectActiveHabits,
  selectArchivedHabits,
} from '../features/habits/habitsController.js'
import { getHabitsService } from '../services/habits/habitsServiceInstance.js'
import { HabitsContext } from './habitsContext.js'

/**
 * Thin React provider binding the async Firestore habits controller to context.
 */
export function HabitsProvider({ uid, children }) {
  const [controller] = useState(() =>
    createHabitsController({ uid, service: getHabitsService() }),
  )
  const snapshot = useSyncExternalStore(
    controller.subscribe,
    controller.getState,
  )

  useEffect(() => {
    controller.start()
    return () => controller.stop()
  }, [controller])

  const activeHabits = useMemo(() => selectActiveHabits(snapshot), [snapshot])
  const archivedHabits = useMemo(
    () => selectArchivedHabits(snapshot),
    [snapshot],
  )
  const getHabitById = useCallback(
    (habitId) =>
      snapshot.status === 'ready' ? findHabitById(snapshot, habitId) : null,
    [snapshot],
  )

  const value = useMemo(
    () => ({
      status: snapshot.status,
      habits: snapshot.habits,
      activeHabits,
      archivedHabits,
      invalid: snapshot.invalid,
      loadError: snapshot.loadError,
      slowLoad: snapshot.slowLoad,
      isSaving: snapshot.isSaving,
      unconfirmedMessage: snapshot.unconfirmedMessage,
      getHabitById,
      retry: controller.retry,
      createHabit: controller.createHabit,
      updateHabit: controller.updateHabit,
      updateHabitDetails: controller.updateHabitDetails,
      updateHabitScheduleOrTarget: controller.updateHabitScheduleOrTarget,
      updateHabitDates: controller.updateHabitDates,
      archiveHabit: controller.archiveHabit,
      restoreHabit: controller.restoreHabit,
    }),
    [snapshot, activeHabits, archivedHabits, getHabitById, controller],
  )

  return (
    <HabitsContext.Provider value={value}>{children}</HabitsContext.Provider>
  )
}
