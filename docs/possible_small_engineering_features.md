# Small Engineering Features — Status

All 8 features are implemented and verified. Below are the completion details and any known edge cases.

---

## 1. Edit Link — ✅ DONE

**Files:**
- `app/(main)/link/[id]/page.tsx` — edit mode form (title, description, tags)
- `app/api/links/[id]/route.ts` — PATCH handler with tag support

**Known issues / edge cases:**
- Empty tags array clears all existing tags (by design — user explicitly removed them)
- Tag `usage_count` no longer inflates on edit — uses `ON CONFLICT DO NOTHING` with separate SELECT fallback
- Edit form uses `edit-link-form` class with no dedicated CSS (falls back to flex layout from parent)
- Response from PATCH is minimal (`id, title, description, visibility` only); frontend re-fetches via `fetchData()`

---

## 2. Bookmark / Save Links — ✅ DONE

**Files:**
- `app/api/links/[id]/bookmark/route.ts` — POST/DELETE toggle
- `app/api/user/bookmarks/route.ts` — GET list (includes `liked_by_user`, manually injects `bookmarked_by_user`)
- `app/(main)/bookmarks/page.tsx` — bookmarks list page
- `components/links/LinkCard.tsx` — bookmark icon in footer with auth guard
- `database/init.sql` — `saved_links` table (migration: `CREATE TABLE saved_links ... UNIQUE(user_id, link_id)`)

**Known issues / edge cases:**
- Bookmark state only shows correctly on bookmarks page (manually sets `bookmarked_by_user: true`). Feed/list APIs don't return `bookmarked_by_user`, so LinkCards elsewhere show unbookmarked state
- LinkCard bookmark handler now checks auth via `GET /api/auth/me` before calling the API, redirects to `/login` if unauthenticated
- DELETE on non-existent bookmark returns `{ bookmarked: false }` without error (harmless)

---

## 3. User Settings Page — ✅ DONE

**Files:**
- `app/(main)/settings/page.tsx` — change password, delete account, account info display
- `app/api/auth/password/route.ts` — PATCH with strength validation (server-side)
- `app/api/auth/account/route.ts` — DELETE with confirm text check
- `app/api/auth/email/route.ts` — PATCH (exists but email change card removed from UI; email is fixed per account)

**Known issues / edge cases:**
- Delete requires typing `DELETE MY ACCOUNT` (case-sensitive, exact match)
- Password strength validated both client-side (meter + checklist) and server-side:
  - Min 8 chars, 1 lowercase, 1 uppercase, 1 number, 1 special character
- Cascading delete assumes foreign keys have `ON DELETE CASCADE`; otherwise DB will reject
- Password change has no secondary confirmation step (immediate on submit)
- Auth cookie cleared both by API response and client-side `logout()` call (harmless redundancy)

---

## 4. OG Meta Tags on Short URLs — ✅ DONE

**Files:**
- `app/s/[code]/page.tsx` — renders OG/Twitter meta tags + auto-redirect + click tracking

**Known issues / edge cases:**
- Origin hardcoded to `https://lnkzoo.vercel.app` for OG URLs — should use `process.env.NEXT_PUBLIC_BASE_URL` in production
- Short links from `shortened_links` (24hr expiry) have no preview image; OG image tag omitted
- Both `<meta httpEquiv="refresh">` and `<script>window.location.href</script>` redirect — meta refresh alone is sufficient
- Click tracking: only the matched table's `click_count` increments (not both). Link owners won't see short URL clicks aggregated in their link stats
- DB errors silently caught with `.catch(() => {})`

---

## 5. Share Button — ✅ DONE

**Files:**
- `components/links/LinkCard.tsx` — share icon in footer
- `app/(main)/link/[id]/page.tsx` — share button in detail page footer

**Known issues / edge cases:**
- Uses `navigator.share()` with `navigator.clipboard.writeText()` fallback
- Clipboard requires secure context (HTTPS or localhost); non-HTTPS environments show "Failed to copy"
- Share cancellation in native dialog is silently caught (no feedback)
- Detail page share button has `title="Share"` attribute

---

## 6. Notification List Page — ✅ DONE

**Files:**
- `app/(main)/notifications/page.tsx` — notification list with type icons, unread badge, mark-all-read
- `app/api/notifications/route.ts` — GET (unread count + 30 recent) + PATCH (mark all read)
- `app/api/comments/route.ts` — creates `reply` notifications (link owner + parent author)
- `app/api/links/[id]/like/route.ts` — creates `like` notifications
- `app/api/users/[username]/follow/route.ts` — creates `follow` notifications
- `app/api/links/[id]/flag/route.ts` — creates `flag` notifications (link owner + all admins)
- `services/notification.service.ts` — type union now includes `'flag'`
- `components/common/Sidebar.tsx` — red dot indicator on nav when unread > 0

**Known issues / edge cases:**
- Notifications paginated at 30 max (no cursor/offset)
- `entity_id` fixed: comment notifications now use `linkId` so clicking navigates to correct link
- Flag route runs a `for` loop over admins (one INSERT per admin) — fine for small admin count
- Notification service doesn't check if recipient blocked the actor before inserting
- `typeIcon` handles: `like` (heart), `reply` (speech bubble), `follow` (person), `mention` (pushpin), `flag` (warning)

---

## 7. Simple Link Click Tracking — ✅ DONE

**Files:**
- `app/s/[code]/page.tsx` — increments `click_count` on either `shortened_links` or `links` based on match

**Known issues / edge cases:**
- Only the matched table's count increments (not both)
- `view_count` is NOT incremented on redirect (only on link detail page load via `GET /api/links/[id]`)
- No unique index check on `short_code` — uses `LIMIT 1`
- Expired short link + same code in `links.short_code` silently redirects to link URL (no "expired" message)

---

## 8. Block User UI — ✅ DONE

**Files:**
- `app/api/users/[username]/block/route.ts` — POST (block) + DELETE (unblock), removes follows both ways
- `app/(main)/profile/[username]/page.tsx` — Block/Unblock toggle button with `isBlocked` state
- `app/api/users/[username]/route.ts` — returns `isBlocked` field

**Known issues / edge cases:**
- API returns `isBlocked` so frontend can toggle between "Block" (red) / "Unblock" (neutral) labels and colors
- Block/unblock calls `fetchProfile()` to refresh state
- Block does NOT prevent further interaction in other APIs (comments, likes, bookmarks, follows) — no block checks exist in those routes
- Blocked user's content may still appear in feeds (no WHERE clause filtering blocks)
- API auto-unfollows both directions on block
- Cannot block yourself (400)
