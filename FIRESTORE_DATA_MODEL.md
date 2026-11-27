# Firestore Data Model — DisciplineX

## 1. Design principles

- All personal records belong to one authenticated user.
- Keep habit definitions separate from date-specific completion records.
- Archive habits instead of deleting their history.
- Use stable document IDs and explicit schema fields.
- Store dates as local date keys (`YYYY-MM-DD`) and timestamps as Firestore timestamps.
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

Suggested fields:
- `displayName`: string
- `email`: string (optional display copy; Auth remains authoritative)
- `timeZone`: string, default `Asia/Kolkata`
- `theme`: `light | dark | system`
- `createdAt`: timestamp
- `updatedAt`: timestamp

## 4. Habit document

Path: `users/{uid}/habits/{habitId}`

Suggested fields:
- `name`: string, required
- `description`: string, optional
- `category`: controlled list; MVP values `Learning | Fitness | Personal | Health` (configurable categories may come later)
- `icon`: string, optional icon key (not arbitrary executable content)
- `targetTimeLabel`: string, optional display-only label meaningful only for `boolean`-target habits (not verified by the system; a verified `time` target type is out of MVP scope)
- `startDate`: string (`YYYY-MM-DD`; editable only while in the future; read-only once started; editing moves the initial version's `effectiveFrom`)
- `endDate`: string or null
- `status`: `active | archived`
- `versions`: non-empty array of effective-dated schedule/target versions ordered by `effectiveFrom` ascending, each containing:
  - `effectiveFrom`: string (`YYYY-MM-DD`; initial version matches `startDate`)
  - `frequencyType`: `daily | selected_weekdays`
  - `scheduledWeekdays`: array of `'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'` (week starts Monday; stored via one centralized ordered constant and `Date.getDay()` conversion helper)
  - `targetType`: `boolean | numeric`
  - `targetValue`: number or null (required when `targetType` is `numeric`)
  - `targetUnit`: string or null (optional for `numeric`, e.g. minutes, problems, pages)
- `createdAt`: timestamp
- `updatedAt`: timestamp

Changing `name`, `description`, `category`, `icon`, or `targetTimeLabel` updates metadata in place without creating a new version. Changing schedule (`frequencyType`, `scheduledWeekdays`) or target (`targetType`, `targetValue`, `targetUnit`) uses `effectiveFrom` equal to today's local date key (`YYYY-MM-DD`; no backdating or future `effectiveFrom` in MVP). If `effectiveFrom` matches the current latest version's `effectiveFrom`, or if `startDate` is still in the future, that version is replaced in place; otherwise a new version is appended. Today's evaluation uses the new version (today is still open), while past dates evaluate against the latest version where `effectiveFrom <= date` without rewriting prior versions or recalculating historical logs.

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
- `createdAt`: timestamp
- `updatedAt`: timestamp

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
- `createdAt`: timestamp
- `updatedAt`: timestamp
- `extendedFromEndDate`: string or null
- `extensionHistory`: array of objects with old/new end dates and timestamp, if size remains reasonable

Do not store every derived chart value in the challenge document. Derive progress from daily records unless profiling proves otherwise.

## 7. Indexes

Create composite indexes only when Firestore reports they are required by real queries. Document each required index and its purpose in the repository.

## 8. Schema evolution

- Keep a `schemaVersion` on documents if migrations become necessary.
- Validate incoming form data before writing.
- Handle missing optional fields when reading older documents.
- Never assume all historical documents have the newest shape.
