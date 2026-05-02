import os
import uuid
from datetime import datetime
from typing import List
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()


def get_supabase():
    """Get Supabase client — only called when actually needed."""
    url = os.environ.get("SUPABASE_URL", "")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    if not url or not key or url == "placeholder":
        raise RuntimeError("Supabase is not configured yet. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to your .env file.")
    return create_client(url, key)


async def log_query(course_id: str, question: str, suggested_booking: bool) -> None:
    """Log a student query for analytics. Called on every /ask request."""
    supabase = get_supabase()
    supabase.table("student_queries").insert({
        "id": str(uuid.uuid4()),
        "course_id": course_id,
        "question": question,
        "suggested_booking": suggested_booking,
        "created_at": datetime.utcnow().isoformat(),
    }).execute()


async def get_struggle_topics(course_id: str) -> List[dict]:
    """Return the most frequently asked questions for a course."""
    supabase = get_supabase()
    result = (
        supabase.table("student_queries")
        .select("question, suggested_booking, created_at")
        .eq("course_id", course_id)
        .order("created_at", desc=True)
        .limit(200)
        .execute()
    )

    rows = result.data or []
    question_counts: dict[str, dict] = {}
    for row in rows:
        q = row["question"].strip().lower()
        if q not in question_counts:
            question_counts[q] = {
                "question": row["question"],
                "count": 0,
                "needed_office_hours": 0,
            }
        question_counts[q]["count"] += 1
        if row.get("suggested_booking"):
            question_counts[q]["needed_office_hours"] += 1

    return sorted(question_counts.values(), key=lambda x: x["count"], reverse=True)[:20]


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
