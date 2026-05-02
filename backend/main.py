"""
OpenHours — FastAPI backend
Handles file ingestion, RAG-based student Q&A, analytics, and office hours bookings.
"""

import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Any, Dict

from supabase import create_client, Client

from services.parser import parse_file
from services.embeddings import ingest_document
from services.rag import ask as rag_ask
from services.analytics import get_analytics


# ---------------------------------------------------------------------------
# Supabase client (service role — bypasses RLS for backend operations)
# ---------------------------------------------------------------------------

def get_supabase() -> Client:
    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    return create_client(url, key)


# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Validate required env vars on startup
    required = ["OPENAI_API_KEY", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]
    missing = [k for k in required if not os.environ.get(k)]
    if missing:
        raise RuntimeError(f"Missing required environment variables: {missing}")
    yield


app = FastAPI(title="OpenHours API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        os.environ.get("FRONTEND_URL", ""),
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Request / response models
# ---------------------------------------------------------------------------

class Message(BaseModel):
    role: str
    content: str


class AskRequest(BaseModel):
    question: str
    course_id: str
    history: List[Message] = []


class AskResponse(BaseModel):
    answer: str


class BookingRequest(BaseModel):
    student_id: str
    course_id: str
    message: Optional[str] = None


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/upload")
async def upload(
    file: UploadFile = File(...),
    course_id: str = Form(...),
):
    """
    Accept a course material file, parse it, chunk + embed, store in pgvector.
    """
    allowed_extensions = {".pdf", ".pptx", ".ppt", ".mp4", ".mov", ".mp3", ".wav", ".m4a", ".webm"}
    ext = os.path.splitext(file.filename or "")[1].lower()

    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed: {', '.join(allowed_extensions)}",
        )

    file_bytes = await file.read()

    # Parse text from the file
    try:
        raw_text = parse_file(file_bytes, file.filename or "upload")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse file: {e}")

    if not raw_text.strip():
        raise HTTPException(status_code=422, detail="No text could be extracted from this file.")

    # Store raw file in Supabase Storage
    supabase = get_supabase()
    storage_path = f"{course_id}/{file.filename}"
    try:
        supabase.storage.from_("course-materials").upload(
            storage_path,
            file_bytes,
            {"content-type": file.content_type or "application/octet-stream"},
        )
    except Exception:
        pass  # Storage upload is best-effort; don't block indexing

    # Chunk, embed, and store in pgvector
    try:
        chunk_count = ingest_document(
            supabase_client=supabase,
            course_id=course_id,
            source_file=file.filename or "upload",
            raw_text=raw_text,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to index document: {e}")

    return {
        "status": "ok",
        "filename": file.filename,
        "chunks": chunk_count,
    }


@app.post("/ask", response_model=AskResponse)
async def ask(req: AskRequest):
    """
    Student asks a question. Returns an answer scoped to course material.
    """
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    supabase = get_supabase()

    history = [m.model_dump() for m in req.history]

    try:
        result = rag_ask(
            supabase_client=supabase,
            course_id=req.course_id,
            question=req.question,
            history=history,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI pipeline error: {e}")

    return AskResponse(answer=result["answer"])


@app.get("/analytics/{course_id}")
async def analytics(course_id: str):
    """
    Return question analytics for a course (professor view).
    """
    supabase = get_supabase()
    try:
        data = get_analytics(supabase_client=supabase, course_id=course_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analytics error: {e}")
    return data


@app.post("/book")
async def book(req: BookingRequest):
    """
    Create an office hours booking request.
    """
    supabase = get_supabase()
    try:
        result = (
            supabase.table("bookings")
            .insert({
                "student_id": req.student_id,
                "course_id": req.course_id,
                "message": req.message,
                "status": "pending",
            })
            .execute()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Booking error: {e}")

    return {"status": "ok", "booking": result.data[0] if result.data else {}}
