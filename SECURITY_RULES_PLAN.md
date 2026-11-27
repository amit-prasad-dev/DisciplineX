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
- Required fields and allowed field names.
- Allowed enum values.
- Field types.
- String and array size limits.
- Numeric values and positive durations.
- Immutable ownership/path identity.
- Creation/update timestamps where practical.

Client-side validation improves usability but does not replace server-enforced rules.

## 4. Authentication

Initial private release:
- Use Firebase Authentication with **Google sign-in only** (`signInWithPopup`; no email/password, password reset, or email-verification screens in MVP).
- Enforce personal-use access in `firestore.rules` via the allowlisted owner Firebase UID (no Cloud Functions and no Identity Platform blocking functions).
- Compare `user.uid` against `VITE_OWNER_UID` (`.env.local`) for client-side UX only (`firestore.rules` remains the real security boundary), showing a neutral `"This account doesn't have access yet"` page with a `"Sign out"` button and loading no data when non-allowlisted.
- Do not hard-code credentials.
- Provide sign-out and clear in-memory client state (including Phase 3 habits) on sign-out so one user's data never stays visible to the next sign-in.
- Handle expired sessions and authentication errors.

Future public release:
- Remove or replace the temporary owner UID allowlist in Security Rules.
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

Run automated rules tests against the local Firestore emulator using `@firebase/rules-unit-testing` via a separate script (`npm run test:rules`) so plain `npm test` never requires Java or the emulator (check the required Java version in current Firebase docs when setting up).

Before deployment, test:
- Unauthenticated read is denied.
- Unauthenticated write is denied.
- Signed-in user whose UID is not the allowlisted owner UID is denied.
- User A cannot read User B's data.
- User A cannot create data under User B's path.
- Invalid document shapes are rejected.
- Valid owner operations succeed.

## 7. Deployment gate

Do not deploy a Firestore-backed application with open rules such as `allow read, write: if true`. Do not use temporary test-mode rules in production.

Before public deployment (Phase 10):
- Add the deployed domain(s) to Firebase Authentication Authorized Domains (`localhost` is allowed by default).
- Restrict the Firebase web API key to the app's domains in Google Cloud Console.
