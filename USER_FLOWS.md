# User Flows — DisciplineX

## Primary navigation

- Dashboard
- Habits
- Daily Tracker
- Calendar
- Challenges
- Analytics
- Settings

Future navigation items (Study, Fitness, Journal) should be added only when those modules are scheduled for implementation.

## Flow 1: First-time setup

1. User opens DisciplineX.
2. All routes are gated behind `/sign-in`: user signs in with Google (`signInWithPopup`); non-allowlisted accounts see `"This account doesn't have access yet"` with Sign out; signing out clears in-memory data.
3. User sees an onboarding/empty dashboard.
4. User creates their first habit.
5. User chooses its category (controlled list; MVP values: `Learning`, `Fitness`, `Personal`, `Health`; configurable categories may come later), schedule (daily or selected Monday–Sunday weekdays `mon`–`sun`), target (simple completion with optional display-only `targetTimeLabel` meaningful only for `boolean`-target habits, or numeric value + unit), and start date.
6. The habit appears on the dashboard on dates when it is scheduled.

## Flow 2: Complete a habit

1. User opens Dashboard or Daily Tracker.
2. User selects today's date (or another permitted date).
3. App lists habits scheduled for that date.
4. User marks a habit complete.
5. App saves a date-specific log.
6. Dashboard totals and relevant statistics refresh.
7. User can undo or correct the record.

## Flow 3: Review a past day

1. User opens Calendar.
2. User navigates to a month.
3. User selects a date.
4. App displays the habits scheduled for that date and their recorded outcomes.
5. User may correct a record if allowed by the product's editing policy.

## Flow 4: Create a challenge

1. User opens Challenges.
2. User creates a challenge title and optional description.
3. User selects start date and preset/custom duration.
4. User selects the challenge success condition and any linked habits, if applicable.
5. App calculates the end date and displays the challenge.
6. User views progress and can extend the challenge without deleting prior records.

## Flow 5: Change theme

1. User opens Settings or uses the theme control.
2. User chooses Light, Dark, or System.
3. App applies the theme immediately.
4. Preference is persisted for the next visit.

## Empty and error states

Every major page must handle:
- No data yet.
- Loading data.
- Network unavailable.
- Permission denied.
- Invalid form input.
- Save failure with a retry path.

Do not show fabricated sample statistics as if they were real user data. If demo data is used during UI development, label it clearly and remove it from production behavior.
