# OpenHours — Frontend

Next.js 16 (App Router) frontend for OpenHours. UI is built with Tailwind CSS v4, framer-motion, and lucide-react.

> ⚠️ This project uses **Next.js 16**, which has breaking changes from earlier versions. Read [`AGENTS.md`](./AGENTS.md) before writing or modifying any Next.js code.

## Run locally

```bash
npm install
npm run dev      # http://localhost:3000
```

The dev server expects the FastAPI backend to be reachable at `FASTAPI_URL` (defaults to `http://localhost:8000`).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start dev server on port 3000 |
| `npm run build` | Production build |
| `npm start` | Run the production build |
| `npm run lint` | ESLint |

## Environment variables

Copy `.env.example` to `.env.local` and fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
FASTAPI_URL=http://localhost:8000
```

## Structure

- `app/api/*/route.ts` — authenticated proxy routes that verify course access before forwarding to the FastAPI backend.
- `app/student/page.tsx` — chat UI; reads/writes `chat_sessions` and `chat_messages` directly via Supabase.
- `app/professor/*` — dashboard, upload, and analytics pages; talks to Supabase directly for course/document/analytics queries.
- `lib/supabase.ts` — browser Supabase client (`createBrowserClient` from `@supabase/ssr`).
- `lib/supabase-server.ts` — route-handler Supabase client used to validate bearer tokens and RLS-backed access.

For the full project overview see the [root README](../README.md). For codebase guidance see the [root CLAUDE.md](../CLAUDE.md).
