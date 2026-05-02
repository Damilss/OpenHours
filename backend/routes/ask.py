from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.rag import answer_question

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
    """
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    result = await answer_question(request.question, request.course_id)
    return result
