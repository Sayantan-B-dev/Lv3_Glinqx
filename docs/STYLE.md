# STYLE — CSS Architecture & Conventions

Quick-reference map so you can jump straight to the right stylesheet without grepping. Aesthetic: **JetBrains Mono dev/terminal** theme, dark-default with `[data-theme="light"]`.

## Loading model
- `app/layout.tsx` imports **`styles/globals.css`** (the only global entry).
- `globals.css` `@import`s everything in order: `core/*` → `layout/*` → `ui/*` → `pages/*` → `components/*`.
- **3 page CSS files are imported directly in their route** (NOT in globals): `pages/admin.css` (`app/admin/layout.tsx`), `pages/manage-links.css` (`app/(main)/manage/links/page.tsx`), `pages/submit-bulk.css` (`app/(main)/submit/bulk/page.tsx`).
- Home sub-sections: `pages/home.css` `@import`s all of `pages/home-component-css/*`.
- If you add a page stylesheet, add its `@import` to `globals.css` (or import in-route like the 3 above).

## Design tokens — `styles/core/variables.css`
All colors/sizing are CSS vars on `:root` (dark) + `[data-theme="light"]`. Never hardcode hex; use tokens.
- Surfaces: `--bg` (base) → `--bg-1` → `--bg-2` → `--bg-3` → `--bg-4` (increasingly raised).
- Borders: `--border` (default) · `--border-md` (hover/emphasis) · `--border2` (strong).
- Text: `--text` (primary) → `--text-2` → `--text-3` → `--text-4` (faintest).
- Accent: `--accent` + **`--accent-inv`** (foreground ON accent — dark theme `--accent` is near-white, so text on accent MUST use `--accent-inv`, never `#fff`).
- Fonts: `--font` = `--font-mono` = `'JetBrains Mono','Geist Mono',monospace`. Use `var(--font)`; never hardcode font names.
- Shared: `--radius:6px` · `--sidebar-w:220px` · `--sidebar-c:56px` (collapsed) · `--header-h:52px` · `--t:.18s ease` (standard transition).

## Gotchas (learned the hard way)
- **Native `<button>`/`<select>` do NOT inherit text color.** Any styled button/select MUST set `color:` explicitly or text goes invisible (system default vs dark bg). See `.adm-action-btn`, `.adm-role-select`.
- **Text on `--accent` uses `--accent-inv`**, not `#fff` (accent is light in dark theme).
- **Required `TopicSelect` state**: `.topic-select-trigger.required` adds a red border (`var(--red, #ef4444)`) when the required field is empty.
- Per-topic colors: passed via inline `style={{ background: color }}` / `--topic-color` custom prop + `color-mix()`; the palette source is `PRESET_COLORS` in `app/admin/topics/page.tsx`.

## Class-name prefixes (namespacing by area)
| Prefix | Area | File |
|--------|------|------|
| `.adm-*` | Admin dashboard/tables/cards | `pages/admin.css` |
| `.topic-adm-*` | Admin topics manager | `pages/admin.css` |
| `.topic-select-*` | Topic dropdown component | `ui/topic-select.css` |
| `.card-*` / `.card-topic-badge` | Link cards | `ui/link-card.css` |
| `.confirm-*` | ConfirmModal | `components/common.css` |
| `.admin-*` | Admin shell (sidebar/logo/nav) | `pages/admin.css` |
| `.hiw-*` | How It Works home section | `pages/home-component-css/howitworks.css` |
| `.tutorial-*` | Platform guide home section | `pages/home-component-css/tutorial.css` |
| `.ml-*` | Manage links page | `pages/manage-links.css` |
| `.bulk-*` | Bulk upload page | `pages/submit-bulk.css` |
| `.tool-*` | Developer tools page | — |

## Where things live
- **Core**: `core/variables.css` (tokens) · `core/reset.css` · `core/typography.css` (html 13px, `--font` on body + form els) · `core/utilities.css` · `core/animations.css`.
- **Layout shell**: `layout/{layout,main,content,sidebar,topbar,tabs,mobile-menu,responsive}.css`.
- **UI widgets**: `ui/{link-card,topic-select,toast,sort,slider,popup,comments,custom-cursor,animated-bg,loading-globe}.css`.
- **Pages**: `pages/<route>.css` (name matches route). Legal pages share `pages/legal.css`.
- **Shared component CSS**: `components/common.css`.

## Conventions
- No CSS-in-JS / Tailwind. Plain CSS files, BEM-ish flat classes with area prefix.
- Responsive: prefer per-file `@media` blocks; global breakpoints live in `layout/responsive.css`. Common breakpoints: `768px`, `600px`, `480px`.
- Transitions use `var(--t)`. Radius uses `var(--radius)` (or explicit for pills: `100px`).
