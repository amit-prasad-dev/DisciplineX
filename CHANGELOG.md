# Changelog

Notable project changes are recorded here.

The format follows:
- Added
- Changed
- Fixed
- Removed
- Security

## Unreleased

### Added
- Initial DisciplineX project documentation.
- Product requirements, user flows, UI/UX guidelines, architecture, Firestore data model, business rules, security plan, roadmap, coding standards, testing strategy, and AI-agent instructions.
- Phase 1 project foundation:
  - Vite + React (JavaScript) scaffold (`react` `^19.3.1`, `react-dom` `^19.3.1`, `vite` `^8.4.0`, `@vitejs/plugin-react` `^6.3.0`) with `oxlint` (`^1.94.0`).
  - Tailwind CSS v4 (`tailwindcss` `^4.3.5`, `@tailwindcss/vite` `^4.3.5`) with class-based dark mode and semantic CSS color tokens in `src/index.css`.
  - Vitest (`vitest` `^5.1.2`) configured via `npm test` (`vitest run`) with sanity and theme resolution unit tests.
  - React Router Declarative Mode (`react-router` `^8.5.3`) with 7 placeholder feature routes and a catch-all Not Found route.
  - Theme context/provider (`light` / `dark` / `system`) with live OS preference tracking, `localStorage` persistence, and FOUC prevention in `index.html`.
  - Responsive `AppShell` (`lucide-react` `^1.81.0`) with desktop fixed sidebar, top utility bar, accessible mobile navigation drawer, and skip-to-content link.
- Phase 2 dashboard UI with temporary local mock data:
  - Local date formatting helper `formatLocalDate` (default `Asia/Kolkata`, `Intl.DateTimeFormat`) and `WEEK_START_DAY = 'Monday'` in `src/utils/date.js`, with midnight-boundary Vitest unit tests in `src/utils/date.test.js`.
  - Temporary Dashboard mock data in `src/features/dashboard/mockData.js` (6 sample habits, sample summary counts, Monday–Sunday sample weekly states, and an in-progress sample challenge) plus persistent `<SampleDataBanner />` (`"Sample data: not your real progress"`).
  - Dashboard cards (`TodayHeaderCard`, `TodayProgressCard`, `StreakSummaryCard`, `WeeklyOverviewCard`, `ActiveChallengeCard`, `TodayHabitsCard`) using semantic tokens and non-color-only state indicators.
  - Reusable `LoadingState`, `EmptyState` (displaying `—` instead of `0%` when no scheduled opportunities exist), and `ErrorState` components in `src/components/common/`, wired to a temporary 4-state preview control (`Sample data`, `Empty`, `Loading`, `Error`) in `DashboardPage.jsx`.
  - Note: Temporary mock data (`src/features/dashboard/mockData.js`), `<SampleDataBanner />`, and the Dashboard preview control must be removed when real data arrives in Phase 5.
