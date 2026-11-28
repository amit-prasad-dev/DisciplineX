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
At the start of Phase 5, check whether a newer `firebase` `13.x` patch resolves the `@grpc/grpc-js` advisory (`npm audit --omit=dev`), and after Firestore is first imported verify that the production bundle (`dist/`) contains no gRPC code.

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
    auth/
      authController.js
      authGate.js
      authLogic.js
      ConfigErrorPage.jsx
      NoAccessPage.jsx
      SignInPage.jsx
    dashboard/
    habits/
      components/
    dailyTracking/
    calendar/
    challenges/
    analytics/
    settings/
  context/
    AuthContext.jsx
    HabitsContext.jsx   # temporary in-memory store in Phases 3-4; Firestore-backed in Phase 5
    ThemeContext.jsx
  hooks/
    useAuth.js
    useHabits.js
    useTheme.js
  services/
    firebase/
      firebaseApp.js
      firebaseAuth.js
      firebaseConfig.js
      firestoreDb.js
      ownerConfig.js
    habits/
    profile/
    dailyLogs/
    challenges/
  utils/
  styles/
  main.jsx
tests/
  rules/
    firestore.rules.test.js   # excluded from default npm test via vite.config.js
```

The structure may be adjusted as the project grows. Avoid creating empty folders for features that are not yet being built.

Current application routes: `/sign-in` (outside `AppShell`), `/` (Dashboard), `/habits` (My Habits), `/habits/new` (New habit), `/habits/:habitId/edit` (Edit habit), `/daily-tracker`, `/calendar`, `/challenges`, `/analytics`, `/settings`, and `*` (Not found).

## 4. Separation of responsibilities

- Pages compose feature components.
- Components render UI and emit user actions.
- Hooks manage reusable UI state and subscriptions.
- Service modules perform Firebase reads and writes.
- Utility/domain modules calculate dates, streaks, and completion rates.
- Firebase configuration is initialized in one place.
- Firestore access uses one shared accessor (`src/services/firebase/firestoreDb.js`) configured with Firestore's default memory cache (no persistent local cache) and contains no business rules in service modules; services map between pure SDK-free domain objects and Firestore documents (`id` set from `docSnap.id` on read, not stored inside the document).
- Do not put Firestore queries directly into many unrelated components.

## 4b. Async habits & profile contract (Phase 5)

- On entering `ownerSignedIn`, `ensureProfile` initializes `users/{uid}/profile/main` if missing using `runTransaction` (read inside transaction, write only when missing; on `permission-denied` or aborted transaction, re-read once).
- `HabitsProvider` loads `users/{uid}/habits` once via `getDocs` (no `onSnapshot` listeners), ordered by `createdAt` ascending with ties broken by `id`.
- Initial loading renders `LoadingState`; after about 10 seconds a subtle `"Still loading… check your connection"` note appears; errors show a neutral message with a `Retry` button, and requests are never cancelled automatically.
- Malformed stored habit documents do not fail the whole load and are never overwritten or auto-fixed; valid habits load alongside a persistent neutral notice (`"N saved habit(s) couldn't be read and are hidden"`) listing document IDs only.
- Habit store actions (`createHabit`, `updateHabit`, `updateHabitDetails`, `updateHabitScheduleOrTarget`, `updateHabitDates`, `archiveHabit`, `restoreHabit`) return `Promise`s, validate synchronously through the domain layer first (including the app-side `100`-habit limit in `createHabitInList`), write the full habit document atomically with `setDoc`, and update React state only after the write succeeds (no optimistic updates).
- Failed or unconfirmed saves leave typed form inputs intact and show `"Couldn't confirm the save. Check your connection; reload to see what was saved."` inline in the form, or in a dismissible `role="alert"` banner on `HabitsPage` for archive/restore failures (with the triggering action button disabled while pending).
- Late async results arriving after sign-out or unmount are ignored and never mutate React state.

## 5. Firebase configuration

Use environment variables for Firebase web-app configuration, for example `VITE_FIREBASE_API_KEY` and other required `VITE_FIREBASE_*` values.

Important: Because this GitHub repository is public and Vite environment variables are included in the client bundle, Firebase web configuration (`VITE_FIREBASE_*`) is public by design and is not a secret. Security comes from Authentication and Firestore Security Rules. Never commit `.env` or `.env.local` files, personal email addresses, service-account keys, or any private keys, and add `.firebase/` to `.gitignore` when Firebase CLI files appear. `firebase.json` and `.firebaserc` may be committed (the project ID is not a secret).

Commit an `.env.example` containing placeholder values only. Add real `.env` files (`.env`, `.env.local`, `.env.*`) to `.gitignore`.

## 6. Authentication and data access

Although the first audience is one person, enable Firebase Authentication before connecting private Firestore data. Phase 4 adds sign-in/sign-out, a dedicated `/sign-in` route gating all app routes, and `firestore.rules`; Phase 5 connects `profile` and `habits` to Cloud Firestore with no offline support and Firestore's default memory cache (no persistent local cache). Nothing is persisted on disk after sign-out; the SDK's in-memory cache lives only for the page session (acceptable for the MVP because only the owner can sign in and security rules deny everyone else). For a future public multi-user release, terminate the Firestore instance or reload the page on sign-out.

The MVP uses **Google sign-in only** (`signInWithPopup`). Email/password sign-in, password reset, email-verification screens, Cloud Functions, and Identity Platform upgrades (blocking functions) are out of MVP scope. For client-side UX, the app compares the signed-in user's UID with `VITE_OWNER_UID` from `.env.local` (UX-only; `firestore.rules` is the real security boundary) and shows a neutral `"This account doesn't have access yet"` screen with a `"Sign out"` button (loading no data) when non-allowlisted. Public multi-user access can be enabled later after removing the temporary personal-use UID allowlist and reviewing onboarding and abuse controls.

## 7. Data ownership

Store user data beneath `users/{uid}/...`. Every read and write must be scoped to the authenticated user's UID. Security Rules must verify `request.auth.uid == uid`, restrict access to the allowlisted owner Firebase UID (obtained from the Firebase Console after the first Google sign-in), and default-deny everywhere else. Note that the allowlisted UID in `firestore.rules` must be updated if that owner user account is ever deleted and re-created, and this temporary personal-use allowlist must be removed or replaced before any public multi-user release.

## 8. Date and time handling

- Store a user's IANA time-zone identifier in their profile (for example, `Asia/Kolkata`).
- Store daily record IDs using a local date key in `YYYY-MM-DD` format.
- Store `createdAt` and `updatedAt` audit fields as client-generated ISO 8601 strings (not Firestore `Timestamp` or `serverTimestamp`); they are audit fields only and are never used in business rules.
- Do not derive a user's local day by blindly calling `toISOString().slice(0, 10)`, because UTC can differ from local date.
- Centralize date conversion and test midnight/time-zone boundaries.

## 9. Cost and performance

- Prefer queries scoped to the current user and required date range.
- Avoid subscribing to large collections when a small date range is sufficient.
- Paginate history where needed.
- Avoid duplicate reads caused by component remounts.
- Review Firestore usage and pricing before enabling paid features.
- Do not assume the free tier is unlimited; check current Firebase plan limits before deployment.
- Stay on the free Firebase Spark plan. Do not upgrade to Blaze or attach a billing card unless a required feature forces it and only after explicit owner approval.

## 10. Future expansion

When public multi-user support is introduced:
- Remove or replace the temporary personal-use owner UID allowlist in Firestore Security Rules.
- Terminate the Firestore instance or reload the page on sign-out so the SDK's in-memory cache does not outlive a user session.
- Enable controlled registration.
- Add account recovery and verification as needed.
- Review Firestore rules and indexes.
- Add data export/deletion workflows.
- Consider Cloud Functions only when trusted server-side logic is genuinely required (out of MVP scope on the Spark plan).
