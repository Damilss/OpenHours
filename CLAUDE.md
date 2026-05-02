# OpenHours — AI Office Hours Platform
## CLAUDE.md — Full Project Spec for Coding Agent

---

## Project Overview

**OpenHours** is an AI-powered office hours platform that allows professors to upload their course content (PDFs, slides, lecture videos) and have an AI assistant answer student questions — scoped strictly to that course material. The AI guides students toward answers rather than just giving them outright. Students can also request to meet with the professor directly if they need more help.

**Core philosophy:** Not replacing professors. Streamlining intellectual pursuit.

**Hackathon track:** Intellectual Pursuit

---

## Key Features

### Professor Admin Panel
- Upload course materials: PDFs, PPTs/PPTX, lecture videos
- View analytics dashboard: what topics students are asking about most
- Manage office hours scheduling / availability
- AI is scoped and constrained to only uploaded course content

### Student UI
- Ask questions, get AI-guided hints (not just answers)
- AI only responds based on professor-uploaded material
- "I still need help" button → triggers office hours booking with professor
- Clean onboarding flow

### Onboarding Site
- Landing page explaining OpenHours
- Separate sign-up flows for professors and students

---

## Full Tech Stack

### Frontend
- **Next.js** (App Router) — main framework for all UI
- **Tailwind CSS** — styling
- **shadcn/ui** — component library (buttons, modals, cards, etc.)
- Deployed on **Vercel**

### Backend / AI Pipeline
- **FastAPI (Python)** — handles all RAG logic, file processing, AI calls
- **Next.js API routes** — lighter endpoints, auth checks, proxying to FastAPI
- Deployed on **Railway** or **Render**

### AI & RAG Pipeline
- **LangChain** — orchestrates the full RAG (Retrieval Augmented Generation) pipeline
- **OpenAI Whisper** — transcribes lecture videos to text before ingestion
- **OpenAI API or Anthropic API** — generates scoped AI answers
- **python-pptx** — parses PPTX/PPT slide content
- **PyPDF** — parses PDF content

### Database & Storage
- **Supabase** — main PostgreSQL database
- **Supabase pgvector** — stores and searches vector embeddings (semantic search)
- **Supabase Storage** — stores uploaded files (PDFs, PPTs, videos)

### Auth
- **Supabase Auth** — handles authentication with separate roles for professors and students

---

## Architecture Overview

```
Student / Professor (Next.js Frontend)
            ↓
    Supabase Auth (role-based: professor | student)
            ↓
    Next.js API routes (lightweight proxy)
            ↓
    FastAPI backend (RAG pipeline)
            ↓
    Supabase pgvector (semantic search over course content)
            ↓
    OpenAI / Anthropic API (generate scoped answer)
```

---

## RAG Pipeline — How It Works

### File Ingestion (when professor uploads)

```
Professor uploads file (PDF / PPTX / video)
            ↓
    Store raw file in Supabase Storage
            ↓
    Parse / extract text:
        - PDF → PyPDF
        - PPTX → python-pptx
        - Video → Whisper (transcribe audio to text)
            ↓
    Chunk text into smaller pieces (~500 tokens each)
            ↓
    Convert each chunk to vector embedding (OpenAI Embeddings API)
            ↓
    Store chunks + embeddings in Supabase pgvector table
```

### Student Query Flow

```
Student asks a question
            ↓
    Convert question to vector embedding
            ↓
    Search Supabase pgvector for closest matching chunks
    (using <-> cosine distance operator)
            ↓
    Feed top matching chunks as context to AI
            ↓
    AI generates answer scoped ONLY to that context
            ↓
    If AI cannot answer → suggest booking office hours
```

---

## Supabase pgvector Setup

pgvector is a PostgreSQL extension — it stores and searches vector embeddings. It does NOT do machine learning itself. The ML (converting text to vectors) is handled by the OpenAI Embeddings API. pgvector just stores those vectors and lets you search them efficiently.

### Enable pgvector in Supabase
Go to Supabase Dashboard → Extensions → enable `vector`

### Database Schema

```sql
-- Enable pgvector
create extension if not exists vector;

-- Courses table
create table courses (
  id uuid primary key default gen_random_uuid(),
  professor_id uuid references auth.users(id),
  name text not null,
  created_at timestamp default now()
);

-- Documents table (stores parsed chunks + embeddings)
create table documents (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses(id),
  content text not null,
  embedding vector(1536),  -- 1536 dimensions for OpenAI embeddings
  source_file text,
  created_at timestamp default now()
);

-- Semantic search function
create or replace function match_documents(
  query_embedding vector(1536),
  match_course_id uuid,
  match_count int default 5
)
returns table(content text, similarity float)
language sql stable
as $$
  select content, 1 - (embedding <-> query_embedding) as similarity
  from documents
  where course_id = match_course_id
  order by embedding <-> query_embedding
  limit match_count;
$$;
```

---

## FastAPI Backend — Key Endpoints

```
POST /upload          → accept file, parse, chunk, embed, store in pgvector
POST /ask             → take student question, search pgvector, call AI, return answer
GET  /analytics/{course_id} → return most common question topics for professor dashboard
POST /book-office-hours     → trigger office hours booking
```

---

## File Parsing — Python Libraries

```python
# PDF parsing
from pypdf import PdfReader

def parse_pdf(file_path):
    reader = PdfReader(file_path)
    return " ".join(page.extract_text() for page in reader.pages)

# PPTX parsing
from pptx import Presentation

def parse_pptx(file_path):
    prs = Presentation(file_path)
    text = []
    for slide in prs.slides:
        for shape in slide.shapes:
            if shape.has_text_frame:
                text.append(shape.text_frame.text)
    return " ".join(text)

# Video transcription
import whisper

def transcribe_video(file_path):
    model = whisper.load_model("base")
    result = model.transcribe(file_path)
    return result["text"]
```

---

## LangChain RAG — Core Logic

```python
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_community.vectorstores import SupabaseVectorStore
from langchain.chains import RetrievalQA

# Split text into chunks
splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
chunks = splitter.split_text(raw_text)

# Embed and store
embeddings = OpenAIEmbeddings()
vector_store = SupabaseVectorStore.from_texts(
    chunks,
    embeddings,
    client=supabase_client,
    table_name="documents",
    query_name="match_documents"
)

# Query — scoped to course material only
retriever = vector_store.as_retriever()
llm = ChatOpenAI(model="gpt-4")
qa_chain = RetrievalQA.from_chain_type(llm=llm, retriever=retriever)

system_prompt = """
You are a helpful teaching assistant for this course.
Only answer questions based on the provided course material.
If the answer is not in the material, say: "I don't have enough information 
from the course content to answer that. You may want to book office hours 
with your professor."
Guide students toward understanding — give hints and explanations, 
not just direct answers.
"""

answer = qa_chain.run(student_question)
```

---

## Next.js Frontend Structure

```
/app
  /page.tsx                  → Landing / onboarding site
  /auth
    /login/page.tsx          → Login (professor or student)
    /signup/page.tsx         → Signup with role selection
  /student
    /page.tsx                → Student chat UI
    /book/page.tsx           → Book office hours
  /professor
    /page.tsx                → Professor dashboard
    /upload/page.tsx         → Upload course materials
    /analytics/page.tsx      → Student question analytics
  /api
    /ask/route.ts            → Proxy to FastAPI /ask
    /upload/route.ts         → Proxy to FastAPI /upload
```

---

## Auth — Role-Based Access

Use Supabase Auth with a `profiles` table to store roles:

```sql
create table profiles (
  id uuid references auth.users(id) primary key,
  role text check (role in ('professor', 'student')),
  full_name text,
  created_at timestamp default now()
);
```

Middleware in Next.js checks role and redirects to correct dashboard after login.

---

## Environment Variables

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# OpenAI
OPENAI_API_KEY=

# FastAPI
FASTAPI_URL=http://localhost:8000
```

---

## Deployment

| Service | Platform |
|---|---|
| Next.js frontend | Vercel |
| FastAPI backend | Railway or Render |
| Database + pgvector | Supabase |
| File storage | Supabase Storage |

---

## Build Order (Recommended for Hackathon)

1. Set up Supabase project, enable pgvector, run schema SQL
2. Set up Next.js with Tailwind + shadcn/ui
3. Add Supabase Auth with professor/student roles
4. Build FastAPI with file upload + parsing endpoints
5. Hook up LangChain RAG pipeline to pgvector
6. Build professor upload UI
7. Build student chat UI
8. Add "book office hours" flow
9. Add professor analytics dashboard
10. Polish landing/onboarding page
11. Deploy frontend to Vercel, backend to Railway

---

## Hackathon Pitch Angles

- **Not replacing professors** — augmenting and streamlining their time
- **Scoped AI** — responsible, constrained to course content only (addresses AI cheating concerns)
- **Harm reduction** — AI gives hints, not answers, preserving the learning process
- **Professor insights** — analytics on what students struggle with most is genuinely useful
- **Scalability** — could expand to any educational institution, any course

---

*Built for Intellectual Pursuit track. Projects must be entirely new.*
