# Developer Tools — `/tools`

The Tools page (`app/(main)/tools/page.tsx`) is fully **public** — no login required for any tool, QR included. Nothing on the page or its APIs is gated by auth (`proxy.ts` does not match `/tools`, the page imports no auth hooks, and none of the tool endpoints call `getSessionFromRequest`).

Cards: **URL Shortener** · **Low Weight File Transfer** · **Text Share** · Meta Scraper (coming soon).

All three share the same result UX: a `.result-box` with the link + Copy button, a `ShortUrlQR` (160×160 white-card QR + "Download QR" PNG export), and live countdowns rendered from server timestamps (`formatCountdown` in `lib/textShareRules.ts` — `MM:SS`, or `H:MM:SS` for ≥ 1 hour).

### Persistence across refresh
Results survive page refreshes via `localStorage` (`lnkzoo_tools_state`, keyed per tool — last result of each tool). On load, entries whose `expiresAt` has not yet passed are restored with correct state: the destroy countdown resumes from the real server timestamp and the rate-limit cooldown ("Next request in…") restores from the stored `nextAllowedAt`. Expired entries are skipped and purged — results are destroyed only by their actual TTL, never by a refresh. Live destruction (countdown hitting 0) also removes the stored entry.

### "Make another" reset buttons
Each tool's result has a reset button that clears **only that tool** (result, countdown, storage entry) while other tools keep their state:
- URL Shortener → **Shorten another URL**
- Low Weight File Transfer → **Share another file**
- Text Share → **Share another text**

The rate-limit cooldown survives the reset, so the fresh form still shows "Next request in…" until the server allows another submission.

---

## 1. URL Shortener

| | |
|---|---|
| Endpoint | `POST /api/tools/shorten` (JSON `{ url }`) |
| Access | Public (guests 10/min, logged-in 30/min — in-memory `lib/rate-limit.ts`) |
| TTL | 24 hours, auto-expired (`shortened_links` table) |
| QR | `ShortUrlQR value={shortResult.shortUrl}` under the result box |

Returns `{ shortCode, shortUrl, expiresAt }` — link is `<appUrl>/s/<code>` and redirects via `app/s/[code]/page.tsx`. Reuses an existing non-expired row for the same URL; reactivates expired rows.

## 2. Low Weight File Transfer

| | |
|---|---|
| Endpoint | `POST /api/tools/upload-temp-file` (multipart `FormData`, field `file`) |
| Access | Public — no auth, works for guests |
| Size cap | 3 MB — rejected early via `content-length` (413), re-checked after parse |
| Rate limit | **1 upload / minute / IP** — DB-backed (`temp_file_limits`), returns `retryAfterMs` on 429 |
| TTL | 5 minutes (`temp_files.expires_at`), UI: "This file will be destroyed in MM:SS" |
| QR | `ShortUrlQR` encodes `<appUrl>/f/<code>` |
| Files | `lib/tempFiles.ts`, `lib/tempFileRules.ts`, `styles/ui/temp-file.css` |
| DB | `docs/db/temp-file-transfer.md` |

### Flow
1. Client pre-checks (size, blocked extension) → `FormData` POST.
2. Server: rate limit → size → type blocklist → lazy prune of expired rows.
3. Uploaded to Cloudinary as `resource_type: 'raw'` base64 data URI (folder `lnkzoo_temp`) — the file **never touches server disk** and is never executed.
4. Row inserted with a random 10-char code; `expires_at = NOW() + 5 minutes`.
5. `GET /f/[code]` proxies the file from Cloudinary with `Content-Disposition: attachment` using the **original filename** (UTF-8 fallback) and the stored `Content-Type`, plus `X-Content-Type-Options: nosniff`. Expired/missing codes self-heal (Cloudinary asset destroyed + row deleted) then 404.

### Security model
- Files served only as forced downloads — the browser never renders them, so HTML/SVG/JS payloads can't execute.
- Type blocklist (html/htm/xhtml/svg/js/mjs/mhtml/hta — checked by extension **and** MIME): blocked uploads get *"This file type is blocked for security. Zip it and upload the .zip instead."*
- Filenames sanitized (`\ / : * ? " < > |` + control chars → `_`) so they can't inject into `Content-Disposition`.
- `/f/[code]` hits throttled per IP (30/min, in-memory) to slow code brute force; 10-char base62 codes (≈8×10¹⁷ space) can't be guessed inside the TTL.
- The Cloudinary CDN URL never reaches the client (server-side proxy only).
- Triple deletion guarantee: cron (`/api/cron/cleanup-temp-files`), lazy prune on every upload, self-heal on access.

## 3. Text Share

| | |
|---|---|
| Endpoint | `POST /api/tools/share-text` (JSON `{ content, expiry }`) |
| Access | Public — no auth, works for guests |
| Size cap | 10,000 chars, trimmed; empty → 400 |
| Expiry | `5m` (5 min) · `1h` (1 hour) · `24h` (24 hours) — server-side allowlist, invalid → 400 |
| Rate limit | **1 share / minute / IP** — DB-backed (`shared_text_limits`), returns `retryAfterMs` on 429 |
| UI | "This text will be destroyed in MM:SS" (hour-aware `H:MM:SS` for 24h) |
| QR | `ShortUrlQR` encodes `<appUrl>/t/<code>` |
| Files | `lib/textShare.ts`, `lib/textShareRules.ts`, `styles/ui/shared-text.css` |
| DB | `docs/db/text-share.md` |

### Flow
1. Client: char counter/limit, expiry segmented picker (5 min / 1 hour / 24 hours), `Share Text` button.
2. Server: expiry allowlist → length check → rate limit → lazy prune → insert with chosen TTL.
3. `GET /t/[code]` renders the text in a scrollable `<pre>` (React-escaped — never `dangerouslySetInnerHTML`), shows the destroy time, plus Copy and home link. Expired/missing codes self-heal (row deleted) then 404; hits throttled per IP (30/min).

### Cleanup
`GET /api/cron/cleanup-shared-texts` — `DELETE FROM shared_texts WHERE expires_at <= NOW()`, works even when nobody visits. Both cleanup crons require header `x-cron-secret` = `CRON_SECRET` env (fail-open if the env is unset so local dev keeps working).

---

## Shared components

- **`components/common/ShortUrlQR.tsx`** — `qrcode.react` `<QRCodeCanvas>` (160×160, black on white so it scans in dark mode) in a fixed 180×180 white card + "Download QR" button (canvas → PNG). Centered; `styles/ui/qr.css`.
- **`lib/textShareRules.ts`** — shared pure constants/helpers used by client and server: `MAX_SHARED_TEXT_CHARS`, `TEXT_SHARE_EXPIRY_OPTIONS`, `formatCountdown`.

## Environment

- Cloudinary: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (already used by image uploads).
- `CRON_SECRET` — protects the two cleanup crons.
- No new env needed for the tools themselves.
