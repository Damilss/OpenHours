# Project Structure

OpenHours is a full-stack application with Next.js frontend and FastAPI backend.

## Current Layout

```
OpenHours/
├── frontend/                    # Next.js app (App Router)
│   ├── app/
│   │   ├── page.tsx             # Landing page
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   ├── not-found.tsx        # Custom 404
│   │   ├── icon.png             # Favicon
│   │   ├── auth/
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   └── verify/page.tsx  # Email verification holding page
│   │   ├── student/
│   │   │   └── page.tsx         # Student chat UI + chat session sidebar
│   │   ├── professor/
│   │   │   ├── page.tsx         # Professor dashboard
│   │   │   ├── upload/page.tsx  # Upload course materials
│   │   │   └── analytics/page.tsx
│   │   └── api/                 # Next.js API routes (proxy to FastAPI)
│   │       ├── ask/route.ts
│   │       ├── upload/route.ts
│   │       └── analytics/route.ts
│   ├── lib/
│   │   ├── supabase.ts          # Browser-only Supabase client
│   │   └── utils.ts             # cn() className helper
│   ├── public/                  # Logo assets
│   ├── AGENTS.md                # Next.js 16 caveat for AI assistants
│   └── package.json
│
├── backend/                     # FastAPI (Python)
│   ├── main.py                  # All API endpoints
│   ├── services/
│   │   ├── parser.py            # PDF/PPTX/audio parsing
│   │   ├── embeddings.py        # OpenAI embeddings + chunking
│   │   ├── rag.py               # RAG pipeline (retrieval + chat)
│   │   └── analytics.py         # GPT-based question clustering
│   └── requirements.txt
│
├── supabase/
│   └── schema.sql               # DB schema + pgvector setup + RLS
│
├── .kiro/steering/              # Kiro AI steering documents
├── DEPLOYMENT.md                # Vercel + Railway deploy guide
├── CLAUDE.md                    # Guidance for AI coding assistants
├── README.md
└── LICENSE
```

## Conventions

- RAG pipeline logic lives in `backend/services/rag.py`
- All backend routes are in `main.py` (no separate routes/ directory)
- Frontend uses Next.js API routes as a proxy layer to FastAPI
- Never commit API keys; use environment variables
- Supabase handles auth, database (PostgreSQL + pgvector), and file storage
