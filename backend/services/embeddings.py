import os
import uuid
from typing import List
from openai import AsyncOpenAI
from supabase import create_client, Client

# Points to your friend's local LLM server instead of OpenAI
# Supports any OpenAI-compatible server (Ollama, LM Studio, etc.)
LLM_BASE_URL = os.environ.get("LLM_BASE_URL", "http://localhost:11434/v1")
LLM_API_KEY = os.environ.get("LLM_API_KEY", "local")  # most local servers accept any string
EMBEDDING_MODEL = os.environ.get("EMBEDDING_MODEL", "nomic-embed-text")

client = AsyncOpenAI(
    api_key=LLM_API_KEY,
    base_url=LLM_BASE_URL,
)

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_ROLE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


async def embed_text(text: str) -> List[float]:
    """Generate an embedding vector for a single piece of text."""
    response = await client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=text,
    )
    return response.data[0].embedding


async def embed_and_store(chunks: List[str], course_id: str, source_file: str) -> int:
    """
    Embed each chunk and store it in the Supabase documents table.
    Returns the number of chunks stored.
    """
    rows = []
    for chunk in chunks:
        embedding = await embed_text(chunk)
        rows.append({
            "id": str(uuid.uuid4()),
            "course_id": course_id,
            "content": chunk,
            "embedding": embedding,
            "source_file": source_file,
        })

    # Batch insert into Supabase
    supabase.table("documents").insert(rows).execute()

    return len(rows)
