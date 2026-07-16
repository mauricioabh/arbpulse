## Why

The Arb Pulse dashboard is desktop-first: the 3-column grid collapses acceptably on
narrow screens, but the order-book table overflows horizontally and there is no
mobile/PWA metadata. We want to demo and monitor the engine from a phone —
installable to the home screen, full-window, and touch-friendly — while the app
runs 24/7 on the VPS behind HTTPS (`arbpulse.wayool.com`).

## What Changes

- Make the dashboard fully responsive on phones (~360–430px): stack the
  `PriceMatrix` order book as per-venue cards below `sm`, reflow the `StatsBar`
  badges, and ensure touch targets are at least ~44px in `Controls`/`ConfigPanel`.
- Add a Web App Manifest (`web/public/manifest.webmanifest`) so the dashboard is
  installable to the home screen (name/short_name, `start_url`, `display: standalone`,
  theme/background color, icons).
- Add ArbPulse app icons (192, 512, a maskable variant, and a 180px
  `apple-touch-icon`) under `web/public/`.
- Add mobile/install metadata to `web/index.html`: `theme-color`,
  `apple-mobile-web-app-*`, `viewport-fit=cover`, and links to the manifest and
  apple-touch-icon.
- **No service worker and no offline support.** The app is real-time (SSE); it must
  never serve cached/stale market data. Installability comes from the manifest +
  HTTPS (menu / "Add to Home Screen"), not from a cached shell. When disconnected
  the UI shows its existing "reconnecting/offline" state, never fake data.

## Capabilities

### New Capabilities
- `pwa`: installability and mobile-web behavior of the dashboard — how the app is
  installable to the home screen via manifest + HTTPS with no service worker, how
  it stays responsive on small screens, and the explicit no-offline / no-stale-data
  guarantee for this real-time app.

### Modified Capabilities
<!-- None: responsiveness and install metadata are new behavior; no existing spec's requirements change. -->

## Impact

- Frontend: `web/index.html` (head metadata), `web/public/` (new manifest + icons),
  `web/src/components/PriceMatrix.tsx` and `StatsBar.tsx` (responsive layout),
  minor touch-target tweaks in `Controls.tsx`/`ConfigPanel.tsx`.
- Build/serve: none — `npm run build` copies `web/public/` into `web/dist`, already
  served by Express static; the Docker image bakes it in. No new deploy steps.
- Dependencies: none added (no `vite-plugin-pwa`/Workbox, since there is no SW).
- Behavior: no API, wire-format, or engine changes. Desktop layout unchanged.
- Testing: verified on a real phone at `https://arbpulse.wayool.com` after the
  normal `dev → PR → main → deploy.sh` flow.
