import os
from typing import List

# PDF parsing
import pypdf

# PPTX parsing
from pptx import Presentation

# whisper is an optional dependency — imported lazily in _parse_audio
# Install with: pip install git+https://github.com/openai/whisper.git

# Cached Whisper model — loaded once on first use, reused for all subsequent requests
_whisper_model = None


def _get_whisper_model():
    global _whisper_model
    if _whisper_model is None:
        import whisper
        _whisper_model = whisper.load_model("base")
    return _whisper_model


CHUNK_SIZE = 500  # target tokens per chunk (approximate by words)


def parse_file(file_path: str, content_type: str) -> List[str]:
    """
    Parse a file into a list of text chunks based on its type.
    """
    if content_type == "application/pdf":
        return _parse_pdf(file_path)
    elif content_type == "application/vnd.openxmlformats-officedocument.presentationml.presentation":
        return _parse_pptx(file_path)
    elif content_type in ("video/mp4", "audio/mpeg", "audio/wav"):
        return _parse_audio(file_path)
    else:
        raise ValueError(f"Unsupported content type: {content_type}")


def _parse_pdf(file_path: str) -> List[str]:
    """Extract text from a PDF and split into chunks."""
    reader = pypdf.PdfReader(file_path)
    full_text = ""
    for page in reader.pages:
        text = page.extract_text()
        if text:
            full_text += text + "\n"
    return _chunk_text(full_text)


def _parse_pptx(file_path: str) -> List[str]:
    """Extract text from each slide of a PPTX and split into chunks."""
    prs = Presentation(file_path)
    full_text = ""
    for slide in prs.slides:
        for shape in slide.shapes:
            if shape.has_text_frame:
                for para in shape.text_frame.paragraphs:
                    line = " ".join(run.text for run in para.runs).strip()
                    if line:
                        full_text += line + "\n"
        full_text += "\n"  # slide separator
    return _chunk_text(full_text)


def _parse_audio(file_path: str) -> List[str]:
    """Transcribe audio/video using OpenAI Whisper and split into chunks."""
    try:
        import whisper  # noqa: F401 — validates whisper is installed
    except ImportError:
        raise RuntimeError(
            "Whisper is not installed. Install it with: "
            "pip install git+https://github.com/openai/whisper.git"
        )
    model = _get_whisper_model()
    result = model.transcribe(file_path)
    transcript = result.get("text", "")
    return _chunk_text(transcript)


def _chunk_text(text: str) -> List[str]:
    """
    Split text into chunks of approximately CHUNK_SIZE whitespace-delimited words.
    Chunks are created strictly by word count and do not preserve sentence boundaries.
    """
    words = text.split()
    chunks = []
    current_chunk = []

    for word in words:
        current_chunk.append(word)
        if len(current_chunk) >= CHUNK_SIZE:
            chunks.append(" ".join(current_chunk))
            current_chunk = []

    # Don't lose the last partial chunk
    if current_chunk:
        chunks.append(" ".join(current_chunk))

    return [c.strip() for c in chunks if c.strip()]
