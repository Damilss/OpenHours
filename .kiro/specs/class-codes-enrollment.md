# Spec: Class Codes & Course Enrollment

## Status: Implemented

---

## Requirements

1. Students must enter a class code to access a course's AI assistant
2. Professors get an auto-generated code when creating a course
3. The code must be visible and copyable on the professor dashboard
4. Students join via a modal that accepts the code and enrolls them immediately
5. After joining, the course is immediately available and selected
6. Students only see courses they are enrolled in — not all courses
7. Invalid codes must show a clear error message

---

## Design

### Data Model

**`courses`** — new column added
| column | type | notes |
|---|---|---|
| join_code | text | unique, 6-char uppercase, generated on course creation |

**`enrollments`** — new table
| column | type | notes |
|---|---|---|
| id | uuid | PK |
| student_id | uuid | FK → profiles |
| course_id | uuid | FK → courses |
| created_at | timestamptz | |
| — | unique(student_id, course_id) | prevents duplicate enrollments |

### RLS strategy

The tricky part: students querying courses by join code before they're enrolled creates a chicken-and-egg RLS problem.

**Solution:** Two `security definer` functions that run as the DB owner, bypassing RLS:
- `get_enrolled_course_ids(student_id)` — returns course IDs a student is enrolled in, used in the courses RLS policy
- `get_course_by_join_code(code)` — looks up a course by join code, used during the join flow before enrollment exists

This avoids infinite recursion between the `courses` and `enrollments` RLS policies.

### Join flow
1. Student opens modal, enters code
2. Frontend calls `supabase.rpc("get_course_by_join_code", { code })` — bypasses RLS
3. If found, insert into `enrollments`
4. Add course to local state, select it, load its chat sessions

---

## Implementation

### Files changed
- `frontend/app/student/page.tsx` — enrollment query on load, join modal, RPC call
- `frontend/app/professor/page.tsx` — `join_code` in course query, display + copy button
- `frontend/app/professor/upload/page.tsx` — generates `join_code` on course creation

### Key decisions
- Join code is 6 chars, uppercase alphanumeric, generated client-side with `Math.random().toString(36).substring(2, 8).toUpperCase()`
- Used `security definer` RPC functions rather than disabling RLS to keep the security model intact
- The "professor owns" policy is kept simple (`auth.uid() = professor_id`) with no joins to avoid recursion

### SQL to run
```sql
-- Add join code column
alter table courses add column if not exists join_code text unique;

-- Enrollments table
create table if not exists enrollments (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid references profiles(id) on delete cascade not null,
  course_id   uuid references courses(id) on delete cascade not null,
  created_at  timestamptz default now(),
  unique(student_id, course_id)
);
alter table enrollments enable row level security;

-- RLS policies
drop policy if exists "courses: students read" on courses;
drop policy if exists "courses: professor owns" on courses;
drop policy if exists "enrollments: student owns" on enrollments;
drop policy if exists "enrollments: professor reads" on enrollments;

create policy "courses: professor owns" on courses
  for all using (auth.uid() = professor_id);

create or replace function get_enrolled_course_ids(student_id uuid)
returns setof uuid language sql security definer stable as $$
  select course_id from enrollments where enrollments.student_id = $1;
$$;

create policy "courses: students read" on courses
  for select using (
    courses.id in (select get_enrolled_course_ids(auth.uid()))
  );

create policy "enrollments: student owns" on enrollments
  for all using (auth.uid() = student_id);

create policy "enrollments: professor reads" on enrollments
  for select using (
    exists (
      select 1 from courses
      where courses.id = enrollments.course_id
        and courses.professor_id = auth.uid()
    )
  );

-- Bypass RLS for join code lookup
create or replace function get_course_by_join_code(code text)
returns table (id uuid, name text, description text)
language sql security definer stable as $$
  select id, name, description from courses where join_code = upper(code) limit 1;
$$;
```

---

## Known Issues / Future Work
- No way for a professor to regenerate a join code if it's compromised
- No expiry on join codes
- No student count visible to professors per course
- Professors can't remove a student from a course
