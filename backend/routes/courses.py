import os
import uuid
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

# TODO (before deployment): Add auth middleware to verify the Supabase JWT on all
# routes in this file. Currently any caller who can reach the API can create/delete
# courses or read any professor's data by guessing IDs.
# Fix: extract the user ID from the verified JWT and assert it matches the
# professor_id / course owner before executing any operation.
# See: https://supabase.com/docs/guides/auth/jwts


def get_supabase():
    url = os.environ.get("SUPABASE_URL", "")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    if not url or not key or url == "placeholder":
        raise RuntimeError("Supabase is not configured yet.")
    return create_client(url, key)


class CreateCourseRequest(BaseModel):
    name: str
    description: str = ""
    professor_id: str  # Supabase auth user ID of the professor


class CourseResponse(BaseModel):
    id: str
    name: str
    description: str
    professor_id: str


@router.post("/", response_model=CourseResponse)
async def create_course(request: CreateCourseRequest):
    """
    Create a new course. Called when a professor sets up a course for the first time.
    Returns the course ID which is used for all subsequent upload and ask requests.
    """
    if not request.name.strip():
        raise HTTPException(status_code=400, detail="Course name cannot be empty.")

    supabase = get_supabase()
    course_id = str(uuid.uuid4())

    result = supabase.table("courses").insert({
        "id": course_id,
        "name": request.name.strip(),
        "description": request.description.strip(),
        "professor_id": request.professor_id,
    }).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create course.")

    return result.data[0]


@router.get("/{professor_id}")
async def get_courses(professor_id: str):
    """
    Get all courses for a professor.
    Used to populate the professor dashboard course list.
    """
    supabase = get_supabase()
    result = (
        supabase.table("courses")
        .select("id, name, description, created_at")
        .eq("professor_id", professor_id)
        .order("created_at", desc=True)
        .execute()
    )

    return {"courses": result.data or []}


@router.delete("/{course_id}")
async def delete_course(course_id: str):
    """
    Delete a course and all its associated documents and queries.
    """
    supabase = get_supabase()

    # Delete associated data first (foreign key order)
    supabase.table("student_queries").delete().eq("course_id", course_id).execute()
    supabase.table("documents").delete().eq("course_id", course_id).execute()
    supabase.table("courses").delete().eq("id", course_id).execute()

    return {"message": "Course deleted successfully."}
