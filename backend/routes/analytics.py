from fastapi import APIRouter, HTTPException
from services.analytics import get_struggle_topics, get_summary_stats

router = APIRouter()

# TODO (before deployment): Verify Supabase JWT and assert the caller owns the
# course_id they are querying. Currently any caller can read any course's analytics.


@router.get("/{course_id}")
async def get_analytics(course_id: str):
    """
    Return analytics for a course:
    - Summary stats (total questions, office hours suggestions, most active day)
    - Top struggle topics (most frequently asked questions)

    Used by the professor dashboard to see where students need the most help.
    """
    if not course_id:
        raise HTTPException(status_code=400, detail="course_id is required.")

    stats = await get_summary_stats(course_id)
    topics = await get_struggle_topics(course_id)

    return {
        "course_id": course_id,
        "summary": stats,
        "struggle_topics": topics,
    }
