# AI/RAG Backend — Person 3

## Summary

This PR implements the full AI/RAG backend for OpenHours. It covers everything in the Person 3 scope from the build order: FastAPI setup, file parsing, embeddings, the RAG pipeline, the `/ask` endpoint, and analytics. Also includes course management endpoints and the Supabase schema.

---

## What's Included

### FastAPI App (`backend/`)
- `main.py` — app entry point with CORS configured for the Next.js frontend
- Environment variables loaded via `python-dotenv` at startup
- All routes registered and namespaced

### File Ingestion (`routes/upload.py`, `services/parser.py`)
- `POST /upload` accepts PDF, PPTX, and video/audio files with a `course_id`
- PDF parsing via `pypdf`, PPTX via `python-pptx`, video/audio transcription via OpenAI Whisper
- Text is split into ~500 word chunks before embedding
- Temp files are cleaned up after processing

### Embeddings + Vector Storage (`services/embeddings.py`)
- Uses OpenAI-compatible embeddings client pointed at a local LLM server (Ollama, LM Studio, etc.)
- Each chunk is embedded and stored in Supabase pgvector with its `course_id` and source filename
- No OpenAI API key required — all model config is via environment variables

### RAG Pipeline + Student Query Endpoint (`services/rag.py`, `routes/ask.py`)
- `POST /ask` takes a student question and `course_id`
- Embeds the question, searches pgvector for the 5 most semantically relevant chunks, feeds them as context to the LLM
- System prompt enforces the core product behavior: guided hints only, no direct answers, suggest office hours if context is insufficient
- Every request is logged for analytics (non-blocking — never affects the student response)

### Analytics (`services/analytics.py`, `routes/analytics.py`)
- `GET /analytics/{course_id}` returns summary stats and top struggle topics
- **Privacy-first design**: raw student questions are never stored. The LLM extracts 2-3 topic keywords per question (e.g. `["binary search", "arrays"]`) and only those are persisted
- Professors see a ranked topic frequency list, not individual student messages
- Summary stats include total questions, office hours suggestion count, most active day, and questions per day

### Course Management (`routes/courses.py`)
- `POST /courses` — professor creates a course, receives a `course_id` used for all subsequent uploads and queries
- `GET /courses/{professor_id}` — fetch all courses for the professor dashboard
- `DELETE /courses/{course_id}` — removes course and all associated documents and query logs

### Database Schema (`supabase/schema.sql`)
- Full schema ready to run in Supabase SQL Editor
- Tables: `profiles`, `courses`, `documents`, `student_queries`, `bookings`
- `documents` table uses `vector(1536)` for pgvector embeddings
- `student_queries` stores `topics text[]` — not raw question text
- `match_documents()` SQL function for semantic similarity search

### Infra / Config
- `requirements.txt` with all dependencies pinned
- `.env.example` documenting all required environment variables
- `.gitignore` updated to exclude `venv/`, `__pycache__`, `.env`, `node_modules`, `.next/`
- `backend/README.md` with full setup instructions including Windows-specific steps and known issues

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Health check |
| `POST` | `/courses` | Create a new course |
| `GET` | `/courses/{professor_id}` | Get all courses for a professor |
| `DELETE` | `/courses/{course_id}` | Delete a course and all its data |
| `POST` | `/upload` | Upload a file — parses, embeds, stores in pgvector |
| `POST` | `/ask` | Student asks a question — returns guided AI answer |
| `GET` | `/analytics/{course_id}` | Professor analytics — struggle topics + summary stats |

---

## Environment Variables Required

```env
# Local LLM Server
LLM_BASE_URL=               # e.g. http://localhost:11434/v1
LLM_API_KEY=                # key for local server (can be any string)
CHAT_MODEL=                 # e.g. llama3
EMBEDDING_MODEL=            # e.g. nomic-embed-text

# Supabase — from Person 4
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

---

## Dependencies / Blockers

- **Person 4** — needs to run `supabase/schema.sql` in the Supabase SQL editor and share `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`
- **LLM teammate** — needs to share the local server URL, model name, and API key
- **Person 1** — student chat UI should `POST /ask` with `{ question, course_id }`
- **Person 2** — professor dashboard should `POST /courses` on onboarding, then `GET /analytics/{course_id}` for the analytics view

---

## Not Included / Future Work

- Bulk file upload
- Whisper requires `ffmpeg` installed separately — video parsing can be added post-hackathon
- Semantic topic clustering (currently exact keyword counts — embedding-based clustering would be a v2 improvement)
