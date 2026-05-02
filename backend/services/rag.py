import os
from typing import Any
from openai import AsyncOpenAI
from supabase import create_client
from services.embeddings import embed_text
from dotenv import load_dotenv

load_dotenv()

LLM_BASE_URL = os.environ.get("LLM_BASE_URL", "http://localhost:11434/v1")
LLM_API_KEY = os.environ.get("LLM_API_KEY", "local")
CHAT_MODEL = os.environ.get("CHAT_MODEL", "llama3")

openai_client = AsyncOpenAI(
    api_key=LLM_API_KEY,
    base_url=LLM_BASE_URL,
)

MATCH_COUNT = 5

SYSTEM_PROMPT = """You are an AI teaching assistant for a university course.
Your job is to help students understand course material — but you must NEVER give direct answers.

Rules:
- Only use information from the provided course context. Do not use outside knowledge.
- Guide students with hints, leading questions, and partial breakdowns.
- If the context does not contain enough information to help, say so honestly and suggest the student book office hours with their professor.
- Keep responses concise and encouraging.
- Never solve the problem for the student. Help them think it through.

If you cannot answer from the context, respond with:
"I don't have enough information from the course materials to answer that. Consider booking office hours with your professor."
"""


def get_supabase():
    """Get Supabase client — only called when actually needed."""
    url = os.environ.get("SUPABASE_URL", "")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    if not url or not key or url == "placeholder":
        raise RuntimeError("Supabase is not configured yet. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to your .env file.")
    return create_client(url, key)


async def answer_question(question: str, course_id: str) -> dict[str, Any]:
    """
    RAG pipeline:
    1. Embed the student's question
    2. Search pgvector for the most relevant course content chunks
    3. Feed chunks as context to the LLM
    4. Return a guided answer (hints, not direct answers)
    """
    supabase = get_supabase()

    question_embedding = await embed_text(question)

    result = supabase.rpc(
        "match_documents",
        {
            "query_embedding": question_embedding,
            "match_course_id": course_id,
            "match_count": MATCH_COUNT,
        },
    ).execute()

    chunks = result.data or []
    sources = [c.get("source_file", "") for c in chunks if c.get("source_file")]
    context_text = "\n\n---\n\n".join(c["content"] for c in chunks)

    suggested_booking = len(chunks) == 0

    user_message = f"""Course context:
{context_text if context_text else "No relevant course material found."}

Student question:
{question}"""

    response = await openai_client.chat.completions.create(
        model=CHAT_MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
        temperature=0.4,
        max_tokens=600,
    )

    answer = response.choices[0].message.content.strip()

    cant_answer_phrases = ["don't have enough information", "book office hours", "cannot answer"]
    if any(phrase in answer.lower() for phrase in cant_answer_phrases):
        suggested_booking = True

    return {
        "answer": answer,
        "sources": list(set(sources)),
        "suggested_booking": suggested_booking,
    }


async def get_common_topics(course_id: str) -> list[dict]:
    supabase = get_supabase()
    result = (
        supabase.table("documents")
        .select("source_file, content")
        .eq("course_id", course_id)
        .order("created_at", desc=True)
        .limit(20)
        .execute()
    )

    topics: dict[str, int] = {}
    for row in result.data or []:
        src = row.get("source_file", "unknown")
        topics[src] = topics.get(src, 0) + 1

    return [{"source": k, "chunk_count": v} for k, v in sorted(topics.items(), key=lambda x: -x[1])]
