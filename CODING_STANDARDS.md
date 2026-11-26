# Coding Standards — DisciplineX

## General
- Use JavaScript consistently; do not introduce TypeScript unless explicitly approved.
- Prefer small, focused components and functions.
- Use descriptive names.
- Avoid duplicated business logic.
- Do not add dependencies without explaining the need.
- Keep code readable; avoid clever abstractions.

## React
- Use function components and hooks.
- Keep rendering separate from Firebase data access.
- Avoid very large page components.
- Use stable keys when rendering lists.
- Handle loading, empty, and error states.
- Avoid unnecessary effects and duplicated state.

## Data and services
- Put Firebase initialization in one module.
- Put Firestore operations in service modules.
- Validate user input before writes.
- Handle Firebase errors and show useful messages.
- Do not trust client-side checks as security enforcement.
- Keep domain calculations pure and independently testable.

## Styling
- Use shared design tokens and reusable patterns.
- Support light and dark themes.
- Avoid scattered hard-coded colors.
- Ensure responsive layouts and visible focus states.
- Respect reduced-motion preferences.

## Git
- Make small, meaningful commits.
- Do not commit `.env`, credentials, build output, or `node_modules`.
- Review `git diff` before committing.
- Do not overwrite unrelated user changes.

## AI coding agent behavior
- Read `AGENTS.md` and relevant documentation before editing.
- Work only on the explicitly requested task.
- Do not silently change architecture, dependencies, or business rules.
- Explain changed files and important decisions.
- Run relevant checks and report exact results.
- If requirements conflict or are unclear, stop and ask rather than inventing a rule.
