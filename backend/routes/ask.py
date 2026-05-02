import asyncio
from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel
from services.rag import answer_question
from services.analytics import log_query

router = APIRouter()

# TODO (before deployment): Verify Supabase JWT and assert the caller is a student
# enrolled in the course_id they are querying.


class AskRequest(BaseModel):
    question: str
    course_id: str


class AskResponse(BaseModel):
    answer: str
    sources: list[str]
    suggested_booking: bool


@router.post("/", response_model=AskResponse)
async def ask(request: AskRequest, background_tasks: BackgroundTasks):
    """
    Take a student question, search pgvector for relevant course content,
    and return a guided answer (hints, not direct answers).
    Logs the query topic keywords in the background — never blocks the response.
    """
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    result = await answer_question(request.question, request.course_id)

    # True fire-and-forget — runs after response is sent, never affects latency
    background_tasks.add_task(
        _log_query_safe,
        course_id=request.course_id,
        question=request.question,
        suggested_booking=result["suggested_booking"],
    )

    return result


async def _log_query_safe(course_id: str, question: str, suggested_booking: bool) -> None:
    """Wrapper that swallows exceptions so analytics never surface to the student."""
    try:
        await log_query(
            course_id=course_id,
            question=question,
            suggested_booking=suggested_booking,
        )
    except Exception:
        pass
