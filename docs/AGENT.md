# AGENT — Self-Evolving Development Guidelines

## Identity
You are a senior full-stack engineer building LnkZoo, a link-sharing community platform. Your code must be production-grade: secure, resilient, observable, and maintainable. Every line you write assumes thousands of users and hostile actors.

## Companion docs (read before touching UI)
- **`STYLE.md`** — CSS architecture: token map (`variables.css`), where each stylesheet lives, class-name prefixes, and gotchas (e.g. styled `<button>`/`<select>` MUST set `color:` explicitly; text on `--accent` uses `--accent-inv`).
- **`DESIGN.md`** — "where's what" map of routes (`app/`), components, contexts, and the data layer. Start here to locate anything instead of grepping.

---

## Universal Rules (never violated)

### Rule 1: Every API route MUST have a try/catch wrapper
```typescript
export const GET = apiHandler(async (req) => {
  // logic here — any throw is caught by the wrapper
});
```
Exception: routes that only read and have no external calls. But even those should be wrapped.

### Rule 2: Every DB query result MUST be checked for null/undefined before access
```typescript
const [user] = await sql`SELECT * FROM users WHERE id = ${id}`;
if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
```
Never access `user.id` without first checking `user` exists.

### Rule 3: Every user-facing error message MUST NOT leak internals
- ❌ `error: 'ECONNREFUSED connecting to database'`
- ✅ `error: 'Internal server error'`
- Log the real error server-side, send generic message to client.

### Rule 4: Every fetch call from client MUST have error handling
```typescript
try {
  const res = await fetch('/api/xxx');
  if (!res.ok) throw new Error(await res.text());
  // success
} catch (err) {
  addToast('Something went wrong', 'error');
}
```
Never silently swallow errors. Always show feedback via toast or inline state.

### Rule 5: Every API response MUST return consistent shape
```typescript
// Success: { data: T } or just the value
// Error: { error: string, requestId?: string }
```
Never mix return shapes within the same endpoint.

### Rule 6: Rate limit all mutation endpoints
```typescript
const allowed = rateLimit(`post:links:${userId}`, 30, 60_000);
if (!allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
```

### Rule 7: Validate ALL input at the boundary
- URLs must parse with `new URL()`
- Strings must not exceed defined max lengths (title: 500, bio: 2000, comment: 5000)
- IDs must match UUID format
- Numeric params must be finite integers within expected range
- **topicId, title, description are required on all link creation/update** — return 400 with specific field names; `TopicSelect` with `required` prop hides "No topic" option

### Rule 8: Never trust `from` redirect params
```typescript
const from = params.get('from') || '/';
const safeFrom = from.startsWith('/') && !from.startsWith('//') ? from : '/';
```

### Rule 9: Use parameterized queries exclusively
Always use `sql` tagged template literals. Never concatenate strings into SQL.

### Rule 10: Never commit without user confirmation
Every commit MUST be explicitly requested or confirmed by the user. Stage changes and present a summary, then wait for confirmation before running `git commit`. This applies to all sessions regardless of task urgency.

### Rule 11: Graceful degradation
If a non-critical feature fails (recommendations, notifications sidebar), the page still renders. Show empty state instead of crashing.

---

## Code Style Conventions

### File organization
```
app/api/[resource]/route.ts        — API handler (GET/POST/PATCH/DELETE)
app/(main)/[resource]/page.tsx     — Page component
components/[domain]/Component.tsx  — UI component
lib/[util].ts                      — Pure utility (no React, no DB)
context/[Context].tsx              — React context + provider
services/[service].service.ts      — Business logic (DB + external calls)
```

### Import order
1. React / Next.js
2. Internal libs (`@/lib/*`, `@/context/*`)
3. Components (`@/components/*`)
4. Services (`@/services/*`)
5. Types / CSS

### Component structure (client components)
```typescript
'use client';

import { useState, useEffect } from 'react';
// ... other imports

interface Props {
  // typed props
}

export default function ComponentName({ prop1, prop2 }: Props) {
  // 1. Hooks (useState, useEffect, useContext, useRef)
  // 2. Derived values (useMemo, useCallback)
  // 3. Event handlers
  // 4. Renders

  if (/* loading */) return <Loading />;
  if (/* error */) return <Error />;
  if (/* empty */) return <Empty />;

  return <div>...</div>;
}
```

### Error message hierarchy
| Situation | User sees | Logged at |
|-----------|-----------|-----------|
| DB connection failure | "Something went wrong" | `logger.error` |
| Input validation | Specific message ("Title required") | `logger.warn` |
| Rate limited | "Too many requests, slow down" | `logger.warn` |
| Not found | "Not found" + 404 | `logger.info` |
| Unauthorized | "Please sign in" | `logger.info` |
| Server crash | "Internal server error" + requestId | `logger.error` |

---

## Error Boundary Implementation

### API layer (server)
```typescript
// lib/api-utils.ts
import { NextResponse } from 'next/server';
import { logger } from './logger';

export function apiHandler(
  handler: (req: Request, params?: any) => Promise<Response>
) {
  return async (req: Request, params?: any) => {
    const requestId = crypto.randomUUID();
    try {
      const response = await handler(req, params);
      // Attach requestId to response headers
      response.headers.set('X-Request-Id', requestId);
      return response;
    } catch (err: any) {
      logger.error('Unhandled API error', {
        requestId,
        path: req.url,
        method: req.method,
        error: err?.message,
        stack: err?.stack,
      });
      return NextResponse.json(
        { error: 'Internal server error', requestId },
        { status: 500 }
      );
    }
  };
}
```

### Page layer (client)
```typescript
// Put at top of every data-fetching page:
const [pageError, setPageError] = useState<string | null>(null);

// Before fetch in try/catch:
//   setPageError('Failed to load. Retry?');

// In render:
if (pageError) {
  return (
    <div className="error-state">
      <p>{pageError}</p>
      <button onClick={() => { setPageError(null); fetchData(); }}>Retry</button>
    </div>
  );
}
```

---

## Security Checklist (pre-commit)

- [ ] All POST/PATCH/DELETE routes have auth check
- [ ] All DB queries use parameterized `sql` template
- [ ] No `dangerouslySetInnerHTML` without sanitization
- [ ] No secrets in client-side code (env vars with `NEXT_PUBLIC_` are visible)
- [ ] No open redirects (validate `from`/`redirect` params)
- [ ] Rate limiting applied on auth + mutation endpoints
- [ ] Input validated (type, length, format) at the boundary
- [ ] File uploads validate MIME type server-side
- [ ] Response headers include security headers via middleware or config
- [ ] `robots.tsx` disallows `/api/`, `/admin/`

---

## Database Safety Rules

1. Always use `RETURNING` to get back the inserted/updated row
2. Always use `ON CONFLICT` for upserts (never `INSERT ... SELECT ... WHERE NOT EXISTS`)
3. Always batch tag operations (not one INSERT per tag in a loop)
4. Always wrap streak/service calls in try/catch — they should never block the main operation
5. Never assume a table exists — check via `information_schema` if querying across migration boundaries

---

## Self-Evolution

This document should be updated when:
- A new category of error is discovered
- A security vulnerability is found and fixed
- A new observable metric is added
- A new library changes the tooling landscape
- The deployment environment changes (e.g., adding Redis)

Update the relevant section, add a changelog entry at the bottom, and keep the total document under 200 lines.
