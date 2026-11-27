# Business Rules — DisciplineX

This document is the source of truth for progress calculations. UI labels and charts must follow these definitions.

## 1. Date model

- A day is interpreted in the user's configured time zone.
- Daily keys use `YYYY-MM-DD`.
- Weekdays use text keys `'mon'`, `'tue'`, `'wed'`, `'thu'`, `'fri'`, `'sat'`, `'sun'` with the week starting on Monday, defined in one ordered constant with one centralized helper converting from JavaScript `Date.getDay()`.
- The app must not silently switch a record to the previous/next day because the browser uses UTC.
- A habit is scheduled on a date only if the date is on/after `startDate`, on/before `endDate` (if any), and matches the schedule of the latest habit version where `effectiveFrom <= date`.

## 2. Daily habit states

For a habit on a date:
- **Completed:** The user has met the defined target.
- **Missed:** The date was scheduled, the day has closed, and the target was not met.
- **Pending:** The date is scheduled but is still in progress or has not been finalized.
- **Not scheduled:** The habit was not expected on that date.

Do not treat a future scheduled date as missed.

## 3. Completion percentage

For a selected reporting period:

`Completion rate = completed scheduled opportunities / total scheduled opportunities × 100`

Rules:
- Exclude not-scheduled days.
- Exclude future scheduled dates.
- Decide and document whether the current in-progress day is included; recommended default is to show it separately and exclude it from the completed-period denominator until day close.
- If there are zero eligible scheduled opportunities, show `—` or an empty state, not 0%.

For a daily dashboard, show completed habits divided by habits scheduled for that date. Clearly label pending/in-progress status.

## 4. Current streak

A streak is based on consecutive scheduled opportunities, not necessarily consecutive calendar dates.

- A completed scheduled day continues the streak.
- A missed scheduled day breaks the streak.
- A non-scheduled day does not break the streak.
- Future dates do not affect the current streak.
- For the current in-progress day, do not break a streak before the day closes. The UI may indicate that today's completion is still pending.

## 5. Longest streak

The longest streak is the highest number of consecutive completed scheduled opportunities in the habit's recorded history, using the same rules as current streak.

## 6. Habit edits and archives

- Renaming a habit must not rewrite historical name snapshots.
- Changing only `name`, `description`, `category`, `icon`, or `targetTimeLabel` updates the habit in place and does not create a new version.
- Changing schedule (`frequencyType` / `scheduledWeekdays`) or target (`targetType` / `targetValue` / `targetUnit`) uses `effectiveFrom` equal to today's local date key (`YYYY-MM-DD`; no backdating and no future `effectiveFrom` in MVP). If `effectiveFrom` equals the latest version's `effectiveFrom`, or if `startDate` is in the future, that version is replaced in place; otherwise a new effective-dated version is added while earlier versions remain intact. Today's evaluation uses the new version (today is still open).
- `startDate` is editable only while it is in the future (read-only after it has passed); editing `startDate` also moves the initial version's `effectiveFrom`.
- Any past date is evaluated using the latest version whose `effectiveFrom <= date`. Past history, logs, and streak inputs must never be rewritten by an edit.
- Time-based habits (for example, `"Wake up early, 5:00 AM"`) use the simple-completion (`boolean`) target type plus an optional display-only `targetTimeLabel` text field (meaningful only for `boolean`-target habits). The system does not verify completion time, and a real `time` target type is out of MVP scope.
- Archiving a habit prevents it from appearing in future active checklists.
- Archiving must preserve all daily logs and historical analytics.
- Deleting a habit permanently should not be offered in the MVP unless a deliberate data-deletion flow is implemented.

## 7. Challenges

- Duration is a positive integer number of calendar days.
- If the start date is day 1, the end date is `startDate + durationDays - 1`.
- Extending a challenge changes its end date and records the extension; it does not erase past progress.
- Challenge progress must be based on its configured success rule.
- A challenge can be active, planned, completed, or abandoned.
- A challenge is not automatically successful merely because its end date has passed; evaluate its configured success condition.

## 8. Rounding and display

- Keep full precision for calculations.
- Round displayed percentages consistently (recommended: one decimal place).
- Do not add rounded daily percentages to calculate a weekly percentage. Calculate the weekly numerator and denominator first, then divide.

## 9. Required edge-case tests

- Habit scheduled Monday/Wednesday/Friday: Tuesday does not break its streak.
- A missed scheduled day breaks the streak.
- Future scheduled dates do not count as missed.
- A habit created mid-month has no earlier scheduled opportunities.
- Archived habits retain historical results.
- A schedule change does not rewrite earlier dates.
- Dates around local midnight and UTC boundaries remain assigned to the correct local day.
- A challenge extended after partial completion retains its previous daily records.
