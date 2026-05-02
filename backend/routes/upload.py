import os
import tempfile
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from services.parser import parse_file
from services.embeddings import embed_and_store

router = APIRouter()

# TODO (before deployment): Verify Supabase JWT and assert the caller is a professor
# who owns the course_id they are uploading to.


@router.post("/")
async def upload_file(
    file: UploadFile = File(...),
    course_id: str = Form(...),
):
    """
    Accept a file (PDF, PPTX, MP4/audio), parse it into text chunks,
    generate embeddings, and store them in Supabase pgvector.
    """
    allowed_types = {
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "video/mp4",
        "audio/mpeg",
        "audio/wav",
    }

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}",
        )

    # Stream file directly to disk — avoids loading entire file into memory
    suffix = Path(file.filename).suffix if file.filename else ""
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        while chunk := await file.read(1024 * 1024):  # 1MB chunks
            tmp.write(chunk)
        tmp_path = tmp.name

    try:
        # Parse text from file
        chunks = parse_file(tmp_path, file.content_type)

        if not chunks:
            raise HTTPException(status_code=422, detail="Could not extract text from file.")

        # Embed and store in Supabase pgvector
        stored_count = await embed_and_store(chunks, course_id, file.filename)

        return {
            "message": "File processed successfully",
            "filename": file.filename,
            "chunks_stored": stored_count,
        }
    finally:
        # Clean up temp file
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
