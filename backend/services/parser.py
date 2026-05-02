"""
File parsing utilities.
Supports PDF, PPTX/PPT, and audio/video via Whisper.
"""

import os
import tempfile
from pathlib import Path


def parse_pdf(file_bytes: bytes) -> str:
    """Extract text from a PDF file."""
    from pypdf import PdfReader
    import io

    reader = PdfReader(io.BytesIO(file_bytes))
    pages = []
    for page in reader.pages:
        text = page.extract_text()
        if text:
            pages.append(text.strip())
    return "\n\n".join(pages)


def parse_pptx(file_bytes: bytes) -> str:
    """Extract text from a PPTX file."""
    from pptx import Presentation
    import io

    prs = Presentation(io.BytesIO(file_bytes))
    slides = []
    for i, slide in enumerate(prs.slides, 1):
        texts = []
        for shape in slide.shapes:
            if shape.has_text_frame:
                for para in shape.text_frame.paragraphs:
                    line = para.text.strip()
                    if line:
                        texts.append(line)
        if texts:
            slides.append(f"[Slide {i}]\n" + "\n".join(texts))
    return "\n\n".join(slides)


def transcribe_video(file_bytes: bytes, suffix: str) -> str:
    """Transcribe audio/video — requires openai-whisper (Python ≤ 3.12)."""
    try:
        import whisper
    except ImportError:
        raise ValueError(
            "Video transcription is not available in this environment. "
            "Please upload a PDF or PPTX instead."
        )

    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(file_bytes)
        tmp_path = tmp.name

    try:
        model = whisper.load_model("base")
        result = model.transcribe(tmp_path)
        return result["text"]
    finally:
        os.unlink(tmp_path)


def parse_file(file_bytes: bytes, filename: str) -> str:
    """Dispatch to the correct parser based on file extension."""
    ext = Path(filename).suffix.lower()

    if ext == ".pdf":
        return parse_pdf(file_bytes)
    elif ext in (".pptx", ".ppt"):
        return parse_pptx(file_bytes)
    elif ext in (".mp4", ".mov", ".mp3", ".wav", ".m4a", ".webm"):
        return transcribe_video(file_bytes, ext)
    else:
        raise ValueError(f"Unsupported file type: {ext}")
