"""
RAG (Retrieval Augmented Generation) pipeline.
Searches pgvector for relevant course content, then calls the LLM
scoped strictly to that material.
"""

import os
from typing import List, Dict, Any

from openai import OpenAI

client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

EMBEDDING_MODEL = "text-embedding-3-small"
CHAT_MODEL = "gpt-4o-mini"
MATCH_COUNT = 6

SYSTEM_PROMPT = """You are an AI teaching assistant for a university course.

STRICT RULES — never break these:
1. Only answer using the provided course material excerpts below.
2. If the answer is not in the material, say exactly: "I don't have enough information from the course content to answer that. You may want to book office hours with your professor."
3. Be helpful and clear. Explain concepts, work through examples, and answer follow-up questions — but stay strictly within the course material.

Course material excerpts:
{context}"""


def get_query_embedding(question: str) -> List[float]:
    response = client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=question,
    )
    return response.data[0].embedding


def search_documents(
    supabase_client, course_id: str, query_embedding: List[float]
) -> List[str]:
    """Search pgvector for the most relevant document chunks."""
    result = supabase_client.rpc(
        "match_documents",
        {
            "query_embedding": query_embedding,
            "match_course_id": course_id,
            "match_count": MATCH_COUNT,
        },
    ).execute()

    return [row["content"] for row in (result.data or [])]


def ask(
    supabase_client,
    course_id: str,
    question: str,
    history: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Full RAG pipeline: embed question → search → generate answer.
    Returns {"answer": str}.
    """
    # 1. Embed the question
    query_embedding = get_query_embedding(question)

    # 2. Retrieve relevant chunks
    chunks = search_documents(supabase_client, course_id, query_embedding)

    if not chunks:
        return {
            "answer": (
                "I don't have enough information from the course content to answer that. "
                "You may want to book office hours with your professor."
            ),
        }

    context = "\n\n---\n\n".join(chunks)

    # 3. Build message history for the LLM
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT.format(context=context)},
    ]

    # Include recent conversation turns (last 6 messages)
    for msg in history[-6:]:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        if role in ("user", "assistant") and content:
            messages.append({"role": role, "content": content})

    messages.append({"role": "user", "content": question})

    # 4. Call the LLM
    response = client.chat.completions.create(
        model=CHAT_MODEL,
        messages=messages,
        temperature=0.4,
        max_tokens=600,
    )

    answer = response.choices[0].message.content.strip()

    # 5. Log the interaction for analytics
    try:
        supabase_client.table("question_logs").insert({
            "course_id": course_id,
            "question": question,
        }).execute()
    except Exception:
        pass  # analytics logging is non-critical

    return {"answer": answer}
