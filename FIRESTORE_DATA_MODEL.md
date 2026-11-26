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
- `category`: string or controlled enum
- `icon`: string, optional icon key (not arbitrary executable content)
- `frequencyType`: `daily | selected_weekdays`
- `scheduledWeekdays`: array of weekday numbers when applicable (define 1–7 consistently)
- `targetType`: `boolean | numeric`
- `targetValue`: number, required for numeric targets
- `targetUnit`: string, optional (minutes, problems, pages, etc.)
- `startDate`: string (`YYYY-MM-DD`)
- `endDate`: string or null
- `status`: `active | archived`
- `createdAt`: timestamp
- `updatedAt`: timestamp

Do not overwrite the habit's past schedule when the user changes its schedule. For the MVP, either make schedule changes effective from a chosen date and preserve schedule history, or explicitly limit schedule editing to future dates. The implementation must not silently recalculate old history using today's schedule.

## 5. Daily log document

Suggested ID: `{date}_{habitId}` (ensure IDs are encoded safely if needed).

Path: `users/{uid}/dailyLogs/{date_habitId}`

Suggested fields:
- `habitId`: string
- `habitNameSnapshot`: string
- `date`: string (`YYYY-MM-DD`, user's local date)
- `status`: `completed | missed`
- `completedValue`: number or null
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
