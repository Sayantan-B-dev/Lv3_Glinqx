# Medium-Engineering Features

## 1. Collections (Link Bundles)
Users create named collections (e.g. "Dev Tools", "Must Read") and add links to them — their own or from others.

- **New tables:** `collections` (id, user_id, name, description, created_at), `collection_links` (collection_id, link_id, added_at)
- **New API:** CRUD for collections + add/remove links
- **New page:** `/collections` (user's list), `/collections/[id]` (browse), collection picker on submit page
- **Card variant:** collection card showing name, link count, cover image

**Effort:** Medium — 2 tables, 5 API routes, 2 pages, UI changes on submit and link cards

---

## 2. Full-Text Search
Replace the current `ILIKE` search with PostgreSQL `tsvector`/`tsquery` across all public links.

- **DB migration:** Add `tsv` column to `links` with `GIN` index, populate via trigger on title + description
- **API:** `GET /api/search?q=` returning ranked results with highlighted snippets
- **Page:** `/search` with results list, filters (visibility, date range), pagination
- **Header:** Search bar in topbar or sidebar (opens search page)

**Effort:** Medium — DB migration with triggers, new API route, new page, header UI

---

## 3. Link Scheduling
Allow users to set a future publish time when submitting a link. It stays hidden (draft) until the time arrives.

- **DB:** Add `scheduled_for TIMESTAMP` and `status TEXT` (draft | scheduled | published) to `links`
- **API mod:** POST/PATCH accept `scheduled_for`; GET filtered for > now
- **Cron:** `GET /api/cron/publish` (called via Vercel Cron) moves scheduled → published
- **UI:** Date-time picker on submit page, "Scheduled" badge on manage dashboard, scheduled tab in manage

**Effort:** Medium — DB migration, cron endpoint, date picker component, manage dashboard updates

---

## 4. Follow Suggestions
Recommend users to follow based on shared tags, follower overlap, or most active users.

- **API:** `GET /api/users/suggestions` — picks users who:
  - Share tags with the current user's links
  - Are followed by people the current user follows
  - Or are simply the most active (fallback)
- **Page:** Suggestions card on the `/users` page or a dedicated section on home
- **Dismiss:** "X" button to remove a suggestion

**Effort:** Medium — one API route with a few CTEs, home page card

---

## 5. Link Preview on Redirect (OG Social Card)
When someone shares `https://lnkzoo.vercel.app/s/code` on Twitter/Discord, show a rich preview. Currently it's a `route.ts` that redirects — which returns no HTML for crawlers.

- **New page:** Replace the redirect route with a page that:
  1. Reads the link from DB
  2. Renders `<meta property="og:title" ...>` etc. in `<head>`
  3. Redirects via `<meta http-equiv="refresh">` + JS fallback
  4. Shows a brief "Redirecting..." UI
- **Crawler detection:** Optionally skip redirect for crawlers so they read the meta tags

**Effort:** Medium — need to restructure `/s/[code]` from `route.ts` to `page.tsx`, handle both crawlers and humans

---

## 6. Link Activity Feed
A feed showing recent actions from followed users: "X posted a link", "Y liked Z's link", "X commented on ..."

- **New table:** `activities` (id, user_id, type, target_id, target_type, created_at) — populated via DB triggers or app-level hooks
- **API:** `GET /api/feed/activity` — paginated, filtered by followed users
- **Page:** New tab on home feed called "Activity" alongside following/explore/for-you
- **Cards:** Compact activity items with icon, text, relative time

**Effort:** Medium-High — new table, triggers/hooks, new API, feed tab + card components

---

## 7. Import from Browser (Bookmarklet)
A small JS snippet users drag to their bookmarks bar. When clicked on any page, it opens LnkZoo's submit form with the URL pre-filled.

- **Page:** `/tools/import` with instructions + a draggable link containing JS
- **API:** Existing submit endpoint handles the POST
- **JS snippet:** Reads `document.URL` and `document.title`, redirects to `/submit?url=...&title=...`
- **UX:** Pre-fill the form fields from query params on the submit page

**Effort:** Medium — tools page with instructions, query-param handling on submit page, cross-browser testing
