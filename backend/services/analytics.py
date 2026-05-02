import os
import uuid
from datetime import datetime
from typing import List
from supabase import create_client, Client

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_ROLE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


async def log_query(
    course_id: str,
    question: str,
    suggested_booking: bool,
) -> None:
    """
    Log a student query to the student_queries table.
    Called every time a student hits the /ask endpoint.
    """
    supabase.table("student_queries").insert({
        "id": str(uuid.uuid4()),
        "course_id": course_id,
        "question": question,
        "suggested_booking": suggested_booking,
        "created_at": datetime.utcnow().isoformat(),
    }).execute()


async def get_struggle_topics(course_id: str) -> List[dict]:
    """
    Return the most common questions/topics students are struggling with
    for a given course, ranked by frequency.

    Groups similar questions by looking for repeated keywords.
    In a future version this could use embeddings to cluster semantically.
    """
    result = (
        supabase.table("student_queries")
        .select("question, suggested_booking, created_at")
        .eq("course_id", course_id)
        .order("created_at", desc=True)
        .limit(200)
        .execute()
    )

    rows = result.data or []

    # Count question frequency (exact match for now)
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

    # Sort by most asked
    sorted_topics = sorted(
        question_counts.values(),
        key=lambda x: x["count"],
        reverse=True,
    )

    return sorted_topics[:20]  # top 20 struggle topics


async def get_summary_stats(course_id: str) -> dict:
    """
    Return high-level stats for the professor dashboard:
    - Total questions asked
    - How many times the AI couldn't answer (office hours suggestions)
    - Most active day
    """
    result = (
        supabase.table("student_queries")
        .select("suggested_booking, created_at")
        .eq("course_id", course_id)
        .execute()
    )

    rows = result.data or []
    total = len(rows)
    needed_booking = sum(1 for r in rows if r.get("suggested_booking"))

    # Count questions per day
    day_counts: dict[str, int] = {}
    for row in rows:
        day = row["created_at"][:10]  # YYYY-MM-DD
        day_counts[day] = day_counts.get(day, 0) + 1

    most_active_day = max(day_counts, key=lambda d: day_counts[d]) if day_counts else None

    return {
        "total_questions": total,
        "office_hours_suggestions": needed_booking,
        "most_active_day": most_active_day,
        "questions_per_day": day_counts,
    }
