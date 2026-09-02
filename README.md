# Khmer Wedding Tradition Archive

A responsive oral-history archive for documenting Khmer wedding memories, traditions, ceremonies, objects, and family stories.

## Run the project

This repository currently uses `package-lock.json`, so npm is the canonical package manager.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). For a production check, run:

```bash
npm run build
```

Avoid running multiple development servers against the same project directory. They can compete for the development cache and cause stale Webpack-module errors during refresh. Development output is stored in `.next-dev`; production builds use `.next`.

If the cache becomes stale, stop the running server first, then run:

```bash
npm run clean
npm run dev
```

The separate output directories allow `npm run build` to run without invalidating chunks used by an active development server.

## Project structure

```text
app/
  layout.js                  Shared page shell and metadata
  page.js                    Home page and opening screen
  about/page.js              About page
  archive/[slug]/page.js     Static archive-record pages

components/
  Header.js                  Header artwork, brand, and navigation
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
  ArchiveMetadata.js         Record metadata list

data/
  archive.js                 Archive identity, defaults, entries, and lookup
  music.js                   Soundtrack playlists and page-mode mapping

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
  archive.css                Collection cards and archive-record pages
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
user interaction required by browser autoplay policies.

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
