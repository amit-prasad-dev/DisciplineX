# DisciplineX

**Tagline:** Build Discipline. Master Consistency.

DisciplineX is a personal productivity and habit-tracking web application. The first release is intended for one person's use, with an architecture that can later support multiple users.

## Product goals

- Make daily habits easy to define and track.
- Show progress honestly through completion rates, streaks, and history.
- Support time-bound discipline challenges.
- Keep historical records when a habit is edited, archived, or discontinued.
- Provide a clear, responsive dashboard with light and dark themes.
- Keep the first release focused; add study, fitness, journaling, and advanced analytics incrementally.

## Technology

- React + Vite + JavaScript
- Tailwind CSS (v4 via `@tailwindcss/vite`)
- React Router
- Lucide React
- Vitest (unit testing)
- oxlint (linting)
- Recharts (when analytics are implemented)
- Firebase Authentication (Google sign-in)
- Cloud Firestore
- Firebase Hosting (deployment stage)
- Free Firebase Spark plan (MVP)
- Git and GitHub

## Documentation

| File | Purpose |
|---|---|
| `PRODUCT_REQUIREMENTS.md` | Product scope, users, features, and acceptance criteria |
| `USER_FLOWS.md` | Main user journeys and navigation |
| `UI_UX_GUIDELINES.md` | Visual system, layout, responsive and accessibility guidance |
| `TECHNICAL_ARCHITECTURE.md` | Frontend and Firebase architecture |
| `FIRESTORE_DATA_MODEL.md` | Collections, document fields, and data relationships |
| `SECURITY_RULES_PLAN.md` | Authentication and Firestore security requirements |
| `BUSINESS_RULES.md` | Streak, completion, date, and challenge calculations |
| `IMPLEMENTATION_ROADMAP.md` | Phases, dependencies, and definition of done |
| `CODING_STANDARDS.md` | Code quality and project conventions |
| `TESTING_STRATEGY.md` | Manual and automated test expectations |
| `AGENTS.md` | Instructions for AI coding agents working in this repository |
| `CHANGELOG.md` | Notable project changes |

## Getting started

The Phase 1 foundation, Phase 2 mock Dashboard UI, and Phase 3 in-memory Habit management are implemented. Firebase Authentication, Cloud Firestore persistence, and remaining modules are intentionally left for later phases.

```bash
npm install
npm run dev      # Start local Vite dev server
npm run lint     # Run oxlint
npm test         # Run Vitest once (vitest run)
npm run build    # Build production bundle to dist/
npm run preview  # Preview the production build locally
```

## Product principles

1. Correct historical data is more important than impressive-looking statistics.
2. A missed scheduled habit must not be silently counted as completed.
3. Editing a habit must not rewrite its past completion history.
4. Never put secrets or privileged Firebase credentials in frontend code, and never commit `.env` files, personal email addresses, or private keys to this public repository.
5. Do not add a feature before its requirements and acceptance criteria are clear.
