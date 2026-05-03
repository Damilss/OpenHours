# OpenHours 🎓

> AI-powered office hours — scoped to your course, built to guide not replace.

OpenHours lets professors upload their course materials (PDFs, slides, lecture videos) and gives students an AI assistant that answers questions **strictly based on that content**. The AI hints and guides rather than just giving answers.

**Built for the Intellectual Pursuit track.**

---

## The Idea

Recycling in education is inefficient — professors answer the same questions over and over, students wait days for responses, and generic AI tools give answers that have nothing to do with the course. OpenHours fixes this by:

- Giving students instant, scoped AI help 24/7
- Freeing professors from repetitive questions
- Keeping AI constrained to course content (no hallucinations, no cheating shortcuts)
- Showing professors what topics students struggle with most

**Not replacing professors. Streamlining intellectual pursuit.**

---

## Team & Task Split

| Person | Responsibility |
|---|---|
| **Person 1** | Frontend — Landing page, student chat UI, auth pages |
| **Person 2** | Professor dashboard — upload UI, analytics, admin panel, Supabase Auth + roles |
| **Person 3** | AI/RAG backend — FastAPI, file parsing, LangChain + pgvector pipeline, `/ask` endpoint |
| **Person 4** | Database + glue — Supabase schema, connect frontend↔backend, env vars, deployment |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router), Tailwind CSS, Framer Motion |
| Backend | FastAPI (Python) |
| AI Pipeline | LangChain, OpenAI API (embeddings + chat) |
| File Parsing | PyPDF, python-pptx, OpenAI Whisper |
| Database | Supabase (PostgreSQL + pgvector) |
| File Storage | Supabase Storage |
| Auth | Supabase Auth (professor / student roles) |
| Deployment | Vercel (frontend), Railway (backend) |

---

## Repository Structure

```
openhours/
├── frontend/                    # Next.js app
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
│   │   ├── supabase.ts
│   │   └── utils.ts
│   ├── package.json
│   └── .env.example
│
├── backend/                     # FastAPI (Python)
│   ├── main.py                  # All API endpoints
│   ├── services/
│   │   ├── parser.py            # PDF / PPTX / video parsing
│   │   ├── embeddings.py        # OpenAI embeddings + chunking
│   │   ├── rag.py               # LangChain RAG pipeline
│   │   └── analytics.py         # Question clustering
│   ├── requirements.txt
│   └── .env.example
│
├── supabase/
│   └── schema.sql               # DB schema + pgvector setup
│
└── README.md
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- A Supabase account (free) — [supabase.com](https://supabase.com)
- An OpenAI API key — [platform.openai.com](https://platform.openai.com)

---

### 1. Clone the repo

```bash
git clone https://github.com/your-team/openhours.git
cd openhours
```

---

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Database → Extensions** and enable `vector`
3. Go to **SQL Editor** and run the contents of `supabase/schema.sql`
4. Grab your project URL and anon key from **Settings → API**

---

### 3. Environment Variables

Copy the example env files and fill in your keys:

**Frontend:**
```bash
cd frontend
cp .env.example .env
```

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Backend URL
FASTAPI_URL=http://localhost:8000
```

**Backend:**
```bash
cd backend
cp .env.example .env
```

```env
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI
OPENAI_API_KEY=your_openai_key

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

---

### 4. Run the Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:3000`

---

### 5. Run the Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend runs at `http://localhost:8000`

---

## Database Schema

```sql
-- Enable pgvector extension
create extension if not exists vector;

-- Profiles (extends Supabase auth.users)
create table if not exists profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  role        text not null check (role in ('professor', 'student')),
  full_name   text,
  created_at  timestamptz default now()
);

-- Auto-create a profile row when a new user signs up
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'student'),
    coalesce(new.raw_user_meta_data->>'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Courses
create table if not exists courses (
  id            uuid primary key default gen_random_uuid(),
  professor_id  uuid references profiles(id) on delete cascade not null,
  name          text not null,
  description   text,
  created_at    timestamptz default now()
);

create index if not exists courses_professor_id_idx on courses(professor_id);

-- Documents (parsed chunks + embeddings)
create table if not exists documents (
  id           uuid primary key default gen_random_uuid(),
  course_id    uuid references courses(id) on delete cascade not null,
  content      text not null,
  embedding    vector(1536),          -- OpenAI text-embedding-3-small dimensions
  source_file  text,
  created_at   timestamptz default now()
);

create index if not exists documents_course_id_idx on documents(course_id);

-- Question logs (for analytics)
create table if not exists question_logs (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid references courses(id) on delete cascade not null,
  question    text not null,
  created_at  timestamptz default now()
);

create index if not exists question_logs_course_id_idx on question_logs(course_id);
create index if not exists question_logs_created_at_idx on question_logs(created_at desc);

-- Semantic search function
create or replace function match_documents(
  query_embedding  vector(1536),
  match_course_id  uuid,
  match_count      int default 6
)
returns table (content text, similarity float)
language sql stable
as $$
  select
    content,
    1 - (embedding <-> query_embedding) as similarity
  from documents
  where course_id = match_course_id
    and embedding is not null
  order by embedding <-> query_embedding
  limit match_count;
$$;
```

---

## How the RAG Pipeline Works

RAG = Retrieval Augmented Generation. The AI only answers based on what the professor uploaded.

### File Ingestion (professor uploads)

```
Professor uploads file
        ↓
Store raw file in Supabase Storage
        ↓
Parse text from file:
    PDF     → PyPDF
    PPTX    → python-pptx
    Video   → Whisper (transcribe audio → text)
        ↓
Split text into chunks (~500 tokens each)
        ↓
Convert each chunk to vector embedding (OpenAI)
        ↓
Store chunks + embeddings in Supabase pgvector
```

### Student Query

```
Student asks a question
        ↓
Convert question to vector embedding
        ↓
Search pgvector for closest matching chunks
        ↓
Feed top chunks as context to AI
        ↓
AI answers ONLY based on that context
```

---

## Key API Endpoints (FastAPI)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/upload` | Accept file, parse, embed, store in pgvector |
| `POST` | `/ask` | Take student question, search pgvector, return AI answer |
| `GET` | `/analytics/{course_id}` | Return most common question topics |

---

## Deployment

### Frontend → Vercel
```bash
cd frontend
npx vercel
```

### Backend → Railway
1. Push to GitHub
2. Connect repo to [railway.app](https://railway.app)
3. Set environment variables in Railway dashboard
4. Deploy

---

## Build Order (Hackathon Timeline)

| Step | Task | Owner |
|---|---|---|
| 1 | Supabase setup, enable pgvector, run schema | Person 4 |
| 2 | Next.js init, Tailwind, shadcn/ui | Person 1 |
| 3 | Supabase Auth + professor/student roles | Person 2 |
| 4 | FastAPI init + file upload + parsing | Person 3 |
| 5 | LangChain RAG pipeline + pgvector | Person 3 |
| 6 | Professor upload UI | Person 2 |
| 7 | Student chat UI | Person 1 |
| 8 | Professor analytics dashboard | Person 2 |
| 9 | Connect frontend ↔ backend | Person 4 |
| 10 | Landing / onboarding page | Person 1 |
| 11 | Deploy frontend + backend | Person 4 |
| 13 | Polish + demo prep | Everyone |

---

## Pitch Angles

- **Not replacing professors** — augmenting their time, not their job
- **Scoped AI** — constrained strictly to course content, addresses AI cheating concerns
- **Hints not answers** — guides students toward understanding, preserves learning
- **Professor insights** — analytics on what topics students struggle with most
- **Real problem** — professors waste hours on repetitive questions, students wait days for help

---

*OpenHours — Built for the Intellectual Pursuit track. Projects must be entirely new.*
