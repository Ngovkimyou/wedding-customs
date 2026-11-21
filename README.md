# Khmer Wedding Tradition Archive

## 1. What this is

This project is a public archive that preserves Khmer wedding traditions and family memories from my parents’ generation, especially how weddings were organized in the early 2000s. Visitors can browse curated stories, search in Khmer or English, and—after signing in—contribute their own story and photograph. New and edited community entries wait for review before appearing in the public archive.

## 2. Who it’s for

The archive is for people in Cambodia, especially Khmer readers who want to learn about or remember wedding customs from their families and communities. Khmer is the default language, with an English option. I designed the archive to work on phones as well as larger screens, and to load photographs progressively so readers do not have to wait for every image before they can use the site.

I also chose public usernames instead of displaying contributors’ email addresses. That lets visitors see who contributed a story without exposing their account email.

## 3. How it works

The site uses Next.js and React, is deployed on Vercel, and uses Supabase for authentication, the PostgreSQL database, and photo storage. The curated records are maintained in `data/archive.js`; community contributions are stored in the Supabase `entries` table. The public home page, archive details, and search show published community entries. Search can match English and Khmer titles and story text.

Community entries use three database statuses:

- `pending`: newly submitted or edited and waiting for review.
- `published`: approved and visible in the public archive.
- `returned`: sent back for changes; the contributor can read the reviewer’s feedback in My Entries and edit the story for resubmission.

Reviewers use `/review` to review pending entries in submission order. Publish and Return actions call the `review_entry` database function; returned entries require a feedback note. Contributors use `/my-entries` to see their statuses and edit their own stories.

The main project areas are:

```text
app/                 Next.js pages and routes, including archive, search, review, and contribution pages
components/          Shared interface, forms, archive cards, navigation, and image previews
data/archive.js      Curated archive records
data/                Music, About-page credits, and shared visual data
lib/                 Validation, search, locale, media, and Supabase helpers
supabase/            SQL schema, validation, and access-policy scripts
tests/               Dependency-free regression tests
assets/ and styles/  Artwork, fonts, and component styles
```

## 4. Security decisions

The database is the security boundary; hiding a button in the interface is not enough. Row-level security (RLS) limits contribution changes to the signed-in owner. New entries must belong to that user and start as `pending`; contributors cannot change their own status to `published`. Public queries also filter for `published`, while RLS independently controls what the API can return.

Reviewer actions go through `public.review_entry(...)`, which checks that the caller is a reviewer and that the entry is still pending before changing its status. The reviewer list is not readable or writable through the normal Data API. Reviewer feedback is stored separately and is readable only by the entry’s owner and reviewers. The app uses hCaptcha for sign-in and sign-up, and public usernames rather than email addresses for author attribution.

These choices make the workflow explicit: contributions are reviewed before publication, returns include actionable feedback, and edits are resubmitted for review. The database enforces ownership and status rules even if someone bypasses the interface and calls the API directly.

## 5. AI use

The model I recorded using for this project was **Codex 6.1 Luna Max**. I used it for implementation and debugging support across Supabase access rules, contribution and review flows, bilingual content, search, responsive layout, and documentation. I read the diffs and checked behavior rather than accepting suggestions just because the app compiled.

One mismatch I caught was the bilingual form trying to save `description_en` before that column existed in the Supabase schema. The server log reported `PGRST204` and named the missing column, so I treated it as a schema migration issue, not as a character-count or form problem. The migration is documented in `supabase/bilingual-descriptions.sql` and must be applied to the project’s database before the bilingual form can save both fields. I also used the database errors and second-account API tests to check that review actions and ownership rules matched the SQL, then revised code or SQL when the actual schema or policy response did not match the suggestion.

## 6. Sources and credits

The archive stories are based on oral conversations between me and my parents. I do not have permission to publish their names. The place associated with these conversations is Phnom Penh, Cambodia.

The archive photographs are screenshots taken from a family wedding CD/DVD; they are not photographs I took. Individual captions and other available credits appear with the relevant archive material and on the About page.

## 7. Running it locally

Requirements: Node.js and the project’s pinned pnpm version (`pnpm@10.32.1`). In PowerShell, use `pnpm.cmd` if the execution policy blocks `pnpm.ps1`.

```powershell
git clone https://github.com/Ngovkimyou/wedding-customs.git
cd wedding-customs
pnpm install
Copy-Item .env.example .env.local
```

Add values locally to `.env.local` and to the corresponding Vercel environment variables. The variable names are:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_HCAPTCHA_SITE_KEY`

The Supabase publishable key is intended to be available in the browser; access is controlled by RLS. The hCaptcha **secret** belongs only in Supabase’s authentication CAPTCHA settings—not in this repository, the README, or browser code. Configure hCaptcha’s allowed hostnames for local development and the production site.

Run the development server and tests:

```powershell
pnpm dev
pnpm test
```

Open [http://localhost:3000](http://localhost:3000). For a production build, stop the development server first, then run:

```powershell
pnpm build
pnpm start
```

The SQL files in `supabase/` have prerequisites in their comments. Review existing data before applying migrations; do not run them blindly against a live project. In particular, `entry-access-policies.sql` follows the status migration, `reviewer-feedback.sql` requires the access-policy functions and table, and `bilingual-descriptions.sql` must be applied before deploying code that writes both description columns. Keep `.env.local` out of Git. If the development cache becomes stale, stop the server and run `pnpm clean` before restarting; do not run multiple dev servers in the same project directory.

## 8. Submission checklist

- **Live URL loads logged out and shows published entries only:** Yes — [https://wedding-customs.vercel.app/](https://wedding-customs.vercel.app/); public entry queries filter for `published` in `lib/supabase/entries.js`.
- **A stranger cannot publish their own entry through the page or console:** Yes — tested with a second account on **[add test date]**; direct status changes were refused by RLS and `review_entry` returned `false` for a non-reviewer.
- **Logged out, the API returns nothing pending or returned:** Yes — tested on **[add test date]**; the logged-out request for non-published entries returned an empty array (`[]`).
- **Contributors can edit and delete only their own entries:** Yes — enforced by owner checks in the entries-table RLS policies and checked with separate accounts on **[add test date]**.
- **No secrets anywhere in the repository history:** **Recheck before submission.** `.env.local` is currently tracked by Git in this workspace. I have not opened or copied its values. Audit the current file and Git history with a secrets scanner; if any live credential was committed, remove it from tracking and rotate it before marking this item complete.
- **At least eight real entries, each with a credited source:** Yes — 8 curated records are in `data/archive.js`; their source and photo-credit details are described above.
- **Khmer renders on every screen a user meets, including the queue:** Yes — Khmer is supported throughout the archive and contributor/reviewer flows.
- **Works at phone width:** Yes — tested on a phone-sized layout; add the exact device or browser width here: **[device / width]**.
- **No test entries, Lorem Ipsum, or TODO comments in shipped pages:** Yes — as recorded in my checklist.
- **No console errors on the main pages:** Yes — as recorded in my checklist.
- **`jesseorndorff` is a collaborator on this repository:** Yes.
- **Supabase project restored and awake:** Yes — November 20, 2026.
- **Demo video link opens in a private window:** **[demo video link to be added]**.
- **Reflection pasted in the Canvas submission:** Yes.
- **Posted in the Show Your Archive discussion:** Yes.
- **Q&A slot booked:** Tuesday, December 1, 2026, 1:00–1:05 p.m.
