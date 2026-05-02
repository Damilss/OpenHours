from fastapi import APIRouter, HTTPException
from services.rag import get_common_topics

router = APIRouter()


@router.get("/{course_id}")
async def get_analytics(course_id: str):
    """
    Return the most common question topics for a given course.
    Useful for professors to see where students are struggling.
    """
    if not course_id:
        raise HTTPException(status_code=400, detail="course_id is required.")

    topics = await get_common_topics(course_id)
    return {"course_id": course_id, "topics": topics}
