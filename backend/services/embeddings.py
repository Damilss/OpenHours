import os
import uuid
from typing import List
from openai import AsyncOpenAI
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

# Points to your friend's local LLM server instead of OpenAI
LLM_BASE_URL = os.environ.get("LLM_BASE_URL", "http://localhost:11434/v1")
LLM_API_KEY = os.environ.get("LLM_API_KEY", "local")
EMBEDDING_MODEL = os.environ.get("EMBEDDING_MODEL", "nomic-embed-text")

client = AsyncOpenAI(
    api_key=LLM_API_KEY,
    base_url=LLM_BASE_URL,
)


def get_supabase():
    """Get Supabase client — only called when actually needed."""
    url = os.environ.get("SUPABASE_URL", "")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    if not url or not key or url == "placeholder":
        raise RuntimeError("Supabase is not configured yet. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to your .env file.")
    return create_client(url, key)


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
    supabase = get_supabase()
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

    supabase.table("documents").insert(rows).execute()
    return len(rows)
