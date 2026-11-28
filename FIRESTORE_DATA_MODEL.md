# Firestore Data Model — DisciplineX

## 1. Design principles

- All personal records belong to one authenticated user.
- Keep habit definitions separate from date-specific completion records.
- Archive habits instead of deleting their history.
- Use stable document IDs and explicit schema fields.
- Store calendar dates as local date keys (`YYYY-MM-DD`) and `createdAt`/`updatedAt` audit fields as client-generated ISO 8601 strings (audit metadata only; never used in business rules).
- Add fields deliberately; avoid storing duplicate derived statistics unless performance later requires it.

## 2. Proposed structure

```text
users/{uid}
  profile/main
  habits/{habitId}
  dailyLogs/{date_habitId}
  challenges/{challengeId}
  journals/{journalId}              # future
  studySessions/{sessionId}         # future
  workoutLogs/{workoutId}           # future
```

## 3. User profile

Path: `users/{uid}/profile/main`

Created on first owner sign-in if missing via a Firestore `runTransaction` (read inside the transaction and create only when the document does not exist; on `permission-denied` or an aborted transaction, re-read once). Theme preference stays in `localStorage` (to prevent theme flash on load), and no email address or other personal data is stored in Firestore. A Settings UI to edit `timeZone` comes in a later phase.

Allowed fields (`firestore.rules` rejects extra keys and validates `schemaVersion == 1`):
- `schemaVersion`: number (`1`)
- `timeZone`: string (non-empty IANA time-zone identifier, `1–64` chars in `firestore.rules`, default `Asia/Kolkata`)
- `createdAt`: ISO 8601 string (`YYYY-MM-DDTHH:mm:ss.sssZ`, immutable after creation; audit only)
- `updatedAt`: ISO 8601 string (`YYYY-MM-DDTHH:mm:ss.sssZ`; audit only)

## 4. Habit document

Path: `users/{uid}/habits/{habitId}`

Habit IDs are generated client-side via Firestore `doc(collection(...)).id` (no network call) and passed into the domain `createHabit` function. The stored Firestore document does **not** contain an `id` field; the service sets `id` from `docSnap.id` on read, and `firestore.rules` allowed keys do not include `id`. Each create or edit writes the entire habit document atomically with `setDoc` (since `versions` lives inside the document). Habits are never deleted by the app (`firestore.rules` denies deletion; test cleanup during development happens via the Firebase Console).

When loaded once via `getDocs`, valid habits are sorted by `createdAt` ascending with ties broken by `id`. Malformed habit documents are not silently hidden or failed across the whole list, and the app never overwrites or auto-fixes them: valid habits still load, accompanied by a persistent neutral notice (`"N saved habit(s) couldn't be read and are hidden"`) listing document IDs only. A maximum of `100` habits per user (active plus archived) is enforced in pure store logic (`createHabitInList`); because Firestore rules cannot count documents, this cap is app-side only.

Allowed fields (`firestore.rules` rejects extra keys, mirrors `HABIT_FIELD_LIMITS` bounds, and validates `schemaVersion == 1`):
- `schemaVersion`: number (`1`)
- `name`: string, required (non-empty, trimmed, `1–80` chars)
- `description`: non-empty string (`1–300` chars) or `null` (canonical stored form for none is `null`, never `""`)
- `category`: enum `'Learning' | 'Fitness' | 'Personal' | 'Health'`
- `icon`: non-empty string (`1–40` chars, icon key only) or `null` (canonical stored form for none is `null`, never `""`)
- `targetTimeLabel`: non-empty string (`1–40` chars) or `null` (canonical stored form for none is `null`, never `""`; display-only and meaningful only when latest version `targetType` is `'boolean'`)
- `startDate`: string (`YYYY-MM-DD`; editable only while in the future; moving it moves the initial version's `effectiveFrom`)
- `endDate`: string (`YYYY-MM-DD`) or `null`
- `status`: enum `'active' | 'archived'` (must be `'active'` on create)
- `versions`: non-empty array (`1 <= versions.size() <= 400` in rules) of effective-dated schedule/target versions ordered by `effectiveFrom` ascending, each containing:
  - `effectiveFrom`: string (`YYYY-MM-DD`; initial version matches `startDate`)
  - `frequencyType`: `daily | selected_weekdays`
  - `scheduledWeekdays`: array of `'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'` (week starts Monday; stored via one centralized ordered constant and `Date.getDay()` conversion helper; empty when `daily`)
  - `targetType`: `boolean | numeric`
  - `targetValue`: number (`> 0`) or `null` (required when `targetType` is `numeric`; `null` when `boolean`)
  - `targetUnit`: non-empty string (`1–30` chars) or `null` (canonical stored form for none is `null`, never `""`; `null` when `boolean`)
- `createdAt`: ISO 8601 string (`YYYY-MM-DDTHH:mm:ss.sssZ`, immutable after creation; equal to `updatedAt` on create; audit only)
- `updatedAt`: ISO 8601 string (`YYYY-MM-DDTHH:mm:ss.sssZ`; non-decreasing on update; audit only)

Note: Firestore Security Rules mirror these bounds (`80`, `300`, `40`, `40`, `30`, `1–64` on `timeZone`, `1 <= versions.size() <= 400`), validate top-level habit keys, types, enums, `YYYY-MM-DD` / ISO shapes, and validate `versions[0]` and `versions[versions.size() - 1]`. Rules cannot loop over middle elements of `versions`, check Monday-first ordering, verify real calendar date validity (e.g. `"2026-13-45"` matches shape), check IANA time-zone membership, or count documents for the `100`-habit cap; those checks remain enforced by the app/domain layer.

Changing `name`, `description`, `category`, `icon`, or `targetTimeLabel` updates metadata in place without creating a new version. Changing schedule (`frequencyType`, `scheduledWeekdays`) or target (`targetType`, `targetValue`, `targetUnit`) uses `effectiveFrom` equal to today's local date key (`YYYY-MM-DD`; no backdating or future `effectiveFrom` in MVP); switching `targetType` from `boolean` to `numeric` clears `targetTimeLabel` to `null`. If `effectiveFrom` matches the current latest version's `effectiveFrom`, or if `startDate` is still in the future, that version is replaced in place; otherwise a new version is appended. Today's evaluation uses the new version (today is still open), while past dates evaluate against the latest version where `effectiveFrom <= date` without rewriting prior versions or recalculating historical logs.

## 5. Daily log document

Suggested ID: `{date}_{habitId}` (ensure IDs are encoded safely if needed).

Path: `users/{uid}/dailyLogs/{date_habitId}`

Suggested fields:
- `habitId`: string
- `habitNameSnapshot`: string
- `date`: string (`YYYY-MM-DD`, user's local date)
- `status`: `completed | missed`
- `completedValue`: number or null
- `targetTypeSnapshot`: `boolean | numeric`
- `targetValueSnapshot`: number or null
- `targetUnitSnapshot`: string or null
- `note`: string, optional
- `createdAt`: ISO 8601 string (audit only; same convention as profile and habits — designed in Phase 6)
- `updatedAt`: ISO 8601 string (audit only; same convention as profile and habits — designed in Phase 6)

A record should exist only when an outcome is explicitly recorded or when the product intentionally records a missed day after that day has passed. Absence of a log must not automatically mean missed until the day is closed according to the business rules.

The name/target snapshots preserve meaningful history if the habit is later renamed or its target changes.

## 6. Challenge document

Path: `users/{uid}/challenges/{challengeId}`

Suggested fields:
- `title`: string
- `description`: string, optional
- `startDate`: string (`YYYY-MM-DD`)
- `endDate`: string (`YYYY-MM-DD`)
- `durationDays`: integer
- `status`: `planned | active | completed | abandoned`
- `successRule`: structured object describing how a successful day is calculated
- `linkedHabitIds`: array of habit IDs, optional
- `createdAt`: ISO 8601 string (audit only; same convention as profile and habits — designed in Phase 7)
- `updatedAt`: ISO 8601 string (audit only; same convention as profile and habits — designed in Phase 7)
- `extendedFromEndDate`: string or null
- `extensionHistory`: array of objects with old/new end dates and ISO 8601 string timestamp, if size remains reasonable

Do not store every derived chart value in the challenge document. Derive progress from daily records unless profiling proves otherwise.

## 7. Indexes

Create composite indexes only when Firestore reports they are required by real queries. Document each required index and its purpose in the repository.

## 8. Schema evolution

- Store `schemaVersion: 1` on `profile/main` and habit documents (validated by rules), and increment if future migrations become necessary.
- Validate incoming form data before writing.
- Handle missing optional fields when reading older documents.
- Never assume all historical documents have the newest shape.
