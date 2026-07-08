# Complyra

Complyra is a SaaS platform that generates EU AI Act compliance documentation.
Next.js 14 App Router, TypeScript, Tailwind CSS, Firebase (Auth + Firestore),
deployed on Vercel.

## Architecture rules

- **All brand and product constants live in `src/config/site.ts`.** App name,
  tagline, colors, pricing plans, contact email, social links, and legal
  copy are read from there — never hardcode these values elsewhere. This
  module is designed to be reused across future projects, so it must stay
  the single source of truth. Tailwind's theme (`tailwind.config.ts`) reads
  its brand colors from this same file.
- **The UI language is English.** All copy, metadata, and error messages are
  written in English (`siteConfig.locale` / `siteConfig.language`).
- **Every page shows the legal disclaimer banner**, rendered once in the
  root layout (`src/app/layout.tsx`) via `<LegalDisclaimerBanner />`. The
  root layout is otherwise deliberately empty — no header/footer/nav — so
  that marketing, auth, and app screens can each have their own shell
  without every page carrying marketing chrome. Do not add a layout that
  skips the root layout, since that's the only place the banner lives.
- **SEO metadata is built through `constructMetadata()`** in
  `src/lib/construct-metadata.ts`. Every page exports `metadata` from that
  helper instead of hand-writing a `Metadata` object.
- **Route groups, each with its own shell**: `(marketing)` (header + footer)
  holds public pages (home, pricing, about, blog); `(auth)` (centered card,
  logo only) holds login, register, reset-password, and the invite-accept
  page; `(app)` holds authenticated pages (onboarding, dashboard) behind a
  minimal top bar with sign-out. All three sit under the same root layout,
  so the disclaimer banner still appears everywhere.
- **Firebase has two strictly separate layers.** `src/lib/firebase/client.ts`
  is the browser SDK for Client Components — read-mostly, never used for
  sensitive writes. `src/lib/firebase/admin.ts` is the Admin SDK, guarded by
  the `server-only` package so it fails the build if ever imported into a
  client bundle. **Every sensitive operation — document generation,
  subscription/plan changes, usage-counter updates, audit logging — must go
  through the Admin SDK in a Route Handler or Server Action. The client
  never writes directly to these fields**; Firestore rules (`firestore.rules`)
  enforce this at the database level as a second layer, not the only one.
- **All Firestore collection names, paths, and document shapes live in
  `src/lib/firestore/schema.ts`.** Use `COLLECTIONS` and `firestorePaths`
  instead of writing collection name strings by hand. This module is
  designed to be reused across future projects.
- **Firestore security rules** live in `firestore.rules` (deploy with
  `npm run firebase:deploy:rules`, which requires the Firebase CLI logged
  in and a linked project via `firebase use`). Roles are `owner`, `member`,
  and `platform_admin` (see `OrgRole` in the schema module): members get
  read-only access to their organization's data, owners get read/write,
  platform admins get read access to everything. The `auditLog`
  subcollection and the organization's `subscription`/`usage` fields can
  never be written by the client — only the Admin SDK, which bypasses rules.
- **Auth session model**: Firebase Auth runs client-side (email/password and
  Google). After sign-in, the client POSTs the ID token to
  `/api/auth/session`, which mints an httpOnly session cookie via the Admin
  SDK (`createSessionCookie`) — this is what the server trusts, never a raw
  ID token. `src/middleware.ts` only checks cookie *presence* (it runs on
  the Edge runtime, which can't load the Admin SDK) and exists purely to
  redirect fast; the **authoritative** check is `getCurrentUser()`
  (`src/lib/auth/current-user.ts`, wrapped in React's `cache()`), which
  verifies the cookie via `getAdminAuth().verifySessionCookie()`. It's
  called in `(app)/layout.tsx` to guard every page under `(app)`, and must
  be called at the top of any new protected API route too.
- **One organization per user.** `UserDoc.organizationId` is a single field,
  not a list — accepting a team invite overwrites it, it doesn't add to it.
  A user with no `UserDoc` yet (Auth account exists, Firestore doc doesn't)
  is mid-onboarding; route them to `/onboarding`, not `/dashboard`.
- **Invites are fully server-only** (`firestore.rules`: `allow read, write:
  if false` on the `invites` subcollection) — created by
  `/api/team/invite` (owner-only) and consumed by
  `/api/invites/[token]/accept`, both via the Admin SDK. They're looked up
  by a random `token` field via a `collectionGroup` query, not by document
  ID or by nesting under a known org, since the invite link only carries
  the token. This requires the `COLLECTION_GROUP`-scoped field override on
  `token` in `firestore.indexes.json` — Firestore's automatic indexing only
  covers `COLLECTION` scope by default, so this override is load-bearing,
  not optional.
- **Firebase Auth error codes never reach the UI.** Always resolve errors
  through `resolveErrorMessage()` / `getAuthErrorMessage()` in
  `src/lib/firebase/auth-errors.ts` before displaying them.
- **Environment variables** are documented in `.env.example` (committed,
  placeholders only). Real secrets go in `.env.local`, which is gitignored
  and must never be committed.
- Tasks are completed without stopping to ask for confirmation on routine,
  reversible steps — only pause for genuinely destructive or ambiguous
  decisions.
