# Security Rules Plan — DisciplineX

## 1. Security baseline

Firebase client configuration is not a security boundary. Firestore Security Rules must enforce ownership.

Before any private user data is stored in Firestore:
- Enable Firebase Authentication.
- Require a signed-in user for all private reads and writes.
- Scope every record beneath `users/{uid}`.
- Verify `request.auth.uid == uid` in rules.
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
- Use Firebase Authentication (email/password or another selected provider).
- Restrict account creation operationally if the app is intended for one user.
- Do not hard-code credentials.
- Provide sign-out.
- Handle expired sessions and authentication errors.

Future public release:
- Add a tested registration and account recovery flow.
- Consider email verification and abuse protections.
- Add account deletion and data export processes.

## 5. Secrets and configuration

- Do not commit `.env` files containing local configuration.
- Commit only `.env.example` placeholders.
- Never put Firebase Admin SDK service-account keys in the browser.
- Never expose privileged server credentials in `VITE_*` variables.

## 6. Testing

Before deployment, test:
- Unauthenticated read is denied.
- Unauthenticated write is denied.
- User A cannot read User B's data.
- User A cannot create data under User B's path.
- Invalid document shapes are rejected.
- Valid owner operations succeed.

## 7. Deployment gate

Do not deploy a Firestore-backed application with open rules such as `allow read, write: if true`. Do not use temporary test-mode rules in production.
