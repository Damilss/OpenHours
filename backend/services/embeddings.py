"""
Chunking and embedding pipeline.
Splits raw text into chunks, embeds them via OpenAI, and stores in Supabase pgvector.
"""

import os
from typing import List

from langchain.text_splitter import RecursiveCharacterTextSplitter
from openai import OpenAI

client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

CHUNK_SIZE = 500
CHUNK_OVERLAP = 50
EMBEDDING_MODEL = "text-embedding-3-small"


def chunk_text(text: str) -> List[str]:
    """Split text into overlapping chunks suitable for embedding."""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    return splitter.split_text(text)


def embed_texts(texts: List[str]) -> List[List[float]]:
    """Embed a list of text strings using OpenAI embeddings."""
    response = client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=texts,
    )
    return [item.embedding for item in response.data]


def ingest_document(
    supabase_client,
    course_id: str,
    source_file: str,
    raw_text: str,
) -> int:
    """
    Chunk, embed, and store a document in Supabase.
    Returns the number of chunks stored.
    """
    chunks = chunk_text(raw_text)
    if not chunks:
        return 0

    # Embed in batches of 100 to stay within API limits
    all_embeddings: List[List[float]] = []
    batch_size = 100
    for i in range(0, len(chunks), batch_size):
        batch = chunks[i : i + batch_size]
        all_embeddings.extend(embed_texts(batch))

    rows = [
        {
            "course_id": course_id,
            "content": chunk,
            "embedding": embedding,
            "source_file": source_file,
        }
        for chunk, embedding in zip(chunks, all_embeddings)
    ]

    supabase_client.table("documents").insert(rows).execute()
    return len(rows)
