# Khmer Wedding Tradition Archive

A responsive oral-history archive for documenting Khmer wedding memories, traditions, ceremonies, objects, and family stories.

## Run the project

Use pnpm (the version is pinned in `package.json`) and keep `pnpm-lock.yaml` committed. Do not mix package-manager lockfiles.

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). For a production check, run:

```bash
pnpm test
pnpm build
pnpm start
```

Stop the development server before starting production on port 3000, or use `pnpm start --port 3001`. On Windows, if PowerShell blocks `pnpm.ps1`, use `pnpm.cmd` instead; changing execution policy is not necessary.

Avoid running multiple development servers against the same project directory. They can compete for the development cache and cause stale Webpack-module errors during refresh. Development output is stored in `.next-dev`; production builds use `.next`.

If the cache becomes stale, stop the running server first, then run:

```bash
pnpm clean
pnpm dev
```

The separate output directories allow `pnpm build` to run without invalidating chunks used by an active development server.

## Project structure

```text
app/
  layout.js                  Shared page shell and metadata
  page.js                    Home page and opening screen
  about/page.js              About content and two accessible credit-roll copies
  search/page.js             Search page and lightweight title/summary index
  archive/[slug]/page.js     Static archive-record pages
  archive/loading.js         Record skeleton for pending navigation

components/
  Header.js                  Header artwork, brand, and navigation
  SearchControl.js           Search entry point and shared header artwork
  HeaderVisibilityController.js
                             Header idle/scroll behavior
  LoadingScreen.js           Initial visual preload gate and start gesture
  MusicControl.js            Persistent audio player and soundtrack dialog
  PlatformClass.js           Platform-specific layout hook
  SiteBrand.js               Home link with same-page smooth scrolling
  ViewportHeightLock.js      Stable opening-screen height
  Hero.js                    Opening archive content and decorations
  DecorativeDivider.js      Reusable floral divider
  ProgressiveImage.js       Lazy image placeholder, fade-in, and fallback
  ArchiveGrid.js             Collection heading and record grid
  ArchiveCard.js             Collection record preview
  ArchiveEntry.js            Full archive record
  ArchiveBackLink.js         Search-aware return link, isolated from static record content
  ArchiveSearch.js           Live title search, keyboard navigation, and result cards
  HighlightedTitle.js        Original-spelling match highlights
  ScrollIndicator.js         Shared measured scroll indicator for music, search, and About
  RouteTransition.js        Navigation fades and the special About petal reveal
  PetalReveal.js             Shared loading/route petal artwork
  ArchiveMetadata.js         Record metadata list

data/
  archive.js                 Archive identity, defaults, entries, and lookup
  music.js                   Soundtrack playlists and page-mode mapping
  about.js                   Source links, music credits, and contact details

lib/                         Pure search matching and scrollbar geometry
tests/                       Dependency-free regression tests (`pnpm test`)

assets/                      Imported AVIF interface and decorative artwork
assets/fonts/                Self-hosted Lugrasimo and Overlock SC WOFF2 files
assets/legacy/               Replaced or unused source artwork retained for reference
assets/images/               Optimized archive photographs imported by the catalog
public/images/               Optional public URL assets for future records

scripts/
  clean-next-cache.mjs       Cross-platform generated-cache cleanup

styles/
  variables.css              Design tokens and global type scale
  base.css                   Reset, shared layout, surfaces, and typography
  header.css                 Header and navigation, including breakpoints
  loading-screen.css         Initial loading gate and reveal transition
  music.css                  Music trigger, dialog, controls, and scrolling
  opening-screen.css         Opening background, frame, hero, and decorations
  archive.css                Collection cards, records, and About credits
  search.css                 Search layout, responsive artwork, and result effects
  scroll-indicator.css       Shared gold track/thumb styling
  route-transition.css       Route fades, separate from loading-screen styling
  globals.css                Stylesheet import entry point
```

## Add or edit archive records

Edit `data/archive.js`. Shared placeholder fields live in `archiveEntryDefaults`; the record-specific catalog contains only the values that differ for each entry.

Add an `images` array only when a real image is available. Imported assets in
`assets/images/` are optimized by the Next.js image pipeline:

```js
import archive012Image from "../assets/images/archive-012.avif";

{
  id: "ARCHIVE 012",
  slug: "example-record",
  category: "Ceremony",
  title: "Example Record",
  images: [
    {
      src: archive012Image,
      alt: "A precise description of the archive photograph",
      caption: "Optional photograph caption",
      approximateDate: "Early 2000s",
    },
  ],
}
```

Records without images automatically receive an empty array and display the existing placeholder treatment.

## Loading and image behavior

The initial loading screen preloads the visual assets required for the current
desktop, tablet, or mobile layout. It reaches `100%` and enables “Click to
start” only after every required asset loads successfully. The start gesture
launches the petal reveal and starts the default soundtrack through the same
user interaction required by browser autoplay policies. Header icons are included in
this visual set; the empty-search artwork is also required when entering directly at
`/search`. When adding interface assets, update `getVisualSources()` in
`components/LoadingScreen.js` if they must be ready before reveal.

Audio is warmed up separately with a bounded wait; `100%` is not a promise that every
song has been fully downloaded. Archive photos and noncritical route content should
not be added to the initial blocking preload list.

The petal layer is independent from the fading black loading layer, allowing
the animation to finish after the opening screen appears. Reduced-motion users
receive the opening transition without the petal flight.

Archive photographs below the opening screen remain lazy-loaded. The reusable
`ProgressiveImage` component provides a lightweight placeholder, fade-in, and
failure state while those images load.

## Responsive styling

Component styles own their responsive rules:

- Tablet layout begins at `960px` and below.
- Mobile layout begins at `640px` and below.
- Laptop-height and short-height adjustments live beside the opening-screen styles.
- Decorative objects use shared `.hero-frame__object` behavior, with named classes for independent left/right positioning.

Keep visual adjustments in the component stylesheet that owns the element. This avoids late overrides and makes desktop, tablet, and mobile values easier to compare.

## Search and navigation

Search matches record titles case-insensitively and ignores Latin accents. The server
passes only IDs, slugs, titles, and summaries to the search component; full stories
and image metadata stay out of its interactive data. Matching characters retain
their original spelling and receive a subtle highlight.

Use Arrow Down from the input to focus the first result, Arrow Up/Down to move
between results, and Enter or Space to open a record. Clear restores input focus.
Records opened from search link back to `/search`; the typed query is currently
local to the search page and is not stored in the URL.

Archive records are generated at build time. A small Suspense boundary around the
return link reads `?from=search` without making the entire record request-dependent.
The route skeleton provides immediate feedback if navigation is still pending;
additional photographs load progressively rather than blocking the whole record.

Only navigation **to About** uses the petal reveal. Other page changes retain the
stationary opacity fade. Route timers and classes are cleared when navigation is
interrupted; reduced-motion preferences bypass the flight and route animations.
Music playback remains owned by the persistent `MusicControl` in the shared header.

## Verification before committing

Run `pnpm test`, `pnpm build`, and `git diff --check`. Tests cover normalized title
matches (including Khmer, combining accents, and emoji) and scroll indicator
geometry, including exact endpoints and touch overscroll.

Also check the production build at desktop, tablet, and mobile widths:

- Wait for the loading gate, then start; verify scrolling is unlocked.
- Search, navigate results with the keyboard, clear, and open a record.
- Verify the record return link, repeated About credit links, and header icon labels.
- Scroll long results, About, and the music panel; the independent gold thumb should
  reach both track ends, including after resizing.
- Navigate rapidly between pages; verify normal fades do not overlap the About
  petals, and modified/new-tab clicks retain normal browser behavior.
