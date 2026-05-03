# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OpenHours is an AI-powered office hours platform. Professors upload course materials (PDF, PPTX, video); students ask questions and get AI-guided answers scoped strictly to those materials. The AI uses RAG (Retrieval Augmented Generation) over pgvector embeddings.

## Dev Commands

### Frontend (Next.js — `frontend/`)
```bash
cd frontend
npm run dev       # start dev server at localhost:3000
npm run build     # production build
npm run lint      # ESLint
```

### Backend (FastAPI — `backend/`)
```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000   # start dev server
```

Backend requires a `.env` file with `OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.

Frontend requires `.env.local` with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `FASTAPI_URL` (defaults to `http://localhost:8000`).

### Database
Run `backend/schema.sql` in the Supabase SQL Editor after enabling the `vector` extension (Dashboard → Database → Extensions).

## Architecture

Two separate runtimes that must both be running locally:

```
Browser → Next.js frontend (port 3000)
             ↓ /api/* routes (thin proxies only)
          FastAPI backend (port 8000)
             ↓
          Supabase (Postgres + pgvector + Storage + Auth)
             ↓
          OpenAI API (embeddings + chat)
```

### Key non-obvious facts

**Next.js API routes are pure proxies.** `frontend/app/api/*/route.ts` files only forward requests to FastAPI — no business logic lives there. All RAG, parsing, and AI calls are in Python.

**LangChain is used only for text splitting.** Despite being a dependency, LangChain's vectorstore abstraction is not used. Embeddings and retrieval are done via the raw OpenAI SDK and Supabase RPC (`match_documents` function) directly. See `backend/services/embeddings.py` and `backend/services/rag.py`.

**shadcn/ui is not installed.** The project spec mentions it but it is not in `package.json`. UI is built with Tailwind CSS v4 + lucide-react + framer-motion.

**Next.js 16 has breaking changes.** Read `frontend/node_modules/next/dist/docs/` before writing any Next.js code — APIs and conventions differ from earlier versions.

**Supabase client is browser-only.** `frontend/lib/supabase.ts` exports only a `createBrowserClient`. There is no server-side client; server actions must go through the FastAPI backend.

**Auth roles are in a `profiles` table**, not in Supabase Auth metadata. A Postgres trigger (`handle_new_user`) auto-creates a profile row on signup, pulling `role` and `full_name` from `raw_user_meta_data`. Middleware should redirect based on `profiles.role`.

**Analytics clustering uses GPT.** `backend/services/analytics.py` calls `gpt-4o-mini` to group recent `question_logs` into topic clusters. It is capped at the 50 most recent questions.

### Backend services (`backend/services/`)

| File | Responsibility |
|---|---|
| `parser.py` | Extract text from PDF (pypdf), PPTX (python-pptx), audio/video (OpenAI Whisper API) |
| `embeddings.py` | Chunk text (500 tokens, 50 overlap) → embed via `text-embedding-3-small` → insert into `documents` table |
| `rag.py` | Embed question → `match_documents` RPC → build prompt with top-6 chunks → call `gpt-4o-mini` → log to `question_logs` |
| `analytics.py` | Aggregate `question_logs` → cluster into topics via GPT |

### Database tables

| Table | Purpose |
|---|---|
| `profiles` | Extends `auth.users`; stores `role` (professor/student) |
| `courses` | Owned by a professor; scopes all content and queries |
| `documents` | Parsed text chunks + `vector(1536)` embeddings |
| `question_logs` | Every student question logged for analytics |

Semantic search is performed via the `match_documents(query_embedding, match_course_id, match_count)` Postgres function using cosine distance (`<->`).

### Frontend routes

| Route | Role |
|---|---|
| `/` | Landing page |
| `/auth/login`, `/auth/signup` | Auth (role selected at signup, stored in `raw_user_meta_data`) |
| `/auth/verify` | Email verification holding page |
| `/student` | Chat UI |
| `/professor` | Dashboard |
| `/professor/upload` | File upload |
| `/professor/analytics` | Topic analytics |
