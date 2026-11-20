# Legacy PHP → Worker Conversion Map

The legacy implementation remains in the repository during migration. It is not used by the new Worker.

| Legacy | Worker replacement | Status |
| --- | --- | --- |
| index.php | public/index.html + src/worker/api/entries.ts | Foundation |
| api.php?action=list | GET /api/entries | Foundation |
| api.php?action=sign | POST /api/entries | Foundation |
| api.php?action=delete | moderation API boundary | Scaffolded |
| admin.php | future public/admin + authenticated moderation API | Planned |
| widget.php | public/index.html + modular JS/CSS | Foundation |
| db.php PostgreSQL | D1 binding | Replaced |
| guestbook.db SQLite | D1 | Migration source only |
| config.php | Wrangler vars + Cloudflare secrets | Replaced |
| PHP sessions | Worker authentication/session layer | Planned |
| filesystem rate files | D1 abuse events | Replaced |
| timezone column | browser locale formatting | Removed from persistence |

## Legacy inconsistencies

The PHP implementation contains multiple persistence models: SQLite in index.php, PostgreSQL in db.php, and a SQLite file in the repository.

The old API also expects a timezone column that the current PostgreSQL schema does not create.

The old configuration contains fallback Turnstile credentials. The Worker deliberately has no credential fallback.

The Worker therefore converts the intended behaviour rather than mechanically translating every PHP implementation detail.

## Cutover rule

Do not delete or disable the legacy PHP implementation until existing entries have been exported, imported into D1, and verified through the new read/write and moderation paths.
