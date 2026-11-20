# Guestbook Widget Architecture

The public guestbook is a **rigid visual widget**, not a general-purpose page.

## Visual contract

- Small screens use the full available width.
- Larger screens cap the widget at 80vw.
- The widget is constrained to a practical 480px minimum height.
- The message-book skin is a fixed visual coordinate system.
- Dynamic HTML is rendered above the skin rather than changing the skin itself.
- Mobile switches between the left/sign and right/read surfaces while cropping the same book image.
- The surrounding Carrd page must not be responsible for the widget's typography, spacing, background, or layout.

## Skin asset

The widget expects `public/assets/images/message-book.jpg`.

The supplied FFXIV screenshot should be cropped to the book itself before being added. A prepared 1485x805 crop was produced during development; it is intentionally kept outside Git until the final asset decision is made.

The CSS uses `background-size: cover` so the book remains visually rigid while the viewport crops it. Mobile changes `background-position` between the reading and signing surfaces.

## Layer model

1. **Skin** — static image and decorative framing.
2. **Widget chrome** — minimal brand and hidden administration trigger.
3. **Book overlay** — dynamic signing and reading content.
4. **Interaction** — forms, pagination, Turnstile and future character identity.
5. **Admin dialog** — deliberately outside the public book surface.

This separation means the visual skin can be replaced without rewriting the API or data layer.

## Admin responsibility

The small gear control is intentionally only a UI shell at this stage. Production administration must use a server-side authenticated session; the browser must never receive an admin password or long-lived credential.

Planned admin responsibilities:

- moderation queue
- hide / restore / delete
- abuse events
- entry search
- character verification
- character refresh
- widget configuration
- export / backup controls

## Character identity

Entries should eventually support an optional verified character identity:

- Lodestone character ID
- character name
- home world
- Lodestone profile URL
- portrait/avatar URL
- verification state
- last successful refresh timestamp

The public entry should continue to work without a character identity. Verification is an enhancement, not a requirement for signing.

## Lodestone integration boundary

Do not call the Lodestone directly from browser JavaScript.

The Lodestone exposes character search and public character profiles, but there is no supported public JSON character API. Community libraries such as NetStone implement Lodestone parsing and recommend storing the Lodestone character ID for repeat lookups.

The Worker should therefore use an adapter/cache boundary:

`guestbook -> character service -> cached Lodestone data`

The adapter should:

- validate the supplied Lodestone URL/ID
- resolve the character once
- cache the resolved identity
- avoid repeatedly scraping the Lodestone
- gracefully retain the last known avatar/data if a refresh fails
- never block guestbook reading or signing on a Lodestone outage

A dedicated external Lodestone proxy/service may be required if Cloudflare Worker egress cannot reliably obtain the public profile.

## Verification model

Recommended first implementation:

1. User signs with name/message.
2. User optionally supplies a Lodestone character URL.
3. Worker validates the URL and extracts the character ID.
4. Character lookup resolves the current name/world/portrait.
5. Entry is marked pending until resolution succeeds.
6. Successful resolution stores a snapshot.
7. Public entry displays the verified character name/world and portrait.
8. Admin can unlink, refresh or manually reject the identity.

Do not treat a typed character name as proof of ownership.

## Future schema direction

Keep identity fields separate from the entry text so the guestbook remains usable without Lodestone:

- `character_id`
- `character_name`
- `character_world`
- `character_portrait_url`
- `lodestone_url`
- `character_status`
- `character_checked_at`

A separate `characters` table is preferable once multiple entries can belong to the same character.
