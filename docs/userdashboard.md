# User Link Management Dashboard

## Overview
A full-featured dashboard for users to manage all their links in one place — bulk operations, filtering, search, sorting, and statistics.

## Routes

### Page
| Route | File | Purpose |
|-------|------|---------|
| `/manage/links` | `app/(main)/manage/links/page.tsx` | Main dashboard |

### API
| Method | Route | File | Purpose |
|--------|-------|------|---------|
| GET | `/api/user/links` | `app/api/user/links/route.ts` | Fetch user's links (paginated, searchable, sortable) with per-link stats |
| POST | `/api/user/links/bulk-delete` | `app/api/user/links/bulk-delete/route.ts` | Delete multiple links by IDs |
| PATCH | `/api/user/links/bulk-visibility` | `app/api/user/links/bulk-visibility/route.ts` | Change visibility of multiple links |
| POST | `/api/user/links/bulk-tag` | `app/api/user/links/bulk-tag/route.ts` | Add/remove tags on multiple links |
| GET | `/api/user/links/stats` | `app/api/user/links/stats/route.ts` | Aggregate stats for user's links |

## Components

| Component | File | Purpose |
|-----------|------|---------|
| StatsCards | `components/manage/StatsCards.tsx` | Top stat row (total, public, followers-only, private, total likes, total views) |
| LinkTable | `components/manage/LinkTable.tsx` | Sortable, selectable table with columns: checkbox, title, visibility, tags, likes, views, comments, created |
| BulkActionBar | `components/manage/BulkActionBar.tsx` | Floating bar showing selected count + bulk action buttons (Delete, Visibility, Tag) |
| BulkTagModal | `components/manage/BulkTagModal.tsx` | Modal for adding/removing tags from selected links |
| Pagination | `components/manage/Pagination.tsx` | Page controls |

## Data Flow

```
Page Mount
  └─ GET /api/user/links/stats → StatsCards
  └─ GET /api/user/links?page=1&sort=created_at&order=desc&q= → LinkTable

User checks rows → BulkActionBar appears with selected count
  ├─ Click "Delete" → ConfirmModal → POST /api/user/links/bulk-delete { ids } → refresh
  ├─ Click "Visibility" → dropdown → PATCH /api/user/links/bulk-visibility { ids, visibility } → refresh
  └─ Click "Tag" → BulkTagModal → POST /api/user/links/bulk-tag { ids, addTags, removeTags } → refresh

User clicks row → navigate to /link/[id]
User clicks sort header → re-fetch with new sort/order
User searches → re-fetch with q= param
User changes page → re-fetch with page=N
```

## Database
No schema changes needed. Uses existing `links`, `tags`, `link_tags` tables.

## CSS
- `styles/pages/manage-links.css` — imported directly in page (like `submit-bulk.css`)
- Naming prefix: `.ml-*`
- Dark/light theme via CSS variables

## Sidebar
Add "My Links" to the **Create** section in `Sidebar.tsx`, before "Post Link".

## Implementation Order
1. API routes (stats, links list, bulk-delete, bulk-visibility, bulk-tag)
2. CSS file
3. Components (StatsCards, LinkTable, BulkActionBar, BulkTagModal, Pagination)
4. Main page
5. Sidebar nav item
