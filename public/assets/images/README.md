# Message Book Skin

The production widget expects the final static book skin at:

`public/assets/images/message-book.jpg`

Recommended source:

- crop the supplied Message Book screenshot to the physical book
- retain the complete left and right page framing
- do not include the surrounding game HUD
- keep the image around the original 1.8:1 book aspect ratio
- use a web-optimised JPEG/WebP suitable for an embedded widget

The runtime falls back to a neutral parchment colour if the skin is absent.

The skin is presentation-only. Dynamic entries, signing controls and future character portraits are rendered by HTML above it.
