# Carrd native embed

The guestbook can be embedded directly into the Honk Tavern Carrd page without an iframe.

The current FC site is published at `https://honktavern.crd.co`.

## Carrd Embed element

Add an **Embed** element where the guestbook should appear.

Use **Type: Code**, **Style: Inline**, and place the following in the code field:

```html
<div data-honk-tavern-guestbook></div>
<script
  src="https://honktavern-guestbook.muddles-net.workers.dev/embed.js"
  defer
></script>
```

The loader supplies the maintained guestbook HTML and scoped CSS from the Worker, then initializes the existing frontend application.

Do not paste the full guestbook HTML/CSS into Carrd. This keeps future visual hotfixes in the repository instead of requiring the Carrd page to be edited for every change.

## Deployment requirement

The Worker must be deployed after changes to the native embed or CORS configuration.

The Worker origin is:

- `https://honktavern-guestbook.muddles-net.workers.dev`

`ALLOWED_ORIGIN` is configured for:

- `https://honktavern.crd.co`
- `https://honktavern-guestbook.muddles-net.workers.dev`

The second origin preserves direct use of the Worker-hosted guestbook.

## Admin authentication

The native embed uses credentialed cross-origin API requests. The admin session cookie is therefore configured for secure cross-site use, and the Worker only permits configured origins.

## Visual behavior

The widget remains artwork-relative to the 1670×941 book artwork. Carrd controls the width of the surrounding embed/container; the guestbook maintains the artwork aspect ratio internally.
