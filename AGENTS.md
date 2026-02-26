# Prompt Management

## Project Snapshot

Single-page prompt management app built with **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS**, **shadcn/ui**, and **Supabase** (PostgreSQL + Storage). Simple repo structure (no monorepo). Single-user model — owner is set via `SUPABASE_PROMPT_OWNER_USER_ID` env var, no auth UI.

For full architecture details, see [TECHNICAL OVERVIEW.md](TECHNICAL%20OVERVIEW.md).

## Setup Commands

```bash
# Install dependencies
npm install

# Copy and fill environment variables (see "Environment" section below)
cp .env.example .env.local

# Start dev server
npm run dev

# Production build
npm run build

# Start production server
npm run start
```

## Environment

Required in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=<supabase-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<supabase-service-role-key>
SUPABASE_PROMPT_OWNER_USER_ID=<uuid-of-prompt-owner>
```

Optional:

```
NEXT_ALLOWED_DEV_ORIGINS=http://192.168.1.10:3000      # LAN dev access
```

## Universal Conventions

- **Dark-only theme** — `class="dark"` is hardcoded on `<html>`. All styling assumes dark mode.
- **shadcn/ui components** — Use `forwardRef` + CVA variants. See `components/ui/button.tsx` as reference.
- **Tailwind** — Use `cn()` from `lib/utils.ts` for conditional class merging.
- **No external state management** — All state in `PromptStudio` via `useState` hooks.
- **API routes as BFF** — Never query Supabase directly from client components. Always go through `/api/prompts/*` routes.
- **Service role only on server** — API routes use `getSupabaseAdminClient()` from `lib/supabase/server.ts`. The browser client (`lib/supabase/client.ts`) uses the anon key and is only for storage uploads.

## Patterns & Conventions

### Component Pattern

Follow the structure in `components/prompt-card.tsx`:

- `"use client"` directive at top
- Props interface defined inline
- Tailwind classes for styling, `cn()` for conditionals
- Framer Motion for animations (`motion.div`)

### UI Primitive Pattern

Follow `components/ui/button.tsx`:

- `forwardRef` wrapping
- CVA `variants` object for style variants
- Export both the component and its variant props type

### API Route Pattern

Follow `app/api/prompts/route.ts`:

```typescript
export async function GET() {
  try {
    const supabase = getSupabaseAdminClient();
    const userId = getPromptOwnerUserId();
    // ... query scoped by user_id ...
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: buildApiErrorMessage(err) },
      { status: 500 },
    );
  }
}
```

### Variable System

- Bracket-placeholder syntax: `[key]` in prompt content
- Three types: `short_text`, `long_text`, `dropdown`
- Substitution via `replacePromptVariables()` in `lib/prompt-utils.ts`

### DON'Ts

- **DON'T** query Supabase directly from client components (always use API routes)
- **DON'T** use anything other than the service role client in API routes
- **DON'T** add light-mode styles — the app is dark-only
- **DON'T** import server-side Supabase client (`lib/supabase/server.ts`) in client components

## Key Files

| Purpose                 | Path                                   |
| ----------------------- | -------------------------------------- |
| Domain types            | `lib/types.ts`                         |
| API wrappers (client)   | `lib/prompt-api.ts`                    |
| Variable utilities      | `lib/prompt-utils.ts`                  |
| Error extraction        | `lib/api-error.ts`                     |
| Supabase admin client   | `lib/supabase/server.ts`               |
| Supabase browser client | `lib/supabase/client.ts`               |
| Main orchestrator       | `components/prompt-studio.tsx`         |
| API: list + create      | `app/api/prompts/route.ts`             |
| API: update + delete    | `app/api/prompts/[id]/route.ts`        |
| API: image upload       | `app/api/prompts/[id]/upload/route.ts` |

## JIT Index — Quick Find Commands

```bash
# Find all React components
rg -n "export (default function|function|const) " components/

# Find API route handlers
rg -n "export async function (GET|POST|PUT|DELETE)" app/api/

# Find type definitions
rg -n "export (type|interface) " lib/types.ts

# Find UI primitives
rg -n "export const " components/ui/

# Find Supabase queries
rg -n "\.from\(|\.storage\." app/api/ lib/supabase/

# Find all useState hooks in PromptStudio
rg -n "useState" components/prompt-studio.tsx

# Find environment variable usage
rg -n "process\.env\." lib/ app/api/
```

## Security & Secrets

- **Never** commit `.env.local` — it contains `SUPABASE_SERVICE_ROLE_KEY` which bypasses all RLS.
- `SUPABASE_SERVICE_ROLE_KEY` must only be used server-side (in `lib/supabase/server.ts`).
- `SUPABASE_PROMPT_OWNER_USER_ID` scopes all queries — changing it changes which user's data is accessed.
- Variables prefixed `NEXT_PUBLIC_` are exposed to the browser — never put secrets there.

## Common Gotchas

- **No tests** — No test framework is configured. Verify changes manually.
- **No linter** — No ESLint config present. Follow existing code style.
- **Variable keys** must match `[key]` bracket syntax in prompt content exactly.
- **All Supabase queries are scoped** by `user_id = getPromptOwnerUserId()`.
- **Masonry grid** uses CSS `column-count`, not a JS library — layout is automatic.
- **Update = replace variables** — `PUT /api/prompts/[id]` deletes all existing variables then re-inserts. This is intentional (not a partial update).
- The server Supabase client validates the service role key by **decoding the JWT** — invalid keys throw immediately.

## Definition of Done

Before submitting changes, verify:

```bash
# Must pass with no errors
npm run build
```

- TypeScript compilation succeeds (no type errors)
- Manual verification of affected CRUD operations in the browser
- No console errors in browser DevTools
- API routes return correct HTTP status codes
- Changes scoped to agreed-upon files only
