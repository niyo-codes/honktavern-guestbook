# Rollout

## Stage 0 — Foundation

- Worker API skeleton
- D1 baseline migration
- versioned D1 migration workflow
- server-side Turnstile verification
- salted visitor fingerprint
- short-window request limiting
- one-entry-per-24-hours rule (temporarily disabled in sample-data mode)
- moderation-ready state
- cursor pagination
- health endpoints

### Database gate

Before production writes are enabled:

1. confirm the D1 database name and ID in `wrangler.toml`;
2. inspect pending migrations with `npx wrangler d1 migrations list DB --remote`;
3. apply them with `npx wrangler d1 migrations apply DB --remote`;
4. verify the migration list and database health endpoint;
5. perform a read-only API smoke test;
6. only then enable signing.

Never edit an applied migration. New schema changes must be appended as new numbered migrations. See `docs/DATABASE.md`.

## Stage 1 — Book shell

- responsive two-page layout
- static-first loading sequence
- loading skeleton
- empty state
- retry-safe API state
- mobile one-page fallback
- keyboard/focus-friendly controls

## Stage 2 — Signing

Next work:

- configure production Turnstile site key
- preserve drafts during failed submissions
- improve verification lifecycle
- submission success animation
- rate-limit-specific UI
- prepend a successful entry without a full reload

## Stage 3 — Browsing

- polished page-turn animation
- previous/next controls
- page numbers
- refresh state

## Stage 4 — Moderation

- authenticated moderation API
- hide/unhide
- delete/restore
- abuse-event view
- audit trail
- export

## Stage 5 — Production hardening

- Worker integration tests against a test D1
- narrow production CORS
- CSP
- error/abuse telemetry
- backup/export
- retention policy
- deployment smoke tests
- accessibility and mobile performance review

## Legacy cutover

Keep the PHP implementation read-only until the D1 import is verified. Once the Worker read/write path is confirmed in production, disable legacy writes, retain a short rollback window, then remove legacy persistence.
