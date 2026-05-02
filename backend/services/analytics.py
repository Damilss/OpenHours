import os
import uuid
import json
from datetime import datetime
from typing import List
from openai import AsyncOpenAI
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

LLM_BASE_URL = os.environ.get("LLM_BASE_URL", "http://localhost:11434/v1")
LLM_API_KEY = os.environ.get("LLM_API_KEY", "local")
CHAT_MODEL = os.environ.get("CHAT_MODEL", "llama3")

llm_client = AsyncOpenAI(
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


async def extract_topics(question: str) -> List[str]:
    """
    Use the LLM to extract 2-3 concept/topic keywords from a student question.
    Stores topics instead of raw questions to protect student privacy.

    e.g. "why doesn't my binary search work with duplicates"
         -> ["binary search", "arrays", "edge cases"]
    """
    try:
        response = await llm_client.chat.completions.create(
            model=CHAT_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You extract academic topic keywords from student questions. "
                        "Return ONLY a JSON array of 2-3 short topic strings. "
                        "No explanation, no extra text. Example: [\"binary search\", \"arrays\"]"
                    ),
                },
                {
                    "role": "user",
                    "content": f"Extract topics from this question: {question}",
                },
            ],
            temperature=0.0,
            max_tokens=60,
        )
        raw = response.choices[0].message.content.strip()
        topics = json.loads(raw)
        if isinstance(topics, list):
            return [str(t).lower().strip() for t in topics[:3]]
    except Exception:
        pass

    # Fallback: return empty list rather than crashing
    return []


async def log_query(course_id: str, question: str, suggested_booking: bool) -> None:
    """
    Log a student query for analytics.
    Extracts topic keywords from the question — never stores the raw question text.
    Called on every /ask request.
    """
    supabase = get_supabase()
    topics = await extract_topics(question)

    supabase.table("student_queries").insert({
        "id": str(uuid.uuid4()),
        "course_id": course_id,
        "topics": topics,               # list of keyword strings, not the question
        "suggested_booking": suggested_booking,
        "created_at": datetime.utcnow().isoformat(),
    }).execute()


async def get_struggle_topics(course_id: str) -> List[dict]:
    """
    Return the most common topics students are asking about for a course.
    Ranked by frequency — gives professors a concept-level view, not individual questions.
    """
    supabase = get_supabase()
    result = (
        supabase.table("student_queries")
        .select("topics, suggested_booking")
        .eq("course_id", course_id)
        .limit(500)
        .execute()
    )

    rows = result.data or []

    # Flatten all topic lists and count frequency
    topic_counts: dict[str, dict] = {}
    for row in rows:
        for topic in row.get("topics") or []:
            t = topic.strip().lower()
            if t not in topic_counts:
                topic_counts[t] = {"topic": t, "count": 0, "needed_office_hours": 0}
            topic_counts[t]["count"] += 1
            if row.get("suggested_booking"):
                topic_counts[t]["needed_office_hours"] += 1

    return sorted(topic_counts.values(), key=lambda x: x["count"], reverse=True)[:20]


async def get_summary_stats(course_id: str) -> dict:
    """Return high-level stats for the professor dashboard."""
    supabase = get_supabase()
    result = (
        supabase.table("student_queries")
        .select("suggested_booking, created_at")
        .eq("course_id", course_id)
        .execute()
    )

    rows = result.data or []
    total = len(rows)
    needed_booking = sum(1 for r in rows if r.get("suggested_booking"))

    day_counts: dict[str, int] = {}
    for row in rows:
        day = row["created_at"][:10]
        day_counts[day] = day_counts.get(day, 0) + 1

    most_active_day = max(day_counts, key=lambda d: day_counts[d]) if day_counts else None

    return {
        "total_questions": total,
        "office_hours_suggestions": needed_booking,
        "most_active_day": most_active_day,
        "questions_per_day": day_counts,
    }
