## Context

The dashboard (`web/`, React 18 + Vite 6 + Tailwind v3) is served by Express as
static files from `web/dist` (same origin as `/api` + SSE). `App.tsx` already uses a
`grid-cols-1 lg:grid-cols-3` layout, so it collapses to a single column on mobile,
but two things are missing for a good phone experience: (1) the `PriceMatrix` order
book is a 6-column `<table>` that overflows horizontally on ~360–430px screens, and
(2) there is no install/mobile metadata (manifest, theme-color, apple-touch-icon).

The app is real-time: the frontend consumes `/api/state` over SSE and shows a
`connected` badge. A domain rule (honesty) forbids ever presenting stale or fake
market data. The target runtime is the 24/7 VPS behind HTTPS at
`arbpulse.wayool.com` (nginx + certbot, Cloudflare DNS-only).

## Goals / Non-Goals

**Goals:**
- Installable to the phone home screen (standalone, branded icon).
- Responsive, touch-friendly dashboard on phones without regressing desktop.
- Zero risk of showing cached/stale market data.
- No new runtime dependencies; no change to build/deploy steps.

**Non-Goals:**
- Offline support of any kind (no cached app shell, no cached data).
- Push notifications / background sync.
- A native app or app-store packaging.
- Redesigning the dashboard; this is layout + metadata only.

## Decisions

### D1: No service worker (installable via manifest + HTTPS only)
Since Chrome 108 (mobile) / 112 (desktop), a service worker is no longer required to
install from the browser menu / "Add to Home Screen"; iOS Safari never required one.
No-op `fetch` handlers are now actively skipped and warned about by Chrome. Because
this app must never serve cached data, we ship **no service worker at all**.
- **Chosen:** manifest + icons + HTTPS → installable; SSE always fetches live data.
- **Alternatives:** `vite-plugin-pwa`/Workbox with a shell precache (rejected: its
  value is offline/precaching, which conflicts with the no-stale-data rule and adds
  a dependency); a minimal passthrough SW just to get the auto-install banner
  (rejected: Chrome ignores no-op fetch handlers, and it adds a moving part for a
  banner we don't need — manual install from the menu is sufficient).
- **Trade-off:** no automatic install prompt on Android; users install from the
  browser menu (the only path on iOS anyway). Acceptable.

### D2: PriceMatrix responsive strategy — stacked cards below `sm`
Render per-venue cards (exchange + bid/ask/qty/spread as label–value rows) on small
screens and keep the existing `<table>` from `sm` up.
- **Chosen:** Tailwind responsive classes to swap layouts (`block sm:table` pattern
  or two branches gated by breakpoint) — no JS, no `matchMedia`, purely CSS.
- **Alternative:** wrap the table in `overflow-x-auto` (rejected as primary: a
  6-column price table sideways-scrolling on a phone is poor UX for the primary
  widget; horizontal scroll can remain as a defensive fallback).

### D3: Icons derived from one master
Generate a single ArbPulse master icon (pulse line → Bitcoin "B", blue→green on
`#0a0e14`) and derive `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`
(with safe padding), and `apple-touch-icon.png` (180). Store under `web/public/` so
Vite copies them verbatim to `web/dist`.
- **theme_color/background_color:** `#0a0e14` (matches the dashboard background).

### D4: Manifest + head metadata, same-origin
`manifest.webmanifest` uses `start_url: "/"`, `scope: "/"`, `display: "standalone"`.
`index.html` adds `theme-color`, `apple-mobile-web-app-capable`,
`apple-mobile-web-app-status-bar-style`, `apple-mobile-web-app-title`,
`viewport-fit=cover` (already has `width=device-width, initial-scale=1`), and links
to the manifest + apple-touch-icon. Everything is same-origin, so no CORS/proxy
concerns and the existing Express static + SPA fallback serve it unchanged.

## Risks / Trade-offs

- [Stale data if a SW is ever added later] → Documented no-SW decision; if a SW is
  introduced in the future it MUST deny-list `/api` and never cache the SSE stream.
- [iOS quirks: no auto-prompt, status-bar/notch rendering] → Provide
  `apple-touch-icon`, `apple-mobile-web-app-*`, and `viewport-fit=cover`; verify on a
  real iPhone (Add to Home Screen), not just Android.
- [PriceMatrix layout duplication risk] → Keep a single data mapping and switch only
  presentation via breakpoints to avoid divergent desktop/mobile logic.
- [Maskable icon getting cropped] → Keep the glyph within the ~80% safe zone in the
  maskable variant.
