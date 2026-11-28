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
import { afterAll, afterEach, beforeAll, describe } from 'vitest'
import { it } from 'vitest'
import { parseOwnerUidFromRules } from '../../scripts/rulesConfig.js'

const RULES_PATH = path.resolve(process.cwd(), 'firestore.rules')
const RULES_TEXT = readFileSync(RULES_PATH, 'utf8')
const OWNER_UID = parseOwnerUidFromRules(RULES_TEXT)
const OTHER_UID = 'fake-non-owner-uid-12345'
const PROJECT_ID = 'demo-disciplinex'

const OWNER_COLLECTIONS = ['profile', 'habits', 'dailyLogs', 'challenges']

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

describe('firestore.rules access control', () => {
  it('allows the owner to create, read, query, update, and delete in all 4 own collections', async () => {
    const ownerDb = testEnv.authenticatedContext(OWNER_UID).firestore()

    for (const colName of OWNER_COLLECTIONS) {
      const docRef = doc(ownerDb, `users/${OWNER_UID}/${colName}/sample-1`)
      const colRef = collection(ownerDb, `users/${OWNER_UID}/${colName}`)

      await assertSucceeds(setDoc(docRef, { label: `fake-${colName}` }))
      await assertSucceeds(getDoc(docRef))
      await assertSucceeds(getDocs(colRef))
      await assertSucceeds(updateDoc(docRef, { label: `updated-${colName}` }))
      await assertSucceeds(deleteDoc(docRef))
    }
  })

  it('denies unauthenticated reads, writes, and collection queries', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const adminDb = ctx.firestore()
      for (const colName of OWNER_COLLECTIONS) {
        await setDoc(doc(adminDb, `users/${OWNER_UID}/${colName}/seeded-1`), {
          label: 'seeded',
        })
      }
    })

    const unauthDb = testEnv.unauthenticatedContext().firestore()

    for (const colName of OWNER_COLLECTIONS) {
      const docRef = doc(unauthDb, `users/${OWNER_UID}/${colName}/seeded-1`)
      const colRef = collection(unauthDb, `users/${OWNER_UID}/${colName}`)

      await assertFails(getDoc(docRef))
      await assertFails(getDocs(colRef))
      await assertFails(setDoc(docRef, { label: 'blocked' }))
    }
  })

  it('denies a signed-in non-owner on their own path (uid == path uid) and on the owner path', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const adminDb = ctx.firestore()
      await setDoc(doc(adminDb, `users/${OWNER_UID}/habits/h1`), {
        name: 'Read',
      })
      await setDoc(doc(adminDb, `users/${OTHER_UID}/habits/h1`), {
        name: 'Other',
      })
    })

    const otherDb = testEnv.authenticatedContext(OTHER_UID).firestore()

    // Non-owner accessing their own path (request.auth.uid == path uid, fails owner allowlist)
    await assertFails(getDoc(doc(otherDb, `users/${OTHER_UID}/habits/h1`)))
    await assertFails(
      getDocs(collection(otherDb, `users/${OTHER_UID}/habits`)),
    )
    await assertFails(
      setDoc(doc(otherDb, `users/${OTHER_UID}/habits/h2`), { name: 'Blocked' }),
    )

    // Non-owner accessing owner path
    for (const colName of OWNER_COLLECTIONS) {
      await assertFails(
        getDoc(doc(otherDb, `users/${OWNER_UID}/${colName}/h1`)),
      )
      await assertFails(
        getDocs(collection(otherDb, `users/${OWNER_UID}/${colName}`)),
      )
      await assertFails(
        setDoc(doc(otherDb, `users/${OWNER_UID}/${colName}/new-1`), {
          label: 'blocked',
        }),
      )
    }
  })

  it('denies the owner on another user path, unlisted subcollections, nested subcollections, root collections, and top-level user doc', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const adminDb = ctx.firestore()
      await setDoc(doc(adminDb, `users/${OTHER_UID}/habits/h1`), {
        name: 'Other',
      })
      await setDoc(doc(adminDb, `users/${OWNER_UID}/journals/j1`), {
        entry: 'Future',
      })
      await setDoc(
        doc(adminDb, `users/${OWNER_UID}/habits/h1/revisions/r1`),
        { note: 'Nested' },
      )
      await setDoc(doc(adminDb, 'habits/root-h1'), { name: 'Root' })
      await setDoc(doc(adminDb, `users/${OWNER_UID}`), { topLevel: true })
    })

    const ownerDb = testEnv.authenticatedContext(OWNER_UID).firestore()

    // Another user's path
    await assertFails(getDoc(doc(ownerDb, `users/${OTHER_UID}/habits/h1`)))
    await assertFails(
      setDoc(doc(ownerDb, `users/${OTHER_UID}/habits/h2`), { name: 'Blocked' }),
    )

    // Unlisted collection under owner's users/{uid}
    await assertFails(getDoc(doc(ownerDb, `users/${OWNER_UID}/journals/j1`)))
    await assertFails(
      setDoc(doc(ownerDb, `users/${OWNER_UID}/journals/j2`), {
        entry: 'Blocked',
      }),
    )

    // Nested subcollection under users/{ownerUid}/habits/{id}/
    await assertFails(
      getDoc(doc(ownerDb, `users/${OWNER_UID}/habits/h1/revisions/r1`)),
    )
    await assertFails(
      setDoc(doc(ownerDb, `users/${OWNER_UID}/habits/h1/revisions/r2`), {
        note: 'Blocked',
      }),
    )

    // Root-level collection
    await assertFails(getDoc(doc(ownerDb, 'habits/root-h1')))
    await assertFails(setDoc(doc(ownerDb, 'habits/root-h2'), { name: 'Blocked' }))

    // Top-level users/{uid} document
    await assertFails(getDoc(doc(ownerDb, `users/${OWNER_UID}`)))
    await assertFails(setDoc(doc(ownerDb, `users/${OWNER_UID}`), { a: 1 }))
  })
})
