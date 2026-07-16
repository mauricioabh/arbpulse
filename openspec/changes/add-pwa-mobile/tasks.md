## 1. Icons

- [x] 1.1 Finalize the ArbPulse master icon and derive `icon-192.png`,
      `icon-512.png`, `icon-maskable-512.png` (glyph within ~80% safe zone), and
      `apple-touch-icon.png` (180px)
- [x] 1.2 Place all icons under `web/public/`

## 2. Manifest

- [x] 2.1 Create `web/public/manifest.webmanifest` with `name`, `short_name`,
      `start_url: "/"`, `scope: "/"`, `display: "standalone"`,
      `theme_color`/`background_color` `#0a0e14`, and icon entries (192, 512, and
      512 maskable with `"purpose": "maskable"`)

## 3. HTML head metadata

- [x] 3.1 In `web/index.html`, add `viewport-fit=cover` to the viewport meta and a
      `theme-color` meta (`#0a0e14`)
- [x] 3.2 Add `<link rel="manifest">`, `<link rel="apple-touch-icon">`, and the
      `apple-mobile-web-app-capable` / `apple-mobile-web-app-status-bar-style` /
      `apple-mobile-web-app-title` tags

## 4. Responsive layout

- [x] 4.1 `PriceMatrix.tsx`: render per-venue stacked cards (exchange + bid/ask/qty/
      spread as label–value rows) below `sm`; keep the `<table>` from `sm` up, with
      no horizontal overflow on phones
- [x] 4.2 `StatsBar.tsx`: reflow stats and badges on mobile without clipping
- [x] 4.3 Ensure touch targets in `Controls.tsx` and `ConfigPanel.tsx` are ~44px min
- [x] 4.4 Sanity-check `App.tsx` spacing/padding on narrow viewports

## 5. Verify

- [x] 5.1 `npm run typecheck` and `npm test` pass
- [x] 5.2 `npm run build` succeeds and `web/dist` contains the manifest + icons
- [x] 5.3 DevTools device emulation: no horizontal overflow at ~375px; Application →
      Manifest shows no errors; confirm no service worker is registered
- [ ] 5.4 After `dev → PR → main → deploy.sh`, install on a real phone from
      `https://arbpulse.wayool.com` and confirm standalone launch + live SSE data
