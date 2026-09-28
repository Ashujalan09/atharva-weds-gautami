# Atharva weds Gautami — Wedding Invitation Site

A single-page wedding invitation for **24 & 25 November 2026, Ujjain, Madhya Pradesh**.
No build step, no dependencies — plain HTML, CSS and JavaScript.

The site opens on a "Tap to open" wax-sealed envelope, which lifts to reveal the
invitation sections.

## Structure

```
index.html                 Markup — 10 sections, the envelope intro, header and footer
css/styles.css             All styling, organised by the original section banners
js/app.core.js             Envelope intro + background-music globals
js/app.sections.js         Menu drawer, countdown, RSVP, wishes, calendar, gallery, header
js/app.effects.js          Falling petals and the custom cursor
audio/background-music.mp3 Background music (self-hosted, see below)
favicon.svg                A ✦ G wax-seal monogram in the site palette
tools/split.mjs            Reproducible tool that produced this structure
tools/cdp-shot.mjs         Loads the page in headless Chrome, clicks, reports errors, screenshots
.original/                 The original single-file version, kept as a rollback reference
```

Scripts are **classic** `<script src>` tags (not `type="module"`) loaded in order at
the end of `<body>`. This deliberately preserves the original inline behaviour, where
every block shared one global scope. Load order matters: `app.core.js` defines the
global `tryStartMusic()` that the envelope calls, so it must load first.

## Running it

Open `index.html` directly, or serve the folder:

```
npx serve .
```

Serving over HTTP is recommended. The page also renders correctly from `file://`,
because every `localStorage` access is guarded — `file://` denies storage access and
the raw calls used to throw, which silently killed the tap-to-open handler.

## Background music

> **The music file is not included in this repository.** The track used during
> development is a third-party recording, so it is deliberately excluded — see
> `.gitignore`. To enable music, drop your own file at
> `audio/background-music.mp3`. While that file is missing the browser reports a
> media error, the script catches it, and the floating music button **hides itself**,
> so the site degrades cleanly instead of showing a button that does nothing.

When present, the track starts at `TARGET_VOLUME` (0.8) with a 2-second fade-in when
the visitor opens the envelope, and the button in the bottom-right corner toggles it.

Playback speed is `MUSIC_RATE = 0.9` — the track plays 10% slower. `preservesPitch`
is left at its default `true`, so slowing the tempo does **not** also lower the pitch.
The rate is set once on the audio element and persists across pause and resume, so
there is no need to reapply it in each playback path. Both values are constants at the
top of `js/app.core.js`.

Do not point `<audio id="bgMusic">` at a remote URL: an earlier build hotlinked the
track from Pixabay, which returned **HTTP 403** because Pixabay blocks hotlinking, so
the music silently never played. Keep it local.

### Autoplay: why the music may not start by itself

Browsers only allow audio to begin from a genuine user gesture. `tryStartMusic()`
originally ended with `.catch(() => {})`, which **swallowed every failure** — so if
playback was blocked, the guest got silence with no explanation and no retry.

That is fixed. The rejection is now handled explicitly:

- On failure the button reverts to its paused state and the reason is logged.
- A **one-shot gesture fallback** is armed: the guest's next pointer, touch or key
  event anywhere on the page starts the music. It disarms itself after firing, or
  when the guest pauses the music deliberately.

So if the music does not start on the envelope tap, **tapping anywhere on the page
will start it.** That is expected behaviour, not a fault.

> Because the fallback is armed only on a failed `play()` call, there is no way to
> make the music begin with no gesture at all — that is a browser privacy rule, not
> something the page can opt out of.

Verified in-browser: `readyState: 4` (fully loaded), `duration: 53.6`, `canPlayType('audio/mpeg') = "probably"`.

## Two layout bugs fixed here

Both were inherited from the original export and are worth not reintroducing:

**The closed bottom sheets were swallowing every click.** `.bottom-sheet` sets
`display: flex`, which overrides the user-agent `[hidden] { display: none }` rule — an
author `display` always wins. So both sheets stayed in the layout, and their
full-viewport `.sheet-backdrop` (z-index 900) sat invisibly over the page at
`opacity: 0` while still capturing clicks. The music button and everything else
beneath it were unclickable. Fixed with `.bottom-sheet[hidden] { display: none; }`.

**The music button could pause but never resume.** `tryStartMusic()` starts with
`if (musicStarted) return;`, but the pause path never cleared that flag, so once
paused the flag stayed `true` and the button was dead. Pausing now clears the flag
through a shared `pauseMusic()` helper, and returning to the tab restores the volume
before playing (the fade left it at 0, so it used to resume silently).

## Favicon

`favicon.svg` is the invitation's own `A ✦ G` wax-seal monogram — maroon disc, gold
ring and dashed inner border, gold monogram. SVG keeps it crisp at any size with no
raster assets. The monogram uses a *solid* gold rather than the ring's gradient,
because the gradient's dark stop lost contrast against the wax at 16px.

Linked with `<link rel="icon" type="image/svg+xml">` (all modern browsers) and
`<link rel="apple-touch-icon">` for iOS home-screen bookmarks. Browsers that don't
support SVG icons will request `/favicon.ico` and log a harmless 404.

## Sections

`hero` · `countdown` · `invitation` · `couple` · `events` · `venue` · `rsvp` ·
`wishes` · `gallery` · `no-gifts`

## Removed on purpose

**The sticky RSVP bar was deleted deliberately** — its markup, styles and script have
all been removed. Only the unrelated `.site-header` keeps `position: sticky`. Do not
re-add it.

## Maps / directions links

All three "Get Directions" links carry `data-directions` and are rewritten at runtime by
the `MAPS / DIRECTIONS` block in `js/app.sections.js`, which also picks the right
provider for the device.

The original links were `https://maps.google.com/?q=...`, the **legacy search form**.
That cannot produce a route, which is why "Get Directions" never behaved like
directions. They are now proper Maps URLs:

- **Non-iOS** — `https://www.google.com/maps/dir/?api=1&destination=…&travelmode=driving`
- **iOS** — `https://maps.apple.com/?daddr=…&dirflg=d`, because Google Maps is often
  not installed on iOS and a `google.com` link would not open a native app

`origin` is deliberately omitted in both, so Maps defaults to the user's own location
as the starting point. The destination uses `name, address` rather than the bare venue
name, per Google's guidance, so the pin resolves to the exact place even if the name
is not unique.

### Making the venue more precise

The destination is a street address, not coordinates. If you can get the venue's
Google Maps **place ID** (or lat/long), passing it as `destination_place_id` makes the
pin exact and removes any ambiguity. The constants to change are `DESTINATION` and
`UTM` at the top of the `MAPS / DIRECTIONS` block.

## External dependencies

Loaded over the network at runtime — the site is not fully offline-capable:

- Google Fonts (Crimson Text, Mulish, Noto Serif Devanagari, Parisienne)
- Google Maps embed and directions links
