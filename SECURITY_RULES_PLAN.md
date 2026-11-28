# Security Rules Plan — DisciplineX

## 1. Security baseline

Firebase client configuration is not a security boundary. Firestore Security Rules must enforce ownership.

Before any private user data is stored in Firestore:
- Enable Firebase Authentication.
- Require a signed-in user for all private reads and writes.
- Scope every record beneath `users/{uid}`.
- Verify `request.auth.uid == uid` in rules.
- For the temporary personal-use MVP, also restrict access in `firestore.rules` to the allowlisted owner Firebase UID (obtained from the Firebase Console after the first Google sign-in; updated if the owner account is ever deleted and re-created). Remove or replace this temporary allowlist before any public multi-user release.
- Deny access by default.

## 2. Ownership model

A signed-in user may access only:
`users/{their-auth-uid}/...`

A user must never be able to supply another UID and read or modify that user's data.

## 3. Validation

Rules should validate, as appropriate:
- Required fields and allowed field names (`schemaVersion == 1`; habit documents do not include an `id` field).
- Allowed enum values (`category`, `status`).
- Field types (`YYYY-MM-DD` date-key format where applicable).
- String and array size limits (`1 <= versions.size() <= 400` on habits; note rules cannot iterate over every element of `versions`, so per-version item validation stays in the app/domain layer, and the `100`-habit-per-user cap is app-side only since rules cannot count documents).
- Numeric values and positive durations.
- Immutable ownership/path identity (`createdAt` immutable after creation).
- Client-generated ISO 8601 `createdAt`/`updatedAt` audit strings.

Habit deletion is denied in `firestore.rules` (`allow delete: if false;` — habits are archived, never deleted; documents created during development can only be deleted in the Firebase Console). Phase 5 rules validation and emulator tests must be updated and deployed before the app begins writing to Firestore.

Client-side validation improves usability but does not replace server-enforced rules.

## 4. Authentication

Initial private release:
- Use Firebase Authentication with **Google sign-in only** (`signInWithPopup`; no email/password, password reset, or email-verification screens in MVP).
- Enforce personal-use access in `firestore.rules` via the allowlisted owner Firebase UID (no Cloud Functions and no Identity Platform blocking functions).
- Compare `user.uid` against `VITE_OWNER_UID` (`.env.local`) for client-side UX only (`firestore.rules` remains the real security boundary), showing a neutral `"This account doesn't have access yet"` page with a `"Sign out"` button and loading no data when non-allowlisted.
- Do not hard-code credentials.
- Provide sign-out (`AuthProvider` / `HabitsProvider` unmount clears app state; Firestore uses its default memory cache with no persistent disk cache so nothing remains on disk, while the SDK's in-memory cache lives only for the page session — acceptable for the owner-only MVP).
- Handle expired sessions and authentication errors.

Future public release:
- Remove or replace the temporary owner UID allowlist in Security Rules.
- Terminate the Firestore instance or reload the page on sign-out so the SDK's in-memory cache cannot carry across users.
- Add a tested registration and account recovery flow.
- Consider email verification and abuse protections.
- Add account deletion and data export processes.

## 5. Secrets and configuration

- This repository is public: never commit `.env` or `.env.local` files, personal email addresses, service-account keys, or any private keys.
- Add `.firebase/` to `.gitignore` when Firebase CLI files appear. `firebase.json` and `.firebaserc` may be committed (the project ID is not a secret).
- Firebase web config (`VITE_FIREBASE_*`) is public by design and is not a secret; security is enforced by Authentication and Firestore Security Rules.
- Commit only `.env.example` placeholders.
- Never put Firebase Admin SDK service-account keys in the browser.
- Never expose privileged server credentials in `VITE_*` variables.

## 6. Testing

Run automated rules tests against the local Firestore emulator using `@firebase/rules-unit-testing` via a separate script (`npm run test:rules`) so plain `npm test` never requires Java or the emulator (requires Java JDK 11+ baseline, or Java 21+ for current Cloud Firestore emulator releases — re-check the current Firebase docs when installing). Validate `firestore.rules` before deploying with `npm run check:rules` (and deploy via `npm run deploy:rules`).

Before deployment, test:
- Unauthenticated read is denied.
- Unauthenticated write is denied.
- Signed-in user whose UID is not the allowlisted owner UID is denied.
- User A cannot read User B's data.
- User A cannot create data under User B's path.
- Invalid document shapes are rejected and habit document deletion (`deleteDoc`) is denied (Phase 5 rules tests update Phase 4's dummy payloads to valid schemas).
- Valid owner operations succeed.

## 7. Deployment gate

Do not deploy a Firestore-backed application with open rules such as `allow read, write: if true`. Do not use temporary test-mode rules in production.

Before public deployment (Phase 10):
- Add the deployed domain(s) to Firebase Authentication Authorized Domains (`localhost` is allowed by default).
- Restrict the Firebase web API key to the app's domains in Google Cloud Console.
