# Project Structure

~~~text
honktavern-guestbook/
├── public/
│   ├── index.html
│   ├── css/
│   ├── js/
│   │   ├── api/
│   │   ├── book/
│   │   ├── components/
│   │   └── signing/
│   └── assets/
│       ├── images/
│       ├── icons/
│       └── fonts/
├── src/
│   └── worker/
│       ├── index.ts
│       ├── config.ts
│       ├── http.ts
│       ├── api/
│       ├── services/
│       └── types/
├── migrations/
├── tests/
│   ├── api/
│   └── frontend/
├── docs/
├── wrangler.toml
├── package.json
└── tsconfig.json
~~~

## Boundary rule

Browser code may only depend on public browser-safe modules.

Worker code owns secrets, D1 access, Turnstile verification, abuse controls and future moderation authentication.

The PHP files are retained only as migration/reference material until cutover.
