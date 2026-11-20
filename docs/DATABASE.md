# D1 database operations

This project treats the D1 schema as a versioned production contract.

## Database layout

The Worker uses one D1 binding:

- Binding: `DB`
- Configuration: `wrangler.toml`
- Migration directory: `migrations/`

The initial schema is `0001_guestbook.sql`. Subsequent changes must be new numbered migration files.

### Tables

- `entries` — public guestbook entries and their moderation state.
- `abuse_events` — short-lived abuse/rate-limit signals. It stores a salted fingerprint hash, never the raw visitor IP.
- `moderation_events` — the future moderation audit trail.

Entry timestamps are stored as integer epoch milliseconds. Do not introduce timezone-specific string columns for new code.

## Migration rules

1. **Never edit an already-applied migration.** Treat applied SQL files as immutable history.
2. **Add a new numbered migration for every schema change.**
3. **Test migrations locally before applying them remotely.**
4. **Check pending migrations before applying them to production.**
5. **Use the configured D1 binding/name rather than hard-coding a database ID into application code.**
6. **Do not run ad-hoc schema changes in the Cloudflare dashboard.** If a schema change needs to survive the next deployment, it belongs in `migrations/`.
7. **Do not delete migration files after deployment.** Wrangler uses migration history to determine what has already been applied.
8. **Prefer additive changes.** Destructive changes require an explicit migration plan, data backup/export, verification, and a rollback strategy.
9. **Do not put secrets, raw IPs, or personal data into migration SQL or fixture data.**
10. **A successful application deployment does not imply that the database schema is current.** Apply and verify migrations separately.

Cloudflare records applied D1 migrations and rolls back a failed migration while preserving the last successful migration. citeturn463778search1

## Normal workflow

### 1. Inspect the repository state

```powershell
git status
npx wrangler d1 migrations list DB --local
npx wrangler d1 migrations list DB --remote
```

Use the remote command only when the Worker is authenticated to the intended Cloudflare account.

### 2. Create a migration

Use Wrangler to allocate the next migration number:

```powershell
npx wrangler d1 migrations create DB "describe the change"
```

Write the SQL into the generated file, then review it with the code diff. Cloudflare recommends versioned migration files and provides `d1 migrations create` for this workflow. citeturn463778search1

### 3. Apply locally first

```powershell
npx wrangler d1 migrations apply DB --local
```

Run the Worker and tests against the resulting local schema before touching the remote database.

### 4. Inspect the pending remote migration set

```powershell
npx wrangler d1 migrations list DB --remote
```

Confirm the target is the intended production database and that only the expected migrations are pending.

### 5. Apply remotely

```powershell
npx wrangler d1 migrations apply DB --remote
```

The command confirms the migration set before applying it. Cloudflare also captures a backup when migrations are applied. citeturn463778search1

### 6. Verify after migration

At minimum:

```powershell
npx wrangler d1 execute DB --remote --command "SELECT name, type FROM sqlite_master WHERE type IN ('table','index') ORDER BY type, name;"
npx wrangler d1 migrations list DB --remote
```

Then verify the deployed Worker:

```text
GET /api/health
GET /api/health/db
```

For a production cutover, also perform a read-only guestbook request before enabling writes.

## Export / backup before risky changes

Before destructive or data-shaping migrations, export the remote database:

```powershell
npx wrangler d1 export DB --remote --output ./backups/guestbook-YYYYMMDD.sql
```

Keep backups outside the public/static directory and do not commit them if they contain guestbook data. Cloudflare supports remote D1 exports for this purpose. citeturn463778search8

## Rollback policy

Do not "roll back" by editing or deleting an applied migration.

For a failed migration, let D1/Wrangler preserve the previous successful migration and fix the migration before retrying. citeturn463778search1

For a migration that already succeeded but introduced a logical problem:

1. stop further writes if data integrity is at risk;
2. export/backup the affected database;
3. diagnose the affected rows;
4. create a new corrective migration;
5. test it against a representative copy/local database;
6. apply the corrective migration;
7. verify row counts, indexes and Worker health.

Application rollback and schema rollback are separate concerns. A Worker can be rolled back to a previous code revision while the D1 schema remains at its newest migration, so schema changes should be designed to remain compatible with the immediately preceding Worker version whenever practical.

## Current migration history

| Migration | Purpose |
| --- | --- |
| `0001_guestbook.sql` | Baseline guestbook, abuse-event and moderation-event schema |
| `0002_d1_query_indexes.sql` | Adds composite indexes for daily entry and abuse-rate-limit queries |

## Production rule

The production sequence is:

1. merge the migration and Worker code;
2. deploy the code only when it is compatible with the current schema;
3. apply pending D1 migrations to the intended database;
4. run database and API smoke tests;
5. enable the new behaviour.

If a future Worker requires a new column, prefer deploying code that tolerates the old schema first, then apply the migration, then enable code that requires the new column. This avoids a deploy/migration ordering race.
