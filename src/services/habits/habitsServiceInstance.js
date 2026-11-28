import { collection, doc, getDocs, setDoc } from 'firebase/firestore'
import { getFirestoreDb } from '../firebase/firestoreDb.js'
import { createHabitsService } from './habitsService.js'

/**
 * Return a habits service bound to the live Firestore SDK instance.
 */
export function getHabitsService() {
  return createHabitsService({
    db: getFirestoreDb(),
    fns: { collection, doc, getDocs, setDoc },
  })
}
