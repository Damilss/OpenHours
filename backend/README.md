# OpenHours — Backend

FastAPI service that owns the RAG pipeline, file ingestion, and analytics for OpenHours.

## Run locally

```bash
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload         # http://localhost:8000
```

Visit `http://localhost:8000/health` — should return `{"status": "ok"}`.

## Environment variables

Copy `.env.example` to `.env` and fill in:

| Variable | Required | Purpose |
|---|---|---|
| `OPENAI_API_KEY` | yes | Embeddings + chat completion |
| `SUPABASE_URL` | yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | Service-role key (bypasses RLS) |
| `FRONTEND_URL` | no | Added to CORS allowlist alongside `http://localhost:3000` |

The app validates the three required vars on startup and raises `RuntimeError` if any are missing.

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | Liveness check |
| `POST` | `/upload` | Authenticated professor upload: parse, chunk, embed, store in pgvector |
| `POST` | `/ask` | Authenticated enrolled-student question: retrieve top chunks, generate scoped answer |
| `GET` | `/analytics/{course_id}` | Authenticated professor topic clusters from `question_logs` |
| `POST` | `/book` | _(Unused.)_ Authenticated enrolled-student booking insert |

Protected endpoints require `Authorization: Bearer <supabase_access_token>`.

## Services (`services/`)

| File | Responsibility |
|---|---|
| `parser.py` | PDF (pypdf), PPTX (python-pptx), audio/video (`openai-whisper`, optional) |
| `embeddings.py` | LangChain text splitter (500/50) → `text-embedding-3-small` → insert into `documents` |
| `rag.py` | `match_documents` RPC → top-6 chunks → `gpt-4o-mini` → log to `question_logs` |
| `analytics.py` | Cluster the 50 most recent questions into topics with `gpt-4o-mini` |

## Optional: video/audio transcription

`openai-whisper` is **not** in `requirements.txt` because it pulls heavy dependencies (PyTorch) and only works on Python ≤ 3.12. To enable A/V uploads:

```bash
pip install openai-whisper
```

Without it, audio/video uploads return a friendly 400 ("Please upload a PDF or PPTX instead").

For project-wide context see the [root README](../README.md) and [CLAUDE.md](../CLAUDE.md).
