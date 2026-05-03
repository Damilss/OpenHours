# Project Structure

OpenHours is organized as a monorepo with separate frontend and backend applications.

## Repository Structure

```
openhours/
├── frontend/                    # Next.js app
│   ├── app/
│   │   ├── page.tsx             # Landing / onboarding
│   │   ├── auth/
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   ├── student/
│   │   │   ├── page.tsx         # Student chat UI
│   │   │   └── book/page.tsx    # Book office hours
│   │   ├── professor/
│   │   │   ├── page.tsx         # Professor dashboard
│   │   │   ├── upload/page.tsx  # Upload course materials
│   │   │   └── analytics/page.tsx
│   │   └── api/
│   │       ├── ask/route.ts     # Proxy to FastAPI
│   │       └── upload/route.ts
│   ├── components/
│   ├── lib/
│   │   └── supabase.ts
│   └── package.json
│
├── backend/                     # FastAPI (Python)
│   ├── main.py
│   ├── routes/
│   │   ├── upload.py            # File ingestion
│   │   ├── ask.py               # Student query handler
│   │   └── analytics.py        # Professor analytics
│   ├── services/
│   │   ├── rag.py               # LangChain RAG pipeline
│   │   ├── parser.py            # PDF / PPTX / video parsing
│   │   └── embeddings.py       # OpenAI embeddings
│   ├── requirements.txt
│   └── .env
│
├── supabase/
│   └── schema.sql               # DB schema + pgvector setup
│
├── .env.example
├── README.md
└── CLAUDE.md
```

## Conventions to Follow

- RAG pipeline logic lives in `backend/services/` — keep it isolated and testable
- LLM system prompts should be configurable, not hardcoded in business logic
- Never commit API keys or secrets; use environment variables (`.env`, never committed)
- Frontend proxies to backend via Next.js API routes for auth checks and cleaner separation
- All course content is scoped via `course_id` to ensure students only access their course materials
