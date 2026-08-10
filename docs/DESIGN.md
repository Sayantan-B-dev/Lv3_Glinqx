# DESIGN — Component & Route Map

"Where's what" index to save tokens/context. Pair with `STYLE.md` (CSS) and `AGENT.md` (rules).

## Aesthetic
Monospace dev/terminal look (JetBrains Mono), dark-first, restrained accent, subtle borders over shadows. Interactions are quiet (`var(--t)` transitions). Every data page follows loading → error → empty → content states (see AGENT.md).

## App routes — `app/`
Route groups: `(main)` = public/user shell (sidebar+topbar), `admin` = admin shell, top-level = auth + redirects.
- Root: `layout.tsx` (imports globals + providers) · `loading.tsx` · `not-found.tsx`.
- Auth: `login/`, `register/`.
- Short-link resolver: `s/[code]/`.
- **(main)** user app: `page.tsx` (home) · `explore/` · `topics/` + `topics/[topic]/` · `tags/` + `tags/[tag]/` · `categories/` + `categories/[category]/` · `link/[id]/` · `submit/` + `submit/bulk/` · `manage/links/` · `profile/` + `profile/[username]/` · `bookmarks/` · `daily-dose/` · `random/` · `leaderboard/` · `users/` · `notifications/` · `settings/` · `tools/` · legal (`privacy`,`terms`,`cookies`).
- Home is composed of `app/(main)/home-components/*` (Hero, About, Features, HowItWorks, Metrics, Feed, FAQ, Tutorial, CTA, Marquee, Reveal, CounterStat, icons). HowItWorks explains category/topic/tag distinction. Tutorial is a 7-tab platform-wide step-by-step guide.
- **admin**: `layout.tsx` (shell + `navLinks` array — add nav entries here) · `dashboard/` · `users/` · `topics/` · `forbidden/`. Admin charts: `app/admin/components/*` (MetricCard, Sparkline, TrendChart, DualTrendChart, DonutChart, PieChart, HorizBarChart, BucketBar, StatTable, FlaggedPanel, RangeSelector, ChartEmpty). Dashboard is sectioned + range-driven: `/api/admin/stats?range=7|30|90|all` returns gap-filled series; charts show `ChartEmpty` when no data.

## Shared components — `components/`
- **common/**: `Navbar`, `Sidebar` (main nav entries here), `Topbar`, `Footer`, `ToastContainer`, `ConfirmModal`, `LoadingSpinner`, `LoadingGlobe`, `ErrorMessage`, `SignInPrompt`, `PasswordInput`, `SortDropdown`, `TopicSelect` (searchable grouped topic picker), `NotificationBell`, `NotificationPanel`, `CustomCursor`, `AnimatedBg`.
- **links/**: `LinkCard` (4 variants; `renderTopic()` badge), `LinkForm`, `LinkPreview`, `TagBadge`.
- **manage/**: `LinkTable`, `BulkActionBar`, `BulkTagModal`, `Pagination`, `StatsCards`.
- **comments/**: `CommentThread`, `CommentItem`, `CommentForm`.
- **recommendations/**: `Slider`.
- **react-bits/**: `Particles`, `ScatteredLinks` (each ships its own `.css`).

## Context providers — `context/`
`AuthContext` · `ToastContext` (`useToast().addToast(msg, 'success'|'error'|'info')`) · `NotificationContext` · `UIContext` · `MobileMenuContext` · `LoadingContext`. All consumed via `useX()` hooks.

## Data layer
- API routes: `app/api/<resource>/route.ts` wrapped in `apiHandler` (`lib/api-utils.ts`).
- DB: `lib/db.ts` exports tagged-template `sql`. **Constraint: the local pg shim + neon driver do NOT support `sql` fragment composition** (nesting `sql\`...\`` fragments). Write per-branch full queries, not composed `whereFrag`/`joinFrag`.
- Migrations: `database/*.sql` (dir is gitignored — force-add). Apply via `node _dbmigrate.js local|neon` or `node scripts/run-sql.js <local|neon> <file>`.
- Short links (`shortened_links` table): auto-expire after 24h; cleanup runs on shorten-API call + dedicated cron `GET /api/cron/cleanup-short-links`. Rate-limited: 10/min anonymous, 30/min logged-in.
- Analytics tables: `link_view_events`, `link_click_events`, `daily_activity`, `saved_links` — fire-and-forget inserts for dashboard charts.

## Feature: Topics taxonomy (reference example)
Self-referencing `topics` table: top-level rows = **topic-types** (groupings, not link-bonded); children = **subtopics** (link-bonded via `links.topic_id`, single per link). Admin-owned; users pick from dropdown; all lists alpha-sorted.
- Admin CRUD: `app/admin/topics/page.tsx` + `app/api/admin/topics/route.ts` + `/[id]/route.ts`.
- Public: `app/api/links/topics/route.ts` (tree+counts), `/topics` hub, `/topics/[topic]`.
- UI: `components/common/TopicSelect.tsx`, badge in `LinkCard` + link detail.

## Adding a feature — checklist
1. Route/page under `app/(main)|admin/`. 2. Component in `components/<domain>/`. 3. Stylesheet `styles/pages/<route>.css`, `@import` in `globals.css` (or in-route). 4. Nav entry: `components/common/Sidebar.tsx` (user) or `app/admin/layout.tsx` `navLinks` (admin). 5. API in `app/api/` via `apiHandler`. 6. `npx tsc --noEmit` + `npm run lint`.
