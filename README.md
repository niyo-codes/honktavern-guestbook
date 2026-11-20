# Honk Tavern Guestbook

Cloudflare Workers + D1 rebuild of the Honk Tavern guestbook.

## Migration strategy

This repository is being converted from the legacy PHP implementation in stages.

The PHP runtime is deliberately retained during development as a migration/reference source. The new Worker and static frontend are being built in parallel until the complete read/write/moderation path has been verified.

## Architecture

- `public/` — browser-safe static HTML, CSS, JavaScript and future assets.
- `src/worker/` — server-side Worker API and services.
- `migrations/` — D1 schema and future migrations.
- `tests/` — API and frontend tests.
- `docs/` — architecture, rollout and PHP conversion contracts.
- Legacy PHP files — retained temporarily for comparison, export and rollback.

The Worker serves `public/` directly and owns `/api/*`.

## Runtime boundaries

Browser code must never contain secrets or direct D1 access.

The Worker owns:

- D1 access
- Turnstile server verification
- visitor fingerprinting
- abuse/rate limiting
- moderation boundaries
- future authentication/session handling

The frontend owns presentation, book interaction, form state and API communication.

## API foundation

- `GET /api/health`
- `GET /api/health/db`
- `GET /api/config`
- `GET /api/entries?limit=10&cursor=...`
- `POST /api/entries`
- `POST /api/moderation` — intentionally disabled until authentication exists
- `GET /api/moderation/status`

## Security model

Visitor IP addresses are never persisted directly. A salted SHA-256 fingerprint is derived from request metadata and used for abuse controls.

Turnstile is verified server-side. The browser only receives the public site key.

No credential fallback is committed to the Worker configuration.

## Legacy conversion

See:

- `docs/STRUCTURE.md`
- `docs/LEGACY_MAPPING.md`
- `docs/CONVERSION_CHECKLIST.md`
- `docs/ROLLOUT.md`

The target is a clean Cloudflare-native implementation, not a line-for-line PHP translation.

## Development

1. Install dependencies with `npm ci`.
2. Configure the real D1 database in `wrangler.toml`.
3. Configure the public Turnstile site key.
4. Set `TURNSTILE_SECRET` and `FINGERPRINT_SALT` as Worker secrets.
5. Apply the D1 migration.
6. Run `npm run typecheck`.
7. Run `npm test`.
8. Run `npm run dev`.

The foundation is expected to remain under active conversion until the frontend and backend contracts are complete.
