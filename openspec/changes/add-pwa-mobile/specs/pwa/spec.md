## ADDED Requirements

### Requirement: Installable to the home screen
The dashboard SHALL be installable to a device home screen via a Web App Manifest
served over HTTPS, without requiring a service worker.

#### Scenario: Manifest is present and valid
- **WHEN** the dashboard is loaded over HTTPS
- **THEN** a linked `manifest.webmanifest` is served that includes `name`,
  `short_name`, `start_url` in scope, `display: standalone`, `theme_color`,
  `background_color`, and at least 192px and 512px PNG icons

#### Scenario: User installs from the browser
- **WHEN** a user chooses "Install app" / "Add to Home Screen" from the browser menu
- **THEN** the app is added with the ArbPulse icon and launches in a standalone,
  full-window mode at `start_url`

### Requirement: No offline mode and no stale data
The app SHALL NOT register a service worker and SHALL NOT cache market data, so it
never presents stale or fake data (real-time honesty rule).

#### Scenario: No service worker is registered
- **WHEN** the dashboard runs in any environment
- **THEN** no service worker is registered and no application cache stores `/api`
  responses or the SSE stream

#### Scenario: Disconnected device shows a clear non-data state
- **WHEN** the device has no working connection to the engine
- **THEN** the UI shows its reconnecting/offline indicator and does not display
  cached market figures as if they were live

### Requirement: Responsive mobile layout
The dashboard SHALL be usable on phone-sized viewports (~360–430px wide) without
horizontal overflow of primary widgets, while the desktop layout is unchanged.

#### Scenario: Order book fits a phone screen
- **WHEN** the viewport is narrower than the `sm` breakpoint
- **THEN** the order-book (`PriceMatrix`) is presented as per-venue stacked cards
  showing bid, ask, quantities, and spread without horizontal scrolling

#### Scenario: Stats and controls remain readable and tappable
- **WHEN** the dashboard is viewed on a phone
- **THEN** the stats bar reflows without clipping and interactive controls have
  touch targets of at least ~44px

#### Scenario: Desktop layout is preserved
- **WHEN** the viewport is at the `lg` breakpoint or wider
- **THEN** the existing multi-column layout and table order book render as before

### Requirement: Mobile and install metadata
The `index.html` head SHALL include the metadata needed for correct mobile rendering
and home-screen installation on Android and iOS.

#### Scenario: Head includes mobile/install tags
- **WHEN** the page is served
- **THEN** the head contains a `theme-color`, `viewport-fit=cover` in the viewport
  meta, a link to the manifest, an `apple-touch-icon`, and the
  `apple-mobile-web-app-*` tags for standalone iOS launch
