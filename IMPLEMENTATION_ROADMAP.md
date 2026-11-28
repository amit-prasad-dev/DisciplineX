# Implementation Roadmap — DisciplineX

Build and verify one phase at a time. Do not ask an AI coding agent to implement the entire roadmap in one prompt.

## Phase 0 — Documentation and decisions
- Review all project Markdown documents.
- Resolve open product decisions.
- Confirm naming, folder structure, and scope.
- Commit documentation.

**Exit criteria:** Requirements and business rules are internally consistent.

## Phase 1 — Project foundation
- Create React + Vite JavaScript project.
- Configure Tailwind CSS.
- Add React Router and Lucide React.
- Establish source structure.
- Add theme context and semantic theme tokens.
- Add responsive application shell and placeholder routes.

**Exit criteria:** App runs, routes work, theme switches, production build succeeds.

## Phase 2 — Dashboard UI with temporary local mock data
- Build stat cards, today's checklist layout, weekly overview, and empty states.
- Clearly label mock data in development.
- Do not present mock statistics as real user records.

**Exit criteria:** Responsive dashboard is visually consistent in both themes.

## Phase 3 — Habit management
- Build create, edit, and archive/restore UI.
- Add frequency and target configuration.
- Add validation and reusable habit components.
- Store habits in memory only during Phase 3 (no persistence; Firestore integration comes in Phase 5).
- Support controlled MVP categories (`Learning`, `Fitness`, `Personal`, `Health`), Monday-first weekday keys (`mon`–`sun`), display-only `targetTimeLabel` for `boolean`-target habits, and effective-dated versions on schedule/target edits.

**Exit criteria:** Habit CRUD UI and validation work.

## Phase 4 — Firebase foundation and authentication
- Stay on the free Firebase Spark plan (no Blaze plan, no Cloud Functions, no Identity Platform upgrade).
- Step 4.1: Create Firebase project, create the Firestore database in **PRODUCTION (locked)** mode (not test mode), configure `VITE_FIREBASE_*` and `VITE_OWNER_UID` placeholders in `.env.example` + real values in gitignored `.env.local`, add `.firebase/` to `.gitignore` when Firebase CLI files appear, and initialize Firebase once.
- Step 4.2: Enable Google sign-in only (`signInWithPopup`; no email/password, password reset, or email-verification UI).
- Step 4.3: Add auth context/service, auth state handling, dedicated `/sign-in` route gating all app routes (including Phase 2's Dashboard sample view), sign-in/sign-out UI, UX-only `VITE_OWNER_UID` check showing `"This account doesn't have access yet"` + `"Sign out"` for non-allowlisted accounts, and clear in-memory habits on sign-out (habits stay memory-only and Phase 4 adds no Firestore reads or writes from the app).
- Step 4.4: Requires `firebase-tools` (Firebase CLI) for rules deploy and local emulator (`firebase.json` and `.firebaserc` may be committed; project ID is not a secret). Bootstrap order: sign in once with Google, copy the owner UID from Firebase Console > Authentication > Users, put it in `firestore.rules` and `.env.local` as `VITE_OWNER_UID` (until then, even the owner sees the `"This account doesn't have access yet"` screen, which is expected). Deploy `firestore.rules` (enforcing `request.auth.uid == uid`, temporary owner UID allowlist, and default deny) solely to lock the database, and add local Firestore emulator rules tests using `@firebase/rules-unit-testing` under a separate `npm run test:rules` script (check the required Java version in current Firebase docs at that time so plain `npm test` never requires Java or the emulator).

**Exit criteria:** Google sign-in/sign-out and route protection work, non-allowlisted accounts see `"This account doesn't have access yet"` without loading data, sign-out clears in-memory habits, and Firestore rules deny unauthenticated, non-allowlisted, and cross-user access.

## Phase 5 — Firestore integration
- Step 5.0: Record Phase 5 product and architecture decisions in the project docs.
- Step 5.1: Check whether a newer `firebase` `13.x` version resolves the `@grpc/grpc-js` advisory (`npm audit --omit=dev`). Add one shared Firestore accessor in `src/services/firebase/` (default memory cache only, no persistent local cache), create pure habit document mapping (`schemaVersion: 1`, no stored `id` field inside the doc, client ISO 8601 audit strings `createdAt`/`updatedAt`) and `src/services/habits/` (`doc(collection(...)).id`, `getDocs` sorted by `createdAt` ascending then `id`, atomic full-doc `setDoc`), add unit tests, and verify after the first Firestore import that `dist/` contains no gRPC code.
- Step 5.2: Update `firestore.rules` with validation for `profile` and `habits` (`schemaVersion == 1`, allowed keys only with no `id` on habits, types, string limits, `category`/`status` enums, date-key format, `1 <= versions.size() <= 400` noting rules cannot iterate list elements, immutable `createdAt`, unchanged ownership) and deny habit deletion (`allow delete: if false;`; dev cleanup via Firebase Console only). Update `tests/rules/firestore.rules.test.js` to valid schemas plus delete-denial tests, run `npm run test:rules` and `npm run check:rules`, and deploy rules before the app writes to Firestore.
- Step 5.3: Replace the Phase 3 in-memory backing of `HabitsProvider` with async Firestore persistence (`Promise`-returning actions; load once on entering `ownerSignedIn` via `getDocs`; enforce the `100`-habit app-side cap in `createHabitInList`; validate before write and update state only after confirmation; ignore late responses after sign-out/unmount; show `LoadingState` with `"Still loading… check your connection"` after ~10s and Retry on error without auto-cancelling; load valid habits plus a persistent neutral notice listing IDs only for malformed docs without overwriting/auto-fixing them; show `"Couldn't confirm the save. Check your connection; reload to see what was saved."` inline on form error or in a dismissible `role="alert"` banner on `HabitsPage` with pending button disabled).
- Step 5.4: Remove `src/features/dashboard/mockData.js`, `<SampleDataBanner />`, and the Dashboard preview switcher; show today's local date and real active habits scheduled today (name and target only via `isHabitScheduledOn`, with no completion/pending/missed states, percentages, or streaks), show `"—"` with a short note that daily tracking arrives in Phase 6/7 on the progress/streak/weekly/challenge cards, and wire real loading, empty, and error states.
- Step 5.5: Add `src/services/profile/` (`users/{uid}/profile/main` storing `schemaVersion: 1`, `timeZone` default `"Asia/Kolkata"`, `createdAt`, and `updatedAt` only; no email/PII; theme stays in `localStorage`; `ensureProfile` creates it on first sign-in using `runTransaction` with one re-read on `permission-denied` or aborted transaction), with unit tests.
- Step 5.6: Close out Phase 5 (audit, `npm run lint`, `npm test`, `npm run test:rules`, `npm run check:rules`, `npm run build` + `dist/` no-gRPC check, docs sync, `CHANGELOG.md`).

**Exit criteria:** Profile and habit documents (`schemaVersion: 1`) persist across reloads (`createdAt` asc / `id` asc), `createHabitInList` enforces the `100`-habit cap, failed/slow saves preserve typed input and ignore late post-sign-out/unmount results, malformed docs are reported by ID only without failing valid habits or auto-modifying data, Dashboard shows real scheduled active habits without fabricated statistics, `firestore.rules` validates `profile`/`habits` and denies habit deletion (tested and deployed before app writes), and `dist/` contains no gRPC code.

## Phase 6 — Daily tracking and history
- Implement date-specific logs.
- Support complete/uncomplete and correction.
- Preserve snapshots for historical display.
- Add date/time-zone utilities.

**Exit criteria:** Records persist and historical days display accurately.

## Phase 7 — Streaks, calendar, and challenge
- Implement and unit-test business calculations.
- Build calendar history.
- Build challenge creation, progress, and extension.

**Exit criteria:** All required edge cases in `BUSINESS_RULES.md` pass.

## Phase 8 — Analytics
- Add weekly/monthly summaries and charts.
- Calculate from source records.
- Avoid misleading percentages and empty-state errors.

**Exit criteria:** Chart values reconcile with underlying logs.

## Phase 9 — Future modules
- Study tracker.
- Fitness tracker.
- Journal.
Implement only after the core tracker is stable.

## Phase 10 — Hardening and deployment
- Accessibility review.
- Responsive testing.
- Security Rules tests.
- Production build and error review.
- Firebase Hosting deployment.
- Add deployed domain(s) to Firebase Auth Authorized Domains (`localhost` is allowed by default).
- Restrict the Firebase web API key to the app's domains in the Google Cloud Console.
- Verify actual Firestore usage and current plan limits.

## Workflow for every phase

1. Read the relevant Markdown requirements.
2. Ask the coding agent for only the current phase/task.
3. Review changed files and understand the implementation.
4. Run lint/tests/build as applicable.
5. Fix issues before continuing.
6. Commit a working checkpoint to Git.
