import { validateStoredHabitDocument } from '../../features/habits/habitValidation.js'
import { documentToHabit, habitToDocument } from './habitDocument.js'

function createServiceError(code, message) {
  const error = new Error(message)
  error.code = code
  return error
}

function assertSafePathSegment(value, label) {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.includes('/') ||
    /\s/.test(value)
  ) {
    throw createServiceError(
      'invalid-argument-local',
      `Invalid ${label}: expected a non-empty string without spaces or "/".`,
    )
  }
}

function compareHabits(a, b) {
  if (a.createdAt < b.createdAt) {
    return -1
  }
  if (a.createdAt > b.createdAt) {
    return 1
  }
  if (a.id < b.id) {
    return -1
  }
  if (a.id > b.id) {
    return 1
  }
  return 0
}

/**
 * Create a habits Firestore service from injected Firestore db and SDK functions.
 * Contains no direct Firebase SDK imports so it is testable without an emulator.
 */
export function createHabitsService({ db, fns }) {
  if (!db) {
    throw new Error('createHabitsService requires a Firestore db instance.')
  }
  if (
    !fns ||
    typeof fns.collection !== 'function' ||
    typeof fns.doc !== 'function' ||
    typeof fns.getDocs !== 'function' ||
    typeof fns.setDoc !== 'function'
  ) {
    throw new Error(
      'createHabitsService requires collection, doc, getDocs, and setDoc.',
    )
  }

  function newHabitId(uid) {
    assertSafePathSegment(uid, 'uid')
    return fns.doc(fns.collection(db, 'users', uid, 'habits')).id
  }

  async function loadHabits(uid) {
    assertSafePathSegment(uid, 'uid')
    const snapshot = await fns.getDocs(fns.collection(db, 'users', uid, 'habits'))

    const habits = []
    const invalid = []

    for (const docSnap of snapshot.docs) {
      const result = documentToHabit(docSnap.id, docSnap.data())
      if (result.ok) {
        habits.push(result.habit)
      } else {
        invalid.push({ id: docSnap.id, reason: result.reason })
      }
    }

    habits.sort(compareHabits)
    return { habits, invalid }
  }

  async function saveHabit(uid, habit) {
    assertSafePathSegment(uid, 'uid')
    assertSafePathSegment(habit?.id, 'habit.id')

    const payload = habitToDocument(habit)
    const validation = validateStoredHabitDocument(habit.id, payload)
    if (!validation.ok) {
      throw createServiceError(
        'invalid-habit-document',
        `Refusing to save invalid habit document (${validation.reason}).`,
      )
    }

    const ref = fns.doc(db, 'users', uid, 'habits', habit.id)
    await fns.setDoc(ref, payload)
  }

  return {
    newHabitId,
    loadHabits,
    saveHabit,
  }
}
