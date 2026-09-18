# Khmer Wedding Tradition Archive

A responsive oral-history archive for documenting Khmer wedding memories, traditions, ceremonies, objects, and family stories.

## Run the project

Use pnpm (the version is pinned in `package.json`) and keep `pnpm-lock.yaml` committed. Do not mix package-manager lockfiles.

```bash
pnpm install
pnpm dev
```

Before starting the app, copy `.env.example` to `.env.local` and fill in the
Supabase URL, publishable key, and hCaptcha sitekey. Keep the hCaptcha secret
key only in Supabase's Auth CAPTCHA settings; it must never be placed in the
repository or exposed to the browser.

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

## Authentication security checklist

The app sends hCaptcha tokens to Supabase for both login and sign-up. Configure
the CAPTCHA provider in Supabase before testing authentication:

1. In **Authentication → Captcha**, select **hCaptcha** and paste the secret
   key there. Keep the secret in Supabase only; the browser receives only
   `NEXT_PUBLIC_HCAPTCHA_SITE_KEY` from `.env.local`/Vercel.
2. In the hCaptcha dashboard, allow the production hostname
   (`wedding-customs.vercel.app`) and any local development hostname you use.
3. Review **Authentication → Rate Limits** and keep the sign-in, sign-up, and
   token/email limits enabled. Tighten them if the project is exposed publicly.
4. For the class setup, turn **Confirm email** off in Supabase Auth. The app
   still supports confirmed-email projects, but with confirmation disabled a
   successful sign-up receives a session and continues to the normal loading
   gate immediately.

The repository adds CSP and transport/security headers, bounded auth/search
inputs, generic login errors, and regression tests. The PostCSS audit fix is
kept as a pnpm override in `package.json`; do not replace it with an unapproved
dependency. Never commit `.env.local`, a Supabase secret, or an hCaptcha
secret.

## Project structure

```text
app/
  layout.js                  Shared page shell and metadata
  page.js                    Home page and opening screen
  about/page.js              About content and two accessible credit-roll copies
  search/page.js             Search page and lightweight title/description index
  archive/[slug]/page.js     Static archive-record pages
  archive/loading.js         Record skeleton for pending navigation

components/
  Header.js                  Header artwork, brand, and navigation
  SearchControl.js           Search entry point and shared header artwork
  HeaderVisibilityController.js
                             Header idle/scroll behavior
  LoadingScreen.js           Loading-gate UI, page lock, and start gesture
  ArchiveRoutePrefetcher.js  Warms About and archive routes after the initial reveal
  ArchiveCardLink.js         Intent-aware card link and low-priority image warming
  ArchiveEntryPreloads.js    Route-specific background, frame, and media hints
  MusicControl.js            Persistent audio player and soundtrack dialog
  PlatformClass.js           Platform-specific layout hook
  SiteBrand.js               Home link with same-page smooth scrolling
  ViewportHeightLock.js      Stable opening-screen height
  Hero.js                    Opening archive content and decorations
  DecorativeDivider.js      Reusable floral divider
  ProgressiveImage.js       Lazy image placeholder, fade-in, and fallback
  ArchiveGrid.js             Collection heading and record grid
  ArchiveCard.js             Collection record preview
  ArchiveEntry.js            Full archive record composition
  ArchiveEntryImages.js      Framed lead images and empty-image fallback
  ArchiveDescription.js      Rich description sections, links, and inline media
  ArchiveDescriptionGallery.js
                             Reusable connected and stacked image galleries
  ArchiveAside.js            Optional framed or plain archive aside
  ImageLightbox.js           Detail-page full-screen image viewer
  ArchiveNavigation.js       Prefetched previous/next record links
  RelatedTopics.js           Three responsive links to neighboring records
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
  petals.js                  Shared petal assets and ordered reveal layers
  about.js                   Source links, music credits, and contact details

lib/
  auth-security.mjs          Generic auth errors that prevent account enumeration
  auth-routes.mjs            Shared public authentication-route policy
  archive-search.mjs         Pure normalized title/description matching and snippets
  archive-swipe.mjs          Pure swipe direction, threshold, and drag math
  archive-validation.mjs     Catalog, rich text, link, and gallery validation
  archive-assets.js           Shared archive image discovery for preload/prefetch
  client-navigation.js       Shared route prefetch and archive-ready event
  client-asset-prefetch.js   Low-priority client image prefetch helper
  initial-asset-loader.js    Cancellable visual, font, and audio readiness checks
  media.js                   Shared imported-asset source and dimension helpers
  security.mjs               Auth/search input limits and conservative validation
  security-policy.mjs        CSP and transport/security response headers
  scroll-indicator.mjs       Pure scrollbar geometry

tests/                       Dependency-free regression tests (`pnpm test`)

assets/                      Imported AVIF interface and decorative artwork
assets/fonts/                Self-hosted Lugrasimo, Overlock SC, and Khmer WOFF2 files
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
  media.css                  Progressive images and full-screen lightbox
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
The current catalog contains eight records; `archiveEntries`, search results, static routes, and previous/next navigation are derived from that catalog automatically.

Add an `images` array only when a real image is available. Imported assets in
`assets/images/` are optimized by the Next.js image pipeline:

```js
import archive012Image from "../assets/images/archive-012.avif";

{
  id: "ARCHIVE 012",
  slug: "example-record",
  title: "Example Record",
  summary: "A concise preview shown on collection and search cards",
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
`/search`. When adding interface assets, update the visual source list in
`lib/initial-asset-loader.js` if they must be ready before reveal.

The current page's first soundtrack is required before reveal. Remaining playlist
tracks are warmed after playback starts, so one slow optional track cannot delay the
first screen. Archive photos and noncritical route content should not be added to the
initial blocking preload list.

When a record route is requested, `ArchiveEntryPreloads` emits responsive hints for
the record background, title/thumbnail frames, and the record's imported media. The
lead photograph uses Next's optimized image source; the remaining media is scheduled
at low priority and still keeps its reserved aspect-ratio placeholder. Collection
cards also warm their record media after pointer, keyboard, or touch intent, reducing
the delay on a first open without downloading every record during the initial gate.

The petal layer is independent from the fading black loading layer, allowing
the animation to finish after the opening screen appears. Reduced-motion users
receive the opening transition without the petal flight.

Archive photographs below the opening screen remain lazy-loaded. The reusable
`ProgressiveImage` component provides a lightweight placeholder, fade-in, and
failure state while those images load. Route loading uses the same paper/frame visual
language, so a slow RSC response never exposes an empty background or unframed text.

## Responsive styling

Component styles own their responsive rules:

- Tablet layout begins at `960px` and below.
- Mobile layout begins at `640px` and below.
- Laptop-height and short-height adjustments live beside the opening-screen styles.
- Decorative objects use shared `.hero-frame__object` behavior, with named classes for independent left/right positioning.

Keep visual adjustments in the component stylesheet that owns the element. This avoids late overrides and makes desktop, tablet, and mobile values easier to compare.

## Search and navigation

Search matches English and Khmer record titles plus description paragraphs case-insensitively and ignores Latin accents. Quotes,
punctuation, symbols, and repeated whitespace are treated as separators, so `"met"`,
`m   et`, and `m @ et` match the same title. The server passes only IDs, slugs,
titles, summaries, and text-only description blocks to the search component; full
stories, gallery images, and decorative metadata stay out of its interactive data.
Matching characters retain their original spelling and receive a subtle highlight.

Description matches return only the matching sentence (or a short bounded context
when a paragraph has no sentence punctuation), with its section label and matching
characters highlighted. Placeholder prose is excluded from the search index.

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

Run `pnpm test`, `pnpm build`, `pnpm audit --prod`, and `git diff --check`. Tests cover normalized title
matches (including Khmer, combining accents, and emoji), archive data validation,
swipe direction and thresholds, and scroll-indicator geometry.

Also check the production build at desktop, tablet, and mobile widths:

- Wait for the loading gate, then start; verify scrolling is unlocked.
- Search, navigate results with the keyboard, clear, and open a record.
- Verify the record return link, repeated About credit links, and header icon labels.
- Scroll long results, About, and the music panel; the independent gold thumb should
  reach both track ends, including after resizing.
- Navigate rapidly between pages; verify normal fades do not overlap the About
  petals, and modified/new-tab clicks retain normal browser behavior.
