# Architecture

## Request flow

```
Browser
  ├── /, /css/*, /js/*, /assets/* ──> Worker Assets
  └── /api/* ──────────────────────> Worker API ──> D1
                                           └──────> Turnstile
```

The static book shell does not depend on a successful API request. It renders first, then hydrates the reading page.

## API

- `GET /api/health`
- `GET /api/health/db`
- `GET /api/entries?limit=10&cursor=...`
- `POST /api/entries`

Entry creation requires a valid Turnstile token, a valid honeypot field, short-window rate limiting, and the per-fingerprint daily limit.

## Data

Entry timestamps use integer epoch milliseconds. This avoids the timezone/string comparison problems present in the legacy implementation.

Moderation status is present from day one so hidden/deleted entries can be introduced without another schema redesign.

## Failure isolation

- API failure leaves the static book shell visible.
- Reading failure affects only the reading area.
- Turnstile is lazy-loaded only when the signing form is interacted with.
- Entry rendering uses textContent rather than HTML interpolation.
