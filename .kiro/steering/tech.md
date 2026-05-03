# Tech Stack

## Frontend
- **Next.js 16** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS 4**
- **Supabase JS Client** (`@supabase/supabase-js`, `@supabase/ssr`)
- **lucide-react** (icons)

## Backend
- **FastAPI** (Python)
- **LangChain** + **LangChain OpenAI** (RAG pipeline)
- **OpenAI API** (embeddings: `text-embedding-3-small`, chat: GPT models)
- **Supabase Python Client**
- **PyPDF** (PDF parsing)
- **python-pptx** (PowerPoint parsing)
- **OpenAI Whisper** (video/audio transcription - optional, not in requirements.txt)

## Database & Storage
- **Supabase** (PostgreSQL + pgvector extension)
- **pgvector** (vector similarity search for RAG)
- **Supabase Storage** (course material files)
- **Supabase Auth** (professor/student roles)

## Deployment
- **Vercel** (frontend)
- **Railway** (backend - recommended)

## Common Commands

### Frontend
```bash
cd frontend
npm install
npm run dev          # http://localhost:3000
npm run build
npm start
```

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload  # http://localhost:8000
```

### Environment Variables Required
- `OPENAI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `FASTAPI_URL` (frontend)
- `FRONTEND_URL` (backend CORS)
