from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.rag import answer_question
from services.analytics import log_query

router = APIRouter()


class AskRequest(BaseModel):
    question: str
    course_id: str


class AskResponse(BaseModel):
    answer: str
    sources: list[str]
    suggested_booking: bool


@router.post("/", response_model=AskResponse)
async def ask(request: AskRequest):
    """
    Take a student question, search pgvector for relevant course content,
    and return a guided answer (hints, not direct answers).
    Logs every query for professor analytics.
    """
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    result = await answer_question(request.question, request.course_id)

    # Log the query for analytics — fire and forget, don't block the response
    try:
        await log_query(
            course_id=request.course_id,
            question=request.question,
            suggested_booking=result["suggested_booking"],
        )
    except Exception:
        # Never let analytics logging break the student experience
        pass

    return result
