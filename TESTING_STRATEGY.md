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

Where practical, use Firebase Emulator Suite for:
- Authentication-dependent operations.
- Firestore reads and writes.
- Security Rules tests.
- Invalid document rejection.
- Cross-user access denial.

Do not rely only on UI hiding to prove data security.

## 5. Manual test checklist

- [ ] App loads on desktop and mobile.
- [ ] Light, dark, and system themes work.
- [ ] Habit can be created, edited, and archived.
- [ ] Habit completion persists after reload.
- [ ] Completion can be corrected.
- [ ] Past dates show correct records.
- [ ] Archived habit history remains available.
- [ ] Streak handles non-scheduled days correctly.
- [ ] Future dates are not counted as missed.
- [ ] Challenge extension preserves previous progress.
- [ ] Unauthenticated users cannot access private data.
- [ ] One user cannot access another user's data.
- [ ] Production build succeeds.

## 6. Release checks

Before each milestone:
1. Run lint (`npm run lint` via `oxlint`).
2. Run relevant tests (`npm test` via `vitest run`).
3. Run production build (`npm run build` via `vite build`).
4. Review browser console.
5. Review changed files and Git diff.
6. Record known limitations.
