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
│   │   ├── auth/
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   ├── student/
│   │   │   └── page.tsx         # Student chat UI
│   │   ├── professor/
│   │   │   ├── page.tsx         # Professor dashboard
│   │   │   ├── upload/page.tsx  # Upload course materials
│   │   │   └── analytics/page.tsx
│   │   └── api/                 # Next.js API routes (proxy to FastAPI)
│   │       ├── ask/route.ts
│   │       ├── upload/route.ts
│   │       └── analytics/route.ts
│   ├── lib/
│   │   ├── supabase.ts          # Supabase client
│   │   └── utils.ts
│   └── package.json
│
├── backend/                     # FastAPI (Python)
│   ├── main.py                  # All API endpoints
│   ├── services/
│   │   ├── parser.py            # PDF/PPTX/video parsing
│   │   ├── embeddings.py        # OpenAI embeddings + chunking
│   │   ├── rag.py               # LangChain RAG pipeline
│   │   └── analytics.py         # Question clustering
│   └── requirements.txt
│
├── supabase/
│   └── schema.sql               # DB schema + pgvector setup
│
├── .kiro/steering/              # Kiro AI steering documents
├── README.md
└── LICENSE
```

## Conventions

- RAG pipeline logic lives in `backend/services/rag.py`
- All backend routes are in `main.py` (no separate routes/ directory)
- Frontend uses Next.js API routes as a proxy layer to FastAPI
- Never commit API keys; use environment variables
- Supabase handles auth, database (PostgreSQL + pgvector), and file storage
