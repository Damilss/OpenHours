# Tech Stack

OpenHours is built as a full-stack AI application with RAG (Retrieval Augmented Generation) pipeline.

## Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js (App Router), Tailwind CSS, shadcn/ui |
| **Backend** | FastAPI (Python) |
| **AI Pipeline** | LangChain, OpenAI API (embeddings + chat) |
| **File Parsing** | PyPDF, python-pptx, OpenAI Whisper |
| **Database** | Supabase (PostgreSQL + pgvector) |
| **File Storage** | Supabase Storage |
| **Auth** | Supabase Auth (professor / student roles) |
| **Deployment** | Vercel (frontend), Railway (backend) |

## Prerequisites

- Node.js 18+
- Python 3.10+
- A Supabase account (free) — [supabase.com](https://supabase.com)
- An OpenAI API key — [platform.openai.com](https://platform.openai.com)

## Common Commands

### Frontend (Next.js)

```bash
cd frontend
npm install              # Install dependencies
npm run dev              # Start dev server (http://localhost:3000)
npm run build            # Build for production
npx vercel               # Deploy to Vercel
```

### Backend (FastAPI)

```bash
cd backend
python -m venv venv                      # Create virtual environment
source venv/bin/activate                 # Activate (Windows: venv\Scripts\activate)
pip install -r requirements.txt          # Install dependencies
uvicorn main:app --reload                # Start dev server (http://localhost:8000)
```

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI
OPENAI_API_KEY=your_openai_key

# Backend
FASTAPI_URL=http://localhost:8000
```

## Key API Endpoints (FastAPI)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/upload` | Accept file, parse, embed, store in pgvector |
| `POST` | `/ask` | Take student question, search pgvector, return AI answer |
| `GET` | `/analytics/{course_id}` | Return most common question topics |
| `POST` | `/book` | Create office hours booking |
