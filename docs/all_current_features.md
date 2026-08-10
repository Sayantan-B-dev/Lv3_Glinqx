# All Current Features

## Core Infrastructure
- **Next.js 16 + React 19** — upgraded from 14.2.3 / React 18 (ESLint 8 → 9)
- **PostgreSQL** via `@neondatabase/serverless` (production) / `pg` Pool (local dev)
- **JWT auth** — 30-day sessions, cookie + Bearer header support
- **Unified error handling** — `apiHandler` wrapper on all 40+ routes, consistent `{ error, requestId }` responses
- **Rate limiter** — in-memory key-based with auto-cleanup
- **Structured logger** — info/warn/error with ISO timestamps
- **Health check** — `GET /api/health` pings DB (200/503)

## Authentication
- Email/password registration & login
- Google OAuth sign-in
- Session middleware (cookie or Bearer token)
- Role system: `user` / `prouser` / `admin`
- Floating sign-in prompt (unauthenticated users)
- Logout from sidebar
- Home link on login/register pages for unauthenticated users
- **Persistent session** — auth survives dev-server restarts (stable JWT secret handling)

## Links
- **Create** — submit single URL with auto-fetched OG metadata (title, description, image), manual tag input, anonymous posting. **Required**: topic, title, description — validated client + server.
- **Navigation guard** — unsaved data detection on `/submit` with `ConfirmModal` on browser refresh or internal link click
- **Visibility** — three levels: `public` (everyone), `followers` (only followers of author), `private` (only author)
- **Visibility badge** — emoji indicator (🌐/👥/🔒) on all link cards
- **Edit menu** — three-dot dropdown on own link cards to change visibility (PATCH via API)
- **Feed** — tabbed (following / explore / for you), visibility-aware filtering
- **Sorting** — Newest, Oldest, Most Likes via reusable `SortDropdown`
- **Daily Dose** — curated discovery feed
- **Random / Internet Roulette** — auto-play with 10s cooldown
- **Search** — home page search, explore pre-fetching
- **Short URLs** — `lnkzoo.vercel.app/s/[code]` with custom shortener tool; auto-expire after 24h; rate-limited 10/min guests, 30/min users
- **Flagging** — report inappropriate links
- **Topic assignment** — grouped topic dropdown on submit form; `topic_id` stored per link
- **Topic badge** — themed topic pill on link cards and detail page
- **Card navigation loader** — loading indicator when opening a link card
- **View & click tracking** — every link view (`link_view_events`) and short-link click (`link_click_events`) recorded for analytics

## Bulk Upload
- **Concurrent processing** — 5-thread parallel OG parsing & link creation
- **Streaming progress** — real-time NDJSON via `ReadableStream` with progress bar
- **Auto-tagging** — AI tag suggestions via Groq (`llama-3.3-70b-versatile`) with graceful fallback (silently continues if AI fails)
- **Admin override** — unlimited URLs for admins, max 10 for regular users
- **Visibility selector** — applies to all URLs in batch
- **Report download** — `.txt` report with timestamp, summary, per-URL results

## User Dashboard (`/manage/links`)
- **Stats cards** — total, public, followers-only, private counts; likes, views, comments, clicks
- **Link table** — searchable, sortable (title, likes, views, comments, created), selectable rows
- **Bulk delete** — with `ConfirmModal`
- **Bulk visibility** — segmented control (Public / Followers / Private)
- **Bulk tagging** — modal to add/remove tags on multiple links simultaneously
- **Pagination** — page controls with ellipsis

## Comments
- Full threaded nesting with depth tracking
- Recursive `CommentItem` component (depth-based indent, thread-lines, collapse/expand)
- Depth limit enforcement (max 10 levels)
- Self-reply prevention
- Inline reply forms (toggle via Reply/Cancel)
- Deleted comment placeholders (preserve thread shape)

## Likes
- Toggle like/unlike on link cards
- Like-based leaderboard (period filter: week / month / all)
- User-specific rank display

## Users
- **Profile page** — avatar with cropping, cover image, bio, website, interests, streak
- **Followers / Following** — popup lists with link counts
- **Users directory** — searchable card grid at `/users`
- **Sort by** — newest, oldest, most likes on profile submissions

## Admin Dashboard (`/admin/dashboard`)
- **Global range selector** — 7D / 30D / 90D / All; refetches every chart via `/api/admin/stats?range=`
- **Sectioned layout** — Overview → Growth → Engagement → Content → Community → Moderation
- **Overview** — 13 KPI cards (users, links, comments, likes, views, clicks, follows, bookmarks, tags, topics, short links, flagged, banned) + growth sparklines
- **Growth** — user/link growth + cumulative user/link trend charts
- **Engagement** — daily activity dual-trend, engagement-mix donut, views & clicks trends, top-links & top-contributors tables
- **Content** — topic & visibility distribution donuts, top-tags horizontal bars
- **Community** — daily-active-users / likes / bookmarks trends, user-role & notification-type donuts, streak-distribution buckets
- **Moderation** — flagged links panel with quick actions
- **Gap-filled time series** — every daily series backfills zero-count days for continuous charts
- **Empty states** — `ChartEmpty` placeholder shown when a chart has no data
- **Chart library** — d3-based MetricCard, Sparkline, TrendChart, DualTrendChart, DonutChart, PieChart, HorizBarChart, BucketBar, StatTable, RangeSelector, FlaggedPanel
- **User management** — table with role selector (`user`/`prouser`/`admin`), ban/unban toggle, pagination
- **Topics manager** — tree view to create/edit/delete curated topics (admin CRUD)

## Tag System
- Tags explore page at `/tags/[tag]`
- Auto-suggested tags via Groq API during link creation
- Bulk add/remove tags in manage dashboard
- Tag usage count tracking

## Topics (Taxonomy)
- **Curated taxonomy** — self-referencing `topics` table (parent/child groups), links reference a single `topic_id`
- **Seed data** — pre-populated curated topic set with grouped hierarchy
- **API** — public taxonomy endpoints + admin CRUD; `topic_id` support in links GET/POST
- **Submit form** — grouped topic dropdown with group separators
- **Topics hub** — `/topics` overview + per-topic page with sidebar navigation
- **Explore filter** — filter the feed by topic type
- **Link surfaces** — themed topic badge on cards and link detail page
- **Admin** — tree manager for the full taxonomy

## Developer Tools (`/tools`)
- **Fully public** — every tool, API, and QR works without login (guests included)
- **URL Shortener** — 24h expiring short links (`/s/[code]`), in-memory rate limit (10/min guests, 30/min users), QR code + download under the result
- **Low Weight File Transfer** — drag-drop or browse files up to 3MB; self-destructs after 5 min; 1 upload/min/IP (DB-backed); always served as a forced download with the original filename; QR + "Download QR"; HTML/SVG/JS blocked with a "zip it" hint
- **Text Share** — self-destructing text snippets (10k chars max) with expiry choices 5 min / 1 hour / 24 hours; 1 share/min/IP (DB-backed); QR + hour-aware live countdown; text rendered escaped, never indexed
- **QR everywhere** — `ShortUrlQR` component (qrcode.react) renders a centered 160×160 white-card QR with PNG download; used by all three tools and the link detail page short-URL result
- **Live countdowns** — "This file/text will be destroyed in MM:SS" and "Next request in MM:SS" (H:MM:SS for ≥1h) ticked from server timestamps; cards reset at expiry
- **Refresh-proof results** — generated links survive page refreshes via `localStorage` (`lnkzoo_tools_state`); countdowns and rate-limit cooldowns resume correctly from server timestamps; results are destroyed only by their real TTL, never by a refresh
- **Per-tool reset buttons** — "Shorten another URL" / "Share another file" / "Share another text" clear only that tool's result and storage while other tools keep running; rate-limit cooldown survives the reset
- **Self-healing links** — expired/missing `/f/[code]` and `/t/[code]` destroy their data on access then 404; cleanup crons run even when nobody visits
- **Cleanup crons** — `/api/cron/cleanup-temp-files` + `/api/cron/cleanup-shared-texts`, both protected by `x-cron-secret` = `CRON_SECRET`
- Full docs: `docs/tools.md`, DB queries in `docs/db/`

## Home Page Sections
- **Hero** — headline, stats, CTA
- **Marquee** — trending tags carousel
- **About** — what LnkZoo is + key stats grid
- **Features** — 7 feature cards (discovery, previews, community, streaks, daily dose, short URLs, tags, analytics)
- **How It Works** — explains Categories (domain filter), Topics (60 curated), Tags (free-form, chaotic)
- **Metrics** — platform-wide stat counters
- **Feed** — tabbed link feed (following/explore/for you) with sort + search
- **FAQ** — accordion of common questions
- **Tutorial** — 7-tab step-by-step platform guide (Feed & Discovery, Posting, Managing, Discover, Short URLs & Tools, Account, Admin Panel)

## UI & Theming
- **Dark/light theme** — persisted in `localStorage` (`lnkzoo_theme`), inline `<script>` prevents FOUC
- **Background settings panel** — physics particle grid with auto-refill, interactive tuning, adjustable frequency/speed/size
- **Custom cursor** — `#fff` with `mix-blend-mode: difference` for universal invert
- **Loading globe** — 3D canvas network globe animation on page transitions
- **Toast notifications** — fixed bottom-center, backdrop blur, auto-dismiss (success/error/info)
- **Sidebar** — collapsible, grouped navigation (Feed/Discover/Create), mobile full-screen overlay with animated burger
- **Topbar** — fixed on mobile, responsive height
- **Footer** — global layout, expand/collapse on mobile
- **Mobile responsive** — all pages at 768px and 480px breakpoints
- **Unified typography** — consistent font system across the app; themed dropdowns (topic selector, sort)
- **Unified search cards** — consistent card styling across search surfaces

## Legal & Compliance
- Privacy policy, Terms of service, Cookies policy pages
- `robots.txt` — disallows `/api/`, `/admin/`, `/login`, `/register`, `/s/`
- Security headers — `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`
- Open redirect validation on login `?from=`

## Gamification
- Streak tracking with automatic update on link creation
- Follower count and engagement metrics displayed on profiles

## Notifications
- Notification system with read/unread state
- Notification bell indicator
- Notifications API (`GET /api/notifications`)

## File Structure
- **Pages** — under `app/(main)/` route group with Topbar + NotificationPanel + `<div id="content">` pattern
- **Components** — modular `components/` (common, links, manage)
- **CSS** — organized under `styles/` (core, layout, ui, pages) with CSS variables, `color-mix()`, and `backdrop-filter`
- **Services** — `services/` (autoTag, gamification)
- **Lib** — `lib/` (db, auth, shortCode, api-utils, rate-limit, logger) — note: `lib/db.ts` local pg shim & neon do **not** support `sql` fragment composition; use full per-branch queries or the `query(text, $N)` helper
- **Reference docs** — `STYLE.md` (CSS/design tokens map), `DESIGN.md` (architecture / file map), linked from `AGENT.md`
- **Analytics tables** — `saved_links`, `link_view_events`, `link_click_events`, `daily_activity` (migration `database/migrate_analytics.sql`, applied via `scripts/run-sql.js`)

## Security
- JWT-based auth with 30-day expiry
- Role-based access control (admin middleware)
- Rate limiting on API routes
- Input validation (password max 128 chars, open redirect check)
- Consistent error responses (no stack traces leaked)
- API route ownership guards (delete/update only own resources)

## Changelog — 2026-08-10 → present

### 2026-08-10 — Tools persistence, per-tool reset buttons, docs restructure
- **Refresh-proof tool results** — URL shortener, file transfer, and text share results persist in `localStorage` (`lnkzoo_tools_state`) across page refreshes; destroy countdowns and rate-limit cooldowns resume from server timestamps; entries are purged only at their real TTL. Shortener result now also auto-clears after its 24h expiry.
- **Per-tool reset buttons** — "Shorten another URL" / "Share another file" / "Share another text" on each result block reset only that tool (result + countdown + storage) while the other tools keep their state; cooldown survives so the fresh form shows "Next request in…".
- **Docs restructure** — all root docs moved to `docs/` (`git mv`), added `docs/tools.md`, `docs/db/temp-file-transfer.md`, `docs/db/text-share.md`, `docs/index.md`; removed stray `[done]*` `.gitignore` line and tracked the files it was hiding (migrations, notifications route, agent skill library).

### 2026-08-10 — Developer Tools, QR codes, session UI upgrades
- **QR codes** — new `ShortUrlQR` component (`qrcode.react`, `qrcode.react` dep) renders a centered fixed-square 160×160 QR in a white card (scans in dark mode) with a "Download QR" PNG button. Shown under the URL Shortener result and the link detail page Short URL result (`56cf613`).
- **Low Weight File Transfer** — public self-destructing file sharing tool: drag-drop/click-browse up to 3MB, Cloudinary `raw` upload (data URI, never touches disk), 5-min TTL, DB-backed 1 upload/min/IP, `GET /f/[code]` proxies the file with the original filename + type as a forced download (`X-Content-Type-Options: nosniff`), type blocklist with "zip it" hint, cleanup cron + lazy prune + self-heal (`54ebe9a`). Renamed from "LowWeightFileTransfer" with mobile hardening — `overflow-wrap`/`word-break` on titles, `min-width: 0` on tool cards (`a4e7a9b`).
- **Text Share** — public self-destructing text tool: 10k chars, expiry 5 min / 1 hour / 24 hours, DB-backed 1 share/min/IP, `GET /t/[code]` escaped plain-text page with copy button, `cleanup-shared-texts` cron, shared `formatCountdown` (`c98738e`).
- **Home page** — "Why LnkZoo" card "Short URL Tool" → "Developer Tools" covering the full tools page (`6b8a89c`).
- **Bookmark everywhere** — bookmark toggle added to every link card surface; fixed bookmarks API `GROUP BY` (`sl.id` → `sl.link_id, l.id, sl.created_at`) (`3a1c2d6`).
- **Prev/next navigation** — link detail page navigates back/forward within the originating feed list via sessionStorage (`lib/linknav.ts`: `storeListNavigation`, `readListNavigation`, `fetchListPage`); floating pill desktop + fixed bottom bar mobile (`83361e8`, `85bd659`).
- **Particles fly-through** — new particles variant flies through the viewport on link detail (`uFlyOffset` shader, `autoZoom`/`autoZoomSpeed` props) (`11e89c4`).
- **Cursor loader** — cursor spins on every click and any in-flight fetch (global `fetch` interception in `context/LoadingContext.tsx`) (`90b5ff3`).

### 2026-07-22 — OG parser: Facebook fetching, profile links COUNT fix
- **Fix** — profile links endpoint (`GET /api/users/[username]/links`) was passing `$3`/`$4` (limit/offset) to the `COUNT(*)` query, which only uses `$1`/`$2` (and `$3`/`$4` for domain). Caused PostgreSQL prepared-statement param mismatch errors (`bind message supplies 4 parameters, but prepared statement "" requires 2`). Separated count params with contiguous numbering.
- **ScatteredLinks** — added error logging to API fetch calls for easier debugging.
- **Fix** — OG parser (`parseOGMetadata`) used a Chrome/125 User-Agent that Facebook blocks (returns 400). Switched to a version-less Chrome UA (`AppleWebKit/537.36`), which Facebook accepts and returns full OG tags. Also added `fallbackTitle()` on non-200 responses so users get a readable platform name (e.g., "Facebook Post") instead of the raw URL.
- **OG parser** — resolves relative `og:image` URLs to absolute via `new URL(rawImage, url)`. Added `og:image:secure_url` fallback. Facebook CDN images (`scontent.*.fbcdn.net`) return 403 (hotlink protection) — added `onError` on submit preview to hide the broken image, plus `referrerPolicy="no-referrer"`.
- **Platform fallbacks** — added LinkedIn to `fallbackTitle()`. Tested all: YouTube, Threads, LinkedIn serve OG tags; X/Twitter uses oEmbed; Instagram serves no metadata (requires Graph API) but `fallbackTitle` covers it.
- **Bulk upload** — replaced its own duplicate `parseUrl()` with the shared `parseOGMetadata()` so all fixes (UA, og:image/secure_url, relative URLs, fallbackTitle) apply to bulk too.
- **Submit form copy** — updated the step-1 heading/subtitle to explain auto-fetching of title, description, image & tag suggestions.
- **Bulk upload safety** — per-domain concurrency (max 2/hostname prevents rate-limit blocks), 45s time budget guard (gracefully marks remaining items as timeout instead of silent stream cut), admin concurrency raised to 25, short-code retry loop (3 attempts before failing), batch progress events (every 10 URLs reduces stream overhead).
- **Like/bookmark speed** — optimistic UI updates on LinkCard (toggles icon instantly, reverts on error); removed unnecessary `/api/auth/me` pre-check from bookmark handler (was doubling latency); optimized like API to use DELETE-then-INSERT toggle in 2–3 DB roundtrips instead of 4–5.
- **Uniform text limits** — enforced max lengths across API + frontend: title 150, description 500, tags 8; fixed card layout overflow from long text.

### 2026-07-25 — Footer personal links
- **Footer** — added social links (GitHub, Twitter, Website) and "© 2026 Sayantan Bharati. All rights reserved." copyright line.

### 2026-07-28 — AI Generate, Websites page, Card fixes, Responsive layout, Editable username

#### AI Generate (Pro/Admin)
- **API route** (`POST /api/tools/generate`) — calls Groq (`llama-3.3-70b-versatile`) with 3-key rotation to generate title, description, and tags from a pasted URL/content. Rate-limited (10 req/min per user).
- **Submit form** — added AI sparkle ✨ button that opens a popup modal with its own textarea (4000 char limit). User pastes content, clicks Generate, and the modal fills the title/description/tags fields on the main form. Gated to `pro`/`admin` roles only.
- **Responsive modal** — AI popup adapts to mobile with full-screen overlay.

#### Websites page (`/websites`)
- **Phase 1** — inserted "Website" topic (id=101) under "Web & Cloud" in the curated topic taxonomy + migration script.
- **Phase 2** — moved "Amazing Websites" from home page to dedicated `/websites` route with full explore-style filters: search, sort (newest/oldest/top), domain category filter.
- **Phase 3** — removed "Filter by category" section from `/websites`. Fixed topic filter in the websites API to use cumulative WHERE conditions (resolves Neon `sql` fragment incompatibility).
- **Tools nav** — "Tools" link now visible in sidebar for all authenticated users (was pro/admin only).

#### Card & UI fixes
- **Preview images** — removed preview image from all `LinkCard` and `ScatteredLinks` surfaces (kept on Random page). Prevents layout shift and reduces bandwidth.
- **Card overflow** — fixed title text overflow with `word-wrap: break-word` + `overflow-wrap: break-word` + `hyphens: auto`. Card body minimum width removed to prevent horizontal scroll.
- **Bookmark card layout** — fixed broken bookmark card layout in `/bookmarks`.
- **Like API bug** — fixed like count desync when toggling on bookmark page.
- **Edit scrollbar** — profile edit form no longer causes vertical scrollbar jump.

#### SQL driver — Neon `sql` fragment fix
- **Problem** — Neon's `@neondatabase/serverless` does not support composing `sql` template literal fragments (e.g., `` sql`AND ...` `` inside a larger `sql```...`` ``). This caused silent empty-string interpolation and broken queries.
- **Fix** — replaced all `sql` fragment composition with a `query(text, $N)` helper that uses contiguous `$1`–`$N` parameter numbering. All dynamic WHERE conditions are built as cumulative string arrays with manually tracked parameter indices.
- **Files** — `lib/db.ts`: added `query()` wrapper. `app/api/links/route.ts`, `app/api/links/categories/route.ts`: rewrote GET handlers to use `query()` with cumulative WHERE params.
- **Guard** — added `AND 1=1` placeholder before dynamic conditions to prevent bare-WHERE syntax errors when no filters are active.

#### Profile: Editable username
- **API** (`PATCH /api/users/profile`) — accepts `username` field with regex validation (`/^[a-z0-9_]{3,30}$/i`), uniqueness check (excluding current user), stores lowercased via `COALESCE`. Re-signs JWT cookie with new username.
- **Frontend** — username input added to the edit profile form, pre-filled from current profile. On save, auto-redirects to `/profile/{lowercased-username}`.
- **Case sensitivity fix** — all user lookup routes (`[username]/route.ts`, `[username]/links/route.ts`, `[username]/categories/route.ts`) now use `LOWER(username)` in the WHERE clause to match regardless of stored casing.

#### Profile: Responsive layout
- **Card grid** (`ScatteredLinks.css`) — breakpoints: default 5 cols → ≤1400px 3 cols → ≤700px 2 cols → ≤500px 1 col.
- **Header** (`profile.css`) — breakpoints: ≤1100px column layout (avatar stacked, buttons below stats) with centered text; ≤768px smaller avatar (72px) and padding; ≤480px compact avatar (60px), tighter spacing.

#### Profile: Topic filter
- **Filter by topic** — fetches topic types from `/api/links/topics` and renders a collapsible chip bar on the profile page. Selecting a topic scopes both the API endpoint (`topicType`) and the categories fetch to that topic type.
- **Categories scoped** — the categories (domain filter) re-fetches whenever the active topic type changes.
- **Pagination reset** — `ScatteredLinks` keyed on `apiEndpoint` so page resets on any filter change.

#### Sidebar duplicate key fix
- **Collapsed mode** — two nav items had `id: 'users'` (Discover > Users and Admin > Users) causing React key collision. Changed collapsed nav keys to `${section}-${item.id}` for uniqueness.

### 2026-07-20
- **Auth persistence** — session now survives dev-server restarts; added card navigation loader and unified search card styling (`a539aab`).

### 2026-07-21 — Topics taxonomy
- **DB** — curated topic taxonomy: self-referencing `topics` table + `links.topic_id`, with seed data (`ec9ccfc`).
- **API** — topic support in links GET/POST (`30be0ed`); topics taxonomy endpoints + admin CRUD (`db6fe87`).
- **Submit** — grouped topic dropdown on the post form (`279a551`).
- **Cards** — topic badge on link cards and detail page (`708ec09`).
- **Explore** — filter feed by topic type (`acd1f77`).
- **Pages** — topics hub + per-topic page + sidebar nav (`fdb2623`).
- **Fix** — restored links feed by removing unsupported `sql` fragment composition (`627b194`).
- **UI** — themed topic dropdown + unified app typography (`e97320d`).
- **Admin** — topics tree manager (`ebbbe67`); fixed invisible admin badge/buttons + topic-select group separators (`eb7ccbf`).

### 2026-07-21 — Reference docs
- Added `STYLE.md` + `DESIGN.md` reference maps, linked from `AGENT.md` (`afeefce`, `c493f28`).

### 2026-07-21 — Admin analytics overhaul
- **Phase 4** — event tracking: `saved_links`, `link_view_events`, `link_click_events`, `daily_activity` tables + view/click instrumentation (`1343dc8`).
- **Phase 0** — `ChartEmpty` empty-states across all admin charts (`0d8fcdb`).
- **Phase 1** — `/api/admin/stats` v2: `range` param (7/30/90/all), gap-filled series, new distributions & top-N aggregations (`740dc73`).
- **Phase 2** — new chart components: `PieChart`, `StatTable`, `BucketBar`, `RangeSelector` + styles (`3e8c0d5`).
- **Phase 3** — dashboard redesigned into sections with range selector, expanded 13-KPI row, and new charts (`880db24`).
- **Docs** — updated `DESIGN.md` admin components list for the redesign (`9ccadaa`).
