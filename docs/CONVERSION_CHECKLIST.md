# PHP → Worker Conversion Checklist

This is the implementation gate for replacing the legacy runtime.

## Frontend

- [x] Static HTML shell exists
- [x] CSS separated from markup
- [x] Browser JavaScript split by responsibility
- [x] API client isolated
- [x] Loading state isolated
- [x] Retry state isolated
- [x] Signing form isolated
- [x] Turnstile lazy loading
- [ ] Original visual design pass
- [ ] Final book/page-turn interaction
- [ ] Accessibility audit
- [ ] Mobile performance audit

## Backend

- [x] Worker entrypoint
- [x] API routing boundary
- [x] D1 binding contract
- [x] D1 migration
- [x] Health endpoint
- [x] Database health endpoint
- [x] Entry list endpoint
- [x] Entry create endpoint
- [x] Cursor pagination
- [x] Turnstile server verification
- [x] Honeypot
- [x] Visitor fingerprint
- [x] Short-window rate limit
- [x] Per-fingerprint daily limit
- [x] Moderation status schema
- [x] Moderation API boundary
- [ ] Authenticated moderation
- [ ] Audit trail
- [ ] Export/import tooling
- [ ] CSP/security headers
- [ ] Production origin configuration

## Data migration

- [ ] Determine authoritative legacy dataset
- [ ] Export legacy entries
- [ ] Deduplicate/clean entries
- [ ] Map timestamps to epoch milliseconds
- [ ] Import into D1
- [ ] Verify row counts
- [ ] Verify visible/hidden/deleted semantics
- [ ] Keep legacy source untouched until verification

## Cutover

- [ ] D1 production migration applied
- [ ] Worker deployed
- [ ] Read-only smoke test
- [ ] Invalid Turnstile smoke test
- [ ] Valid Turnstile smoke test
- [ ] Daily limit smoke test
- [ ] Moderation smoke test
- [ ] Enable production writes
- [ ] Disable legacy writes
- [ ] Retain rollback window
- [ ] Remove legacy runtime only after rollback window
