# Technical Architecture — DisciplineX

## 1. Overview

DisciplineX is a React single-page application using Firebase client SDKs. In the initial architecture, Firebase Authentication identifies the user and Cloud Firestore stores user-owned application data.

```text
Browser
  |
  v
React + Vite application
  |-- React Router
  |-- UI components
  |-- domain/business logic
  |-- data/service layer
  |
  v
Firebase Web SDK
  |-- Firebase Authentication
  |-- Cloud Firestore
  |
  v
Firebase project
```

Do not treat frontend route protection as database security. Firestore Security Rules are mandatory.

## 2. Frontend stack

- React + Vite + JavaScript
- Tailwind CSS v4 (`@tailwindcss/vite`, configured in `src/index.css` without `tailwind.config.js`)
- React Router
- Lucide React
- Vitest (unit testing) and oxlint (linting)
- Recharts when analytics are implemented
- Firebase JavaScript SDK

Use versions compatible with one another and record the installed versions in `package.json` and the lockfile.

## 3. Suggested source structure

```text
src/
  app/
    App.jsx
    NotFoundPage.jsx
    router.jsx
  assets/
  components/
    common/
    layout/
    habits/
    calendar/
    challenges/
  features/
    dashboard/
    habits/
      components/
    dailyTracking/
    calendar/
    challenges/
    analytics/
    settings/
  context/
    HabitsContext.jsx   # temporary in-memory store until Phase 5
    ThemeContext.jsx
  hooks/
  services/
    firebase/
    habits/
    dailyLogs/
    challenges/
  utils/
  styles/
  main.jsx
```

The structure may be adjusted as the project grows. Avoid creating empty folders for features that are not yet being built.

Current application routes: `/` (Dashboard), `/habits` (My Habits), `/habits/new` (New habit), `/habits/:habitId/edit` (Edit habit), `/daily-tracker`, `/calendar`, `/challenges`, `/analytics`, `/settings`, and `*` (Not found).

## 4. Separation of responsibilities

- Pages compose feature components.
- Components render UI and emit user actions.
- Hooks manage reusable UI state and subscriptions.
- Service modules perform Firebase reads and writes.
- Utility/domain modules calculate dates, streaks, and completion rates.
- Firebase configuration is initialized in one place.
- Do not put Firestore queries directly into many unrelated components.

## 5. Firebase configuration

Use environment variables for Firebase web-app configuration, for example `VITE_FIREBASE_API_KEY` and other required `VITE_FIREBASE_*` values.

Important: Vite environment variables are included in the client bundle. Firebase web configuration is not a substitute for security. Protect data using Authentication and Firestore Security Rules. Never place service-account private keys or Admin SDK credentials in frontend environment variables.

Commit an `.env.example` containing placeholder values only. Add real `.env` files to `.gitignore`.

## 6. Authentication and data access

Although the first audience is one person, enable Firebase Authentication before connecting private Firestore data. This avoids building an insecure unauthenticated data model that must later be replaced.

The first release may use email/password sign-in and restrict account creation operationally. Public self-registration can be enabled later after testing onboarding and abuse controls.

## 7. Data ownership

Store user data beneath `users/{uid}/...`. Every read and write must be scoped to the authenticated user's UID. Security Rules must verify that `request.auth.uid` matches the path UID.

## 8. Date and time handling

- Store a user's IANA time-zone identifier in their profile (for example, `Asia/Kolkata`).
- Store daily record IDs using a local date key in `YYYY-MM-DD` format.
- Store timestamps for audit/creation/update fields as Firestore timestamps.
- Do not derive a user's local day by blindly calling `toISOString().slice(0, 10)`, because UTC can differ from local date.
- Centralize date conversion and test midnight/time-zone boundaries.

## 9. Cost and performance

- Prefer queries scoped to the current user and required date range.
- Avoid subscribing to large collections when a small date range is sufficient.
- Paginate history where needed.
- Avoid duplicate reads caused by component remounts.
- Review Firestore usage and pricing before enabling paid features.
- Do not assume the free tier is unlimited; check current Firebase plan limits before deployment.

## 10. Future expansion

When public multi-user support is introduced:
- Enable controlled registration.
- Add account recovery and verification as needed.
- Review Firestore rules and indexes.
- Add data export/deletion workflows.
- Consider Cloud Functions only when trusted server-side logic is genuinely required.
