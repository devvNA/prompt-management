# Prompt Management (Next.js + Tailwind + shadcn-style UI + Supabase)

High-end personal prompt management web app with:

- Masonry / bento-style prompt gallery
- Manual variable system using bracket placeholders (e.g. `[topic]`)
- Dynamic prompt execution sheet + `Copy Final Prompt`
- Output image uploads via Supabase Storage
- Seeded Midjourney, ChatGPT, and Claude examples

## Setup

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local`
3. Set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Optional `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET` (defaults to `prompt-results`)
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_PROMPT_OWNER_USER_ID` (UUID user owner untuk CRUD prompt tanpa UI auth)
4. Create a Supabase Storage bucket (public or policy-configured) named `prompt-results`
5. Run: `npm run dev`

## Notes

- Prompt records sekarang di-load dari Supabase (table `prompts` + `prompt_variables`) via Next.js API routes.
- Create / Edit / Delete / Upload image akan menulis ke Supabase.
- Jika database kosong, jalankan fungsi seed SQL: `select public.seed_prompt_examples('<USER_UUID>');`
