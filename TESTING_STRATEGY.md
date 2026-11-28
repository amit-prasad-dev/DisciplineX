# Testing Strategy — DisciplineX

## 1. Testing goals

Verify that:
- UI behavior is reliable across screen sizes and themes.
- Habit records persist correctly.
- Historical records remain stable.
- Streak and completion calculations are accurate.
- Firestore access is restricted to the owner.

## 2. Unit tests

Prioritize pure functions:
- Local date-key generation.
- Habit schedule evaluation.
- Daily completion rate.
- Current streak.
- Longest streak.
- Challenge end-date calculation.
- Challenge progress calculation.

Include edge cases from `BUSINESS_RULES.md`.

## 3. Component tests

Test:
- Habit form validation.
- Completion toggle behavior.
- Theme selection.
- Empty/loading/error states.
- Calendar date selection.
- Challenge creation and extension forms.

## 4. Service/integration tests

Where practical, use Firebase Emulator Suite (via a separate `npm run test:rules` script using `@firebase/rules-unit-testing` so plain `npm test` does not require Java or the emulator; requires Java JDK 11+ baseline, or Java 21+ for current Cloud Firestore emulator releases — re-check the current Firebase docs when installing) for:
- Authentication-dependent operations.
- Pure Firestore document mapping, malformed-document isolation, 100-habit cap, and async store/late-response unit tests.
- Firestore reads and writes.
- Security Rules tests (`profile` & `habits` schema validation, `schemaVersion == 1`, `1 <= versions.size() <= 400`, and habit deletion denial; Phase 5 updates Phase 4 dummy-payload tests to valid schemas).
- Invalid document rejection.
- Non-allowlisted UID rejection (temporary MVP owner allowlist).
- Cross-user access denial.

Do not rely only on UI hiding to prove data security.

## 5. Manual test checklist

- [ ] App loads on desktop and mobile.
- [ ] Light, dark, and system themes work.
- [ ] Habit can be created, edited, and archived.
- [ ] Habits and profile persist after reload (`createdAt` asc / `id` asc order), and failed offline saves keep typed input with a neutral error.
- [ ] Dashboard lists real active habits scheduled today (name/target only) with `"—"` on progress/streak/weekly/challenge cards until Phase 6/7.
- [ ] Habit completion persists after reload.
- [ ] Completion can be corrected.
- [ ] Past dates show correct records.
- [ ] Archived habit history remains available.
- [ ] Streak handles non-scheduled days correctly.
- [ ] Future dates are not counted as missed.
- [ ] Challenge extension preserves previous progress.
- [ ] Unauthenticated users cannot access private data.
- [ ] Signed-in non-allowlisted accounts see `"This account doesn't have access yet"` and are denied by Firestore rules.
- [ ] Signing out clears in-memory habits before the next sign-in.
- [ ] One user cannot access another user's data.
- [ ] Production build succeeds.

## 6. Release checks

Before each milestone:
1. Run lint (`npm run lint` via `oxlint`).
2. Run relevant tests (`npm test` via `vitest run`).
3. When Security Rules change, run `npm run check:rules` and `npm run test:rules`.
4. Run production build (`npm run build` via `vite build`).
5. Review browser console.
6. Review changed files and Git diff.
7. Record known limitations.
