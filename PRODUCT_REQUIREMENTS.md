# Product Requirements — DisciplineX

## 1. Product summary

DisciplineX is a personal discipline and productivity tracker. It helps the user define habits, record daily completion, follow challenges, and understand consistency over time.

The first release is personal-use only. The data model and security model should be suitable for future multi-user support without requiring a complete rewrite.

## 2. Goals

- Record habits and daily outcomes.
- Make today's priorities visible at a glance.
- Calculate streaks and completion rates consistently.
- Show historical activity in a calendar.
- Support challenges with configurable durations.
- Provide light and dark themes.
- Work on desktop and mobile screens.

## 3. Non-goals for the initial release

- Social feeds, friends, leaderboards, or public profiles.
- AI coaching or automatic habit recommendations.
- Payments, subscriptions, or advertising.
- Wearable/device integrations.
- Push notifications and email reminders.
- Complex team or organization management.

## 4. Target user

Initially, one individual uses the application to track personal routines, learning, fitness, and self-reflection. Later, multiple independent users may register and maintain private data.

## 5. Functional requirements

### 5.1 Dashboard
- Show the current local date.
- Show active habit count, completed habits, today's completion percentage, and current streak summary.
- Show today's habit checklist.
- Show a recent activity or weekly overview.
- Show an active challenge summary when one exists.
- Provide clear empty states when there are no habits or logs.

### 5.2 Habit management
A user can:
- Create, view, edit, archive, and restore a habit.
- Set a name, optional description, category (controlled list; MVP values `Learning`, `Fitness`, `Personal`, `Health`; configurable categories may come later), icon, frequency, target, unit, optional display-only `targetTimeLabel` (meaningful only for simple-completion `boolean` habits; time verification is out of MVP scope), and start date (`startDate` is editable only while in the future).
- Choose a daily schedule or selected weekdays (`mon`, `tue`, `wed`, `thu`, `fri`, `sat`, `sun`, week starting Monday).
- Set a measurable numeric target, such as 60 minutes or 2 problems, or use a simple-completion (`boolean`) target (optionally with display-only `targetTimeLabel`).
- Edit metadata (`name`, `description`, `category`, `icon`, `targetTimeLabel`) without versioning, or update schedule/target as an effective-dated version (`effectiveFrom` = today's local date key, replacing in place on same-day or future-`startDate` edits) without altering past history or logs.
- Mark a scheduled habit as completed for a date.
- Correct a completion record when an honest mistake was made.

Habit deletion should not erase historical logs. Prefer archive/soft-delete behavior.

### 5.3 Daily tracking
- Display habits scheduled for the selected date.
- Allow completion and uncompletion.
- Store the date of the record as a date key in the user's configured time zone.
- Distinguish completed, missed, and not-scheduled days.
- Do not create a completion record merely because a habit appears on screen.

### 5.4 Streaks and completion
- Calculate current and longest streaks using the rules in `BUSINESS_RULES.md`.
- Calculate completion rate using scheduled opportunities, not calendar days on which the habit was inactive.
- Allow the user to inspect the records behind a statistic.

### 5.5 Calendar
- Show daily completion status.
- Allow navigation between months.
- Selecting a date opens that day's habit records.
- Use accessible labels; do not rely on color alone.

### 5.6 Challenges
- Create a challenge with title, description, start date, and duration.
- Support presets such as 30, 45, 60, 75, 90, 100, and 120 days, plus a custom duration.
- Show elapsed days, remaining days, and progress.
- Preserve existing challenge history if the end date is extended.
- Do not imply that a challenge day is successful unless its defined completion condition is met.
- The exact challenge completion condition must be selected when creating the challenge (for example, complete all linked habits or complete a chosen daily checklist). Do not assume one universal rule.

### 5.7 Theme and settings
- Support light, dark, and system theme preference.
- Persist the selected preference.
- Provide a setting for the user's time zone.
- Provide a way to review account/data settings when authentication is introduced.

### 5.8 Future modules (not part of the first MVP)
- Study sessions and topic tracking.
- Fitness/workout logs.
- Daily journal.
- Advanced analytics and reports.
- Reminders and notifications.

## 6. Quality requirements

- Responsive at mobile, tablet, and desktop widths.
- Keyboard-accessible interactive controls.
- Loading, empty, success, and error states.
- Form validation with useful messages.
- No secrets in source control.
- Firestore access restricted by authenticated user ownership.
- Avoid unnecessary reads and writes; use appropriate Firestore queries and indexes.
- Keep business calculations testable independently of React components.

## 7. MVP acceptance criteria

The MVP is acceptable when:
1. The user can create, edit, archive, and list habits.
2. The user can mark a scheduled habit complete or incomplete for a date.
3. Reloading the app preserves the data.
4. Historical daily records remain available after a habit is edited or archived.
5. Current streak, longest streak, and completion rate follow `BUSINESS_RULES.md`.
6. Calendar navigation shows accurate historical status.
7. Light and dark themes both work.
8. Firestore rules prevent one user from reading or changing another user's records.
9. The production build completes without errors.
10. Core calculations and data operations have tests.
