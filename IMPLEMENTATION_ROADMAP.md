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
- Create Firebase project.
- Configure environment variables.
- Initialize Firebase once.
- Enable Authentication.
- Add sign-in/sign-out and auth state handling.
- Add initial Firestore rules and emulator/testing setup where practical.

**Exit criteria:** Authenticated user identity is available and private data access is denied to unauthenticated users.

## Phase 5 — Firestore integration
- Implement profile and habit services.
- Connect habit management to Firestore.
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
- Verify actual Firestore usage and current plan limits.

## Workflow for every phase

1. Read the relevant Markdown requirements.
2. Ask the coding agent for only the current phase/task.
3. Review changed files and understand the implementation.
4. Run lint/tests/build as applicable.
5. Fix issues before continuing.
6. Commit a working checkpoint to Git.
