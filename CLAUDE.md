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
  root layout (`src/app/layout.tsx`) via `<LegalDisclaimerBanner />`. Do not
  add page-level layouts that skip the root layout.
- **SEO metadata is built through `constructMetadata()`** in
  `src/lib/construct-metadata.ts`. Every page exports `metadata` from that
  helper instead of hand-writing a `Metadata` object.
- **Route groups**: `(marketing)` holds public pages (home, pricing, about,
  blog); `(app)` holds authenticated/product pages (dashboard and beyond).
  Both share the same root layout, header, footer, and disclaimer banner.
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
- **Environment variables** are documented in `.env.example` (committed,
  placeholders only). Real secrets go in `.env.local`, which is gitignored
  and must never be committed.
- Tasks are completed without stopping to ask for confirmation on routine,
  reversible steps — only pause for genuinely destructive or ambiguous
  decisions.
