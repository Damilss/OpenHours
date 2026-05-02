import os
import uuid
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from services.parser import parse_file
from services.embeddings import embed_and_store

router = APIRouter()


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

    # Read file bytes
    contents = await file.read()

    # Save temporarily so parsers can work with it
    tmp_path = f"/tmp/{uuid.uuid4()}_{file.filename}"
    with open(tmp_path, "wb") as f:
        f.write(contents)

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
