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
  MusicControl.js            Persistent audio player and soundtrack dialog
  PlatformClass.js           Platform-specific layout hook
  SiteBrand.js               Home link with same-page smooth scrolling
  ViewportHeightLock.js      Stable opening-screen height
  Hero.js                    Opening archive content and decorations
  ArchiveGrid.js             Collection heading and record grid
  ArchiveCard.js             Collection record preview
  ArchiveEntry.js            Full archive record
  ArchiveMetadata.js         Record metadata list

data/
  archive.js                 Archive identity, defaults, entries, and lookup
  music.js                   Soundtrack playlists and page-mode mapping

assets/                      Imported interface and decorative artwork
public/images/               Archive photographs referenced by URL

scripts/
  clean-next-cache.mjs       Cross-platform generated-cache cleanup

styles/
  variables.css              Design tokens and global type scale
  base.css                   Reset, shared layout, surfaces, and typography
  header.css                 Header and navigation, including breakpoints
  music.css                  Music trigger, dialog, controls, and scrolling
  opening-screen.css         Opening background, frame, hero, and decorations
  archive.css                Collection cards and archive-record pages
  globals.css                Stylesheet import entry point
```

## Add or edit archive records

Edit `data/archive.js`. Shared placeholder fields live in `archiveEntryDefaults`; the record-specific catalog contains only the values that differ for each entry.

Add an `images` array only when a real image is available:

```js
{
  id: "ARCHIVE 012",
  slug: "example-record",
  category: "Ceremony",
  title: "Example Record",
  images: [
    {
      src: "/images/example.jpg",
      alt: "A precise description of the archive photograph",
      caption: "Optional photograph caption",
      approximateDate: "Early 2000s",
    },
  ],
}
```

Records without images automatically receive an empty array and display the existing placeholder treatment.

## Responsive styling

Component styles own their responsive rules:

- Tablet layout begins at `960px` and below.
- Mobile layout begins at `640px` and below.
- Laptop-height and short-height adjustments live beside the opening-screen styles.
- Decorative objects use shared `.hero-frame__object` behavior, with named classes for independent left/right positioning.

Keep visual adjustments in the component stylesheet that owns the element. This avoids late overrides and makes desktop, tablet, and mobile values easier to compare.
