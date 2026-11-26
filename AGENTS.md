# AGENTS.md — Instructions for AI Coding Agents

You are assisting with the DisciplineX repository.

## First actions

1. Read `README.md`.
2. Read the relevant sections of `PRODUCT_REQUIREMENTS.md`.
3. Read `BUSINESS_RULES.md` before implementing calculations or tracking behavior.
4. Read `TECHNICAL_ARCHITECTURE.md` and `FIRESTORE_DATA_MODEL.md` before changing data access.
5. Read `SECURITY_RULES_PLAN.md` before touching Firebase or Firestore rules.
6. Check the existing repository before creating, deleting, or renaming files.

## Product context

DisciplineX is initially a personal-use habit and discipline tracker, with a possible future public multi-user release.

The approved stack is:
- React + Vite + JavaScript
- Tailwind CSS
- React Router
- Lucide React
- Recharts when analytics are implemented
- Firebase Authentication
- Cloud Firestore
- Firebase Hosting at deployment

Do not replace this stack without asking.

## Critical rules

- Implement only the task explicitly requested by the user.
- Do not build the whole application in one operation.
- Do not add unrequested features.
- Do not change the database model or business rules silently.
- Do not invent product behavior when requirements are ambiguous; ask a focused question.
- Preserve existing working code and user changes.
- Do not delete historical habit logs when editing or archiving a habit.
- Do not expose secrets or privileged credentials.
- Never use permissive Firestore rules in a deployed application.
- Do not treat frontend route guards as a replacement for Firestore Security Rules.
- Do not claim tests/builds passed unless you actually ran them.

## Implementation expectations

- Prefer readable, maintainable code over clever shortcuts.
- Keep Firebase access in service modules.
- Keep date, streak, and completion calculations in pure utility/domain functions.
- Include loading, empty, and error states.
- Support light and dark themes.
- Keep mobile responsiveness and accessibility in scope.
- Add or update tests for business logic.
- Avoid unnecessary dependencies.

## After each task

Report:
1. What changed.
2. Which files changed.
3. Important implementation decisions.
4. Commands/checks run and their actual results.
5. Any remaining issue or next dependency.

Do not start the next roadmap phase unless the user asks.
