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
- Implement profile and habit services.
- Connect habit management to Firestore (replacing the Phase 3 in-memory habits store, within Spark free-tier limits).
- Add loading, empty, and error states.
- Test owner-only access.

**Exit criteria:** Habit data persists across reloads and is isolated by user.

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
