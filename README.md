# Honk Tavern Guestbook

Cloudflare Workers + D1 rebuild of the Honk Tavern guestbook.

## Architecture

- `public/` — browser-safe static HTML, CSS, JavaScript and future assets.
- `src/worker/` — server-side Worker API.
- `migrations/` — D1 schema migrations.
- `tests/` — API and frontend test coverage.
- Legacy PHP files remain on this branch temporarily for migration/reference only.

The Worker serves `public/` directly and handles only `/api/*`.

## Development

1. Install dependencies with `npm install`.
2. Set the D1 database name and ID in `wrangler.toml`.
3. Configure secrets:
   - `wrangler secret put TURNSTILE_SECRET`
   - `wrangler secret put FINGERPRINT_SALT`
4. Apply the migration to the intended D1 database.
5. Run `npm run typecheck`.
6. Run `npm test`.
7. Run locally with `npm run dev`.

## Security model

Visitor IP addresses are never stored directly. A salted SHA-256 fingerprint is derived from the request IP and user-agent and used only for rate limiting and the daily signing rule.

Turnstile is verified server-side. The browser never receives the Turnstile secret.

## Rollout

See `docs/ARCHITECTURE.md` and `docs/ROLLOUT.md`.
