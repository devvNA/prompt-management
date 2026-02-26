# Technical Overview — Prompt Management

## 1. Project Summary

A single-page **Prompt Management** application for creating, organizing, and executing reusable prompt templates with dynamic variable substitution. Built as a dark-themed web app targeting a single authenticated user (configured via environment variable). Prompts support bracket-placeholder variables (`[key]`), cover images via Supabase Storage, and client-side search/filtering.

---

## 2. Tech Stack

| Layer                | Technology                                  | Version                       |
| -------------------- | ------------------------------------------- | ----------------------------- |
| Framework            | Next.js (App Router)                        | ^15.1.0                       |
| Language             | TypeScript (strict)                         | ^5.7.3                        |
| UI Library           | React                                       | ^18.3.1                       |
| Styling              | Tailwind CSS                                | ^3.4.17                       |
| Component Primitives | shadcn/ui (new-york style) via Radix Dialog | @radix-ui/react-dialog ^1.1.6 |
| Variant Utility      | class-variance-authority (CVA)              | ^0.7.1                        |
| CSS Merge            | tailwind-merge + clsx                       | ^3.0.2 / ^2.1.1               |
| Animation            | Framer Motion                               | ^12.5.0                       |
| Icons                | lucide-react                                | ^0.475.0                      |
| Database / Storage   | Supabase (JS client)                        | ^2.49.1                       |
| Fonts                | Space Grotesk (sans), IBM Plex Mono (mono)  | Google Fonts via `next/font`  |
| Build Tool           | Next.js built-in (SWC)                      | —                             |
| PostCSS              | autoprefixer + tailwindcss                  | ^10.4.20 / ^8.5.3             |

---

## 3. Architecture Overview

### 3.1 Project Structure

```
prompt-management/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root layout (fonts, dark mode, metadata)
│   ├── page.tsx                # Home page → renders <PromptStudio />
│   ├── globals.css             # Tailwind directives + CSS custom properties
│   └── api/prompts/            # API route handlers (BFF layer)
│       ├── route.ts            # GET (list) + POST (create)
│       └── [id]/
│           ├── route.ts        # PUT (update) + DELETE (delete)
│           └── upload/
│               └── route.ts    # POST (image upload)
├── components/                 # Feature + UI components
│   ├── prompt-studio.tsx       # Main orchestrator component
│   ├── prompt-card.tsx         # Prompt card display
│   ├── execution-sheet.tsx     # Prompt execution side panel
│   ├── add-prompt-sheet.tsx    # Create/edit prompt side panel
│   └── ui/                    # shadcn/ui primitives
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── sheet.tsx
│       └── textarea.tsx
├── lib/                        # Shared utilities and config
│   ├── types.ts                # Core domain types
│   ├── utils.ts                # Tailwind cn() utility
│   ├── prompt-api.ts           # Client-side API wrappers (fetch)
│   ├── prompt-utils.ts         # Variable substitution and parsing
│   ├── api-error.ts            # Error message extraction
│   ├── seed.ts                 # Example prompt seed data
│   └── supabase/
│       ├── client.ts           # Browser Supabase client (singleton)
│       └── server.ts           # Server Supabase admin client (service role)
```

### 3.2 Architectural Approach

- **BFF (Backend-for-Frontend)**: Next.js API routes act as a proxy between the browser and Supabase. The client never queries Supabase directly for data operations.
- **Single-user model**: No authentication UI. A fixed `SUPABASE_PROMPT_OWNER_USER_ID` environment variable scopes all CRUD to one user.
- **Server-side privilege**: API routes use the Supabase **service role key** to bypass Row Level Security (RLS) for full data access.
- **Client-side state**: All application state lives in `PromptStudio` via React `useState` hooks — no external state management library.

---

## 4. Core Components

### 4.1 Feature Components

| Component        | File                              | Responsibility                                                                                                                                                                                                                                                                                                                              |
| ---------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PromptStudio`   | `components/prompt-studio.tsx`    | **Main orchestrator**. Holds all app state (~15 `useState` hooks): prompts list, search query, active filters, draft prompt, execution values, flash messages, loading/error states. Renders sidebar filters, search bar, masonry grid of cards, and manages both sheets. Handles all CRUD operations and image upload via `prompt-api.ts`. |
| `PromptCard`     | `components/prompt-card.tsx`      | Card display for a single prompt. Shows cover image (with gradient fallback), model badge, category badge, tags, variable count, and action buttons (Open, Copy, Edit, Delete).                                                                                                                                                             |
| `ExecutionSheet` | `components/execution-sheet.tsx`  | Right-side slide-over for "executing" a prompt. Displays raw template, dynamically generates input fields per variable (`short_text` → Input, `long_text` → Textarea, `dropdown` → select), shows live final prompt preview with substitutions, copy-to-clipboard, image upload, and edit/delete actions.                                   |
| `AddPromptSheet` | `components/add-prompt-sheet.tsx` | Right-side slide-over for creating/editing prompts. Form with title, model, category, tags, content, output image URL/file, and a "Manual Variable System" section for adding/removing variables with key/label/type/options.                                                                                                               |

### 4.2 UI Primitives (shadcn/ui)

All in `components/ui/`, `forwardRef`-based, using CVA for variants:

| Component  | Notes                                                                                                                                                                                  |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Badge`    | Variants: `default`, `indigo`, `muted`                                                                                                                                                 |
| `Button`   | Variants: `default` (indigo glow), `secondary`, `ghost`, `outline`, `destructive`. Sizes: `default`, `sm`, `lg`, `icon`. Supports `asChild` via Radix Slot.                            |
| `Card`     | Dark glassmorphic card with `rounded-2xl`, `backdrop-blur-sm`. Sub-components: `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`.                              |
| `Input`    | `rounded-xl` dark input with indigo focus ring.                                                                                                                                        |
| `Label`    | Styled label element.                                                                                                                                                                  |
| `Sheet`    | Built on Radix Dialog. Slide-in panel with `top`/`bottom`/`left`/`right` variants, overlay with blur. Sub-components: `SheetContent`, `SheetHeader`, `SheetTitle`, `SheetDescription`. |
| `Textarea` | `rounded-xl` dark textarea.                                                                                                                                                            |

---

## 5. Component Interactions & Data Flow

```
┌──────────────────────────────────────────────────────────┐
│  Browser                                                  │
│                                                           │
│  PromptStudio (state manager)                            │
│    ├── PromptCard[] (masonry grid)                        │
│    │     └── onClick → opens ExecutionSheet              │
│    ├── ExecutionSheet                                     │
│    │     ├── Variable inputs → live preview               │
│    │     ├── Copy final prompt                            │
│    │     └── Upload image → POST /api/prompts/[id]/upload│
│    └── AddPromptSheet                                     │
│          └── Submit → POST or PUT /api/prompts           │
│                                                           │
│  prompt-api.ts (fetch wrappers)                          │
│    ├── fetchPromptsApi()   → GET  /api/prompts           │
│    ├── createPromptApi()   → POST /api/prompts           │
│    ├── updatePromptApi()   → PUT  /api/prompts/[id]      │
│    ├── deletePromptApi()   → DELETE /api/prompts/[id]    │
│    └── uploadPromptResultImageApi()                       │
│                             → POST /api/prompts/[id]/upload│
└──────────────────┬───────────────────────────────────────┘
                   │ HTTP (JSON / FormData)
┌──────────────────▼───────────────────────────────────────┐
│  Next.js API Routes (Server)                             │
│    └── getSupabaseAdminClient() (service role)           │
│         └── All queries scoped by user_id                │
└──────────────────┬───────────────────────────────────────┘
                   │ Supabase JS Client (service role)
┌──────────────────▼───────────────────────────────────────┐
│  Supabase                                                 │
│    ├── PostgreSQL: prompts, prompt_variables,             │
│    │               prompt_outputs tables                  │
│    └── Storage: prompt-results bucket                     │
└──────────────────────────────────────────────────────────┘
```

### Communication Methods

- **Browser → API Routes**: Standard `fetch()` calls via wrapper functions in `lib/prompt-api.ts`. JSON bodies for CRUD; `FormData` for image uploads.
- **API Routes → Supabase**: `@supabase/supabase-js` client with service role key. Each route handler creates a fresh admin client via `getSupabaseAdminClient()`.
- **State Updates**: After API calls, `PromptStudio` updates local state directly (adds/replaces/removes items from the prompts array). No optimistic updates — waits for API response.

---

## 6. API Endpoints

| Method   | Path                       | Operation                         | Request Body               | Response                                        |
| -------- | -------------------------- | --------------------------------- | -------------------------- | ----------------------------------------------- |
| `GET`    | `/api/prompts`             | List all prompts for owner        | —                          | `PromptItem[]` (with joined `prompt_variables`) |
| `POST`   | `/api/prompts`             | Create prompt + variables         | `PromptUpsertInput` (JSON) | Created `PromptItem`                            |
| `PUT`    | `/api/prompts/[id]`        | Update prompt (replace variables) | `PromptUpsertInput` (JSON) | Updated `PromptItem`                            |
| `DELETE` | `/api/prompts/[id]`        | Delete prompt                     | —                          | `{ success: true }`                             |
| `POST`   | `/api/prompts/[id]/upload` | Upload image to Storage           | `FormData` (file field)    | `{ publicUrl, storagePath }`                    |

### API Error Handling

All route handlers follow the same pattern:

1. Wrap logic in `try/catch`
2. Extract error details via `buildApiErrorMessage()` which handles `Error` instances and Supabase Postgrest errors (`message`, `details`, `hint`, `code`)
3. Return structured JSON error with appropriate HTTP status

---

## 7. Database Schema (Inferred)

### Table: `prompts`

| Column                      | Type        | Notes                                          |
| --------------------------- | ----------- | ---------------------------------------------- |
| `id`                        | uuid (PK)   | Auto-generated                                 |
| `user_id`                   | uuid (FK)   | Owner filter                                   |
| `title`                     | text        | Required                                       |
| `model`                     | text        | e.g. "ChatGPT", "Claude", "Midjourney"         |
| `category`                  | text        | e.g. "Writing", "Coding", "Image Generation"   |
| `tags`                      | text[]      | Array of strings                               |
| `content`                   | text        | Prompt template with `[variable]` placeholders |
| `output_image_url`          | text        | Nullable, public URL of cover image            |
| `output_image_storage_path` | text        | Nullable, Supabase Storage path                |
| `created_at`                | timestamptz | Auto-set                                       |

### Table: `prompt_variables`

| Column             | Type                | Notes                                    |
| ------------------ | ------------------- | ---------------------------------------- |
| `id`               | uuid (PK)           | Auto-generated                           |
| `prompt_id`        | uuid (FK → prompts) | Cascade delete expected                  |
| `key`              | text                | Variable key matching `[key]` in content |
| `label`            | text                | Human-readable label                     |
| `type`             | text                | `short_text` / `long_text` / `dropdown`  |
| `dropdown_options` | text[]              | Nullable, for dropdown type              |
| `sort_order`       | int                 | Nullable, display order                  |

### Table: `prompt_outputs`

| Column         | Type                | Notes                   |
| -------------- | ------------------- | ----------------------- |
| `prompt_id`    | uuid (FK → prompts) |                         |
| `user_id`      | uuid                |                         |
| `image_url`    | text                | Public URL              |
| `storage_path` | text                | Storage path            |
| `is_cover`     | boolean             | Always `true` on upload |

### Storage Bucket: `prompt-results`

Files stored at path: `{promptId}/{timestamp}-{sanitizedFilename}`

---

## 8. Environment Variables

| Variable                              | Required | Scope           | Description                                      |
| ------------------------------------- | -------- | --------------- | ------------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`            | Yes      | Client + Server | Supabase project URL                             |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`       | Yes      | Client + Server | Supabase anon/public key                         |
| `SUPABASE_SERVICE_ROLE_KEY`           | Yes      | Server only     | Supabase service role key (bypasses RLS)         |
| `SUPABASE_PROMPT_OWNER_USER_ID`       | Yes      | Server only     | UUID of the single prompt owner                  |
| `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET` | No       | Client + Server | Storage bucket name (default: `prompt-results`)  |
| `NEXT_ALLOWED_DEV_ORIGINS`            | No       | Server only     | Comma-separated extra origins for dev LAN access |

---

## 9. Library Modules

| File                     | Exports                                                                                                                                              | Purpose                                                                      |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `lib/types.ts`           | `PromptVariableType`, `PromptVariable`, `PromptItem`                                                                                                 | Core domain type definitions                                                 |
| `lib/utils.ts`           | `cn()`                                                                                                                                               | Tailwind class merge utility (`clsx` + `tailwind-merge`)                     |
| `lib/prompt-api.ts`      | `fetchPromptsApi`, `createPromptApi`, `updatePromptApi`, `deletePromptApi`, `uploadPromptResultImageApi`, `PromptUpsertInput`, `PromptVariableInput` | Client-side API wrapper functions using `fetch()`                            |
| `lib/prompt-utils.ts`    | `replacePromptVariables`, `normalizeVariableKey`, `parseTags`, `parseDropdownOptions`, `createBlankVariable`                                         | Pure utility functions for variable substitution and parsing                 |
| `lib/api-error.ts`       | `buildApiErrorMessage`                                                                                                                               | Extracts human-readable error messages from Error or Postgrest error objects |
| `lib/seed.ts`            | `seededPrompts`                                                                                                                                      | 3 example `PromptItem` objects (Midjourney, ChatGPT, Claude) for reference   |
| `lib/supabase/client.ts` | `getSupabaseBrowserClient`, `uploadPromptResultImage`                                                                                                | Browser-side Supabase singleton + direct storage upload (alternative path)   |
| `lib/supabase/server.ts` | `getSupabaseAdminClient`, `getPromptOwnerUserId`, `getPromptResultsBucket`                                                                           | Server-side admin client with service role key validation (decodes JWT)      |

---

## 10. Runtime Behavior

### 10.1 Initialization

1. `RootLayout` (`app/layout.tsx`) loads Space Grotesk and IBM Plex Mono fonts, forces dark mode via `class="dark"` on `<html>`, sets page metadata.
2. `HomePage` (`app/page.tsx`) renders `<PromptStudio />`.

### 10.2 Data Loading

1. `PromptStudio` fires `fetchPromptsApi()` on mount via `useEffect`.
2. API route `GET /api/prompts` queries Supabase for all prompts with joined `prompt_variables`, ordered by `created_at` desc, filtered by `user_id`.
3. While loading, a skeleton placeholder is shown. On failure, a red error card with a retry button appears.

### 10.3 Filtering & Search

- All filtering is **client-side** — no server-side pagination or filtering.
- `useDeferredValue` debounces the search query for smooth input.
- `useMemo` computes derived filter options (unique categories, unique models) from the prompts array.
- `filteredPrompts` applies search (title, content, tags, model) + category dropdown + model dropdown.

### 10.4 Prompt Execution

1. User clicks a card → `ExecutionSheet` opens.
2. Dynamic form is generated from the prompt's variables (Input for `short_text`, Textarea for `long_text`, `<select>` for `dropdown`).
3. `replacePromptVariables()` performs live regex substitution (`/\[([^\]]+)\]/g`) to generate the final prompt preview.
4. "Copy Final Prompt" copies the substituted text to clipboard.

### 10.5 CRUD Operations

- **Create**: `AddPromptSheet` → `createPromptApi()` → `POST /api/prompts` → Supabase insert for prompt + variables → state updated.
- **Edit**: Pre-populated `AddPromptSheet` → `updatePromptApi()` → `PUT /api/prompts/[id]` → Supabase update prompt + delete-all/re-insert variables → state updated.
- **Delete**: Confirmation dialog → `deletePromptApi()` → `DELETE /api/prompts/[id]` → Supabase delete → state updated.

### 10.6 Image Upload

1. From `ExecutionSheet`, user selects a file.
2. `uploadPromptResultImageApi()` sends `FormData` to `POST /api/prompts/[id]/upload`.
3. Server uploads file to Supabase Storage at `{promptId}/{timestamp}-{sanitizedFilename}`.
4. Server updates `prompts.output_image_url` and inserts a row in `prompt_outputs`.
5. Client updates local state with the new image URL.

### 10.7 Error Handling

- **API layer**: `parseJsonOrThrow()` in `prompt-api.ts` checks `response.ok` and throws with the server error message.
- **UI layer**: Errors are displayed as flash messages (auto-dismiss after 1.8 seconds via `useEffect` timeout). Load failures show a persistent red error card with retry.

---

## 11. Key Patterns & Conventions

### Variable System

- Bracket-placeholder approach: `[key]` in prompt content maps to defined variables.
- Three variable types: `short_text`, `long_text`, `dropdown`.
- Variables are fully user-defined (add/edit/remove in `AddPromptSheet`), stored in the `prompt_variables` table, and linked via `prompt_id`.

### Styling

- Dark-only theme (hardcoded `class="dark"` on `<html>`).
- CSS custom properties defined in `app/globals.css` for theme colors.
- Indigo accent color throughout.
- Masonry grid via CSS `column-count` (responsive: 1 → 2 → 3 → 4 columns).
- Background: radial gradients + grid pattern for visual depth.
- `rounded-2xl` / `rounded-xl` for soft edges; `backdrop-blur-sm` for glass effect.

### Supabase Configuration

- **Server**: `getSupabaseAdminClient()` creates a new client per call with `persistSession: false`, `autoRefreshToken: false`. Validates the service role key by decoding its JWT payload.
- **Browser**: Singleton pattern in `getSupabaseBrowserClient()` with anon key — currently only used for the alternative `uploadPromptResultImage()` path.
- All data queries use the admin client through Next.js API routes, not direct browser → Supabase.

### Build & Dev Commands

| Command         | Description              |
| --------------- | ------------------------ |
| `npm run dev`   | Start Next.js dev server |
| `npm run build` | Production build         |
| `npm run start` | Start production server  |

> **Note**: No test framework, linter configuration, or CI/CD pipeline is currently present in the project.
