-- OpenHours — Supabase Schema
-- Run this in the Supabase SQL Editor after enabling the vector extension.
--
-- Step 1: Dashboard → Database → Extensions → enable "vector"
-- Step 2: Paste and run this entire file in the SQL Editor

-- ============================================================
-- Extensions
-- ============================================================

create extension if not exists vector;
create extension if not exists pgcrypto;


-- ============================================================
-- Profiles (extends Supabase auth.users)
-- ============================================================

create table if not exists profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  role        text not null check (role in ('professor', 'student')),
  full_name   text,
  created_at  timestamptz default now()
);

-- Auto-create a profile row when a new user signs up
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'student'),
    coalesce(new.raw_user_meta_data->>'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();


-- ============================================================
-- Courses
-- ============================================================

create table if not exists courses (
  id            uuid primary key default gen_random_uuid(),
  professor_id  uuid references profiles(id) on delete cascade not null,
  name          text not null,
  description   text,
  join_code     text,
  created_at    timestamptz default now()
);

alter table courses
  add column if not exists join_code text;

create index if not exists courses_professor_id_idx on courses(professor_id);

-- Permanent student-facing course codes. Existing courses are backfilled below.
create or replace function generate_course_join_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  code text;
begin
  loop
    code := upper(substr(encode(gen_random_bytes(8), 'base64'), 1, 6));
    code := translate(code, '+/', 'AB');

    exit when not exists (
      select 1 from public.courses where join_code = code
    );
  end loop;

  return code;
end;
$$;

create or replace function normalize_course_join_code()
returns trigger language plpgsql as $$
begin
  if new.join_code is null or length(trim(new.join_code)) = 0 then
    new.join_code := generate_course_join_code();
  else
    new.join_code := upper(regexp_replace(new.join_code, '[^A-Za-z0-9]', '', 'g'));
  end if;

  return new;
end;
$$;

drop trigger if exists courses_normalize_join_code on courses;
create trigger courses_normalize_join_code
  before insert or update of join_code on courses
  for each row execute procedure normalize_course_join_code();

alter table courses
  alter column join_code set default generate_course_join_code();

update courses
set join_code = generate_course_join_code()
where join_code is null or length(trim(join_code)) = 0;

alter table courses
  alter column join_code set not null;

create unique index if not exists courses_join_code_key on courses(join_code);

alter table courses
  drop constraint if exists courses_join_code_format;

alter table courses
  add constraint courses_join_code_format
  check (join_code ~ '^[A-Z0-9]{6}$');


-- ============================================================
-- Enrollments (students join courses with professor-provided codes)
-- ============================================================

create table if not exists enrollments (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid references profiles(id) on delete cascade not null,
  course_id   uuid references courses(id) on delete cascade not null,
  created_at  timestamptz default now(),
  unique (student_id, course_id)
);

create index if not exists enrollments_student_id_idx on enrollments(student_id);
create index if not exists enrollments_course_id_idx on enrollments(course_id);
create unique index if not exists enrollments_student_course_key
  on enrollments(student_id, course_id);

create or replace function join_course_by_code(p_code text)
returns table (id uuid, name text, description text)
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_code text;
  current_role text;
  joined_course_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select profiles.role into current_role
  from profiles
  where profiles.id = auth.uid();

  if current_role is distinct from 'student' then
    raise exception 'Only students can join courses';
  end if;

  normalized_code := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));

  select courses.id into joined_course_id
  from courses
  where courses.join_code = normalized_code;

  if joined_course_id is null then
    return;
  end if;

  insert into enrollments (student_id, course_id)
  values (auth.uid(), joined_course_id)
  on conflict (student_id, course_id) do nothing;

  return query
    select courses.id, courses.name, courses.description
    from courses
    where courses.id = joined_course_id;
end;
$$;

grant execute on function join_course_by_code(text) to authenticated;


-- ============================================================
-- Documents (parsed chunks + pgvector embeddings)
-- ============================================================

create table if not exists documents (
  id           uuid primary key default gen_random_uuid(),
  course_id    uuid references courses(id) on delete cascade not null,
  content      text not null,
  embedding    vector(1536),          -- OpenAI text-embedding-3-small dimensions
  source_file  text,
  created_at   timestamptz default now()
);

create index if not exists documents_course_id_idx on documents(course_id);

-- IVFFlat index for fast approximate nearest-neighbour search
-- (create after inserting data; lists ≈ rows/1000, min 10)
-- create index documents_embedding_idx on documents
--   using ivfflat (embedding vector_cosine_ops) with (lists = 100);


-- ============================================================
-- Semantic search function (called by the FastAPI backend)
-- ============================================================

create or replace function match_documents(
  query_embedding  vector(1536),
  match_course_id  uuid,
  match_count      int default 6
)
returns table (content text, similarity float)
language sql stable
as $$
  select
    content,
    1 - (embedding <-> query_embedding) as similarity
  from documents
  where course_id = match_course_id
    and embedding is not null
  order by embedding <-> query_embedding
  limit match_count;
$$;


-- ============================================================
-- Chat sessions (student conversation history)
-- ============================================================

create table if not exists chat_sessions (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid references profiles(id) on delete cascade not null,
  course_id   uuid references courses(id) on delete cascade not null,
  title       text not null,
  pinned      boolean not null default false,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create index if not exists chat_sessions_student_course_idx
  on chat_sessions(student_id, course_id);
create index if not exists chat_sessions_updated_at_idx
  on chat_sessions(updated_at desc);


-- ============================================================
-- Chat messages (one row per turn within a session)
-- ============================================================

create table if not exists chat_messages (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid references chat_sessions(id) on delete cascade not null,
  role        text not null check (role in ('user', 'assistant')),
  content     text not null,
  created_at  timestamptz default now()
);

create index if not exists chat_messages_session_id_idx
  on chat_messages(session_id, created_at);


-- ============================================================
-- Office hours bookings
-- (Unused — feature not exposed in current UI; kept for future use.)
-- ============================================================

create table if not exists bookings (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid references profiles(id) on delete cascade not null,
  course_id   uuid references courses(id) on delete cascade not null,
  message     text,
  status      text not null default 'pending'
              check (status in ('pending', 'confirmed', 'declined')),
  created_at  timestamptz default now()
);

create index if not exists bookings_course_id_idx  on bookings(course_id);
create index if not exists bookings_student_id_idx on bookings(student_id);
create index if not exists bookings_status_idx     on bookings(status);


-- ============================================================
-- Question logs (for analytics)
-- ============================================================

create table if not exists question_logs (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid references courses(id) on delete cascade not null,
  question    text not null,
  created_at  timestamptz default now()
);

create index if not exists question_logs_course_id_idx on question_logs(course_id);
create index if not exists question_logs_created_at_idx on question_logs(created_at desc);


-- ============================================================
-- Row Level Security
-- ============================================================

alter table profiles       enable row level security;
alter table courses        enable row level security;
alter table enrollments    enable row level security;
alter table documents      enable row level security;
alter table chat_sessions  enable row level security;
alter table chat_messages  enable row level security;
alter table bookings       enable row level security;
alter table question_logs  enable row level security;

drop policy if exists "profiles: own row" on profiles;
drop policy if exists "courses: professor owns" on courses;
drop policy if exists "courses: students read" on courses;
drop policy if exists "courses: enrolled students read" on courses;
drop policy if exists "enrollments: student reads own" on enrollments;
drop policy if exists "enrollments: professor reads course" on enrollments;
drop policy if exists "documents: professor owns" on documents;
drop policy if exists "documents: students read" on documents;
drop policy if exists "documents: enrolled students read" on documents;
drop policy if exists "chat_sessions: student owns" on chat_sessions;
drop policy if exists "chat_sessions: student reads own" on chat_sessions;
drop policy if exists "chat_sessions: student inserts enrolled" on chat_sessions;
drop policy if exists "chat_sessions: student updates own enrolled" on chat_sessions;
drop policy if exists "chat_sessions: student deletes own" on chat_sessions;
drop policy if exists "chat_messages: student owns" on chat_messages;
drop policy if exists "bookings: student owns" on bookings;
drop policy if exists "bookings: student owns enrolled" on bookings;
drop policy if exists "bookings: professor reads" on bookings;
drop policy if exists "bookings: professor updates" on bookings;
drop policy if exists "question_logs: professor reads" on question_logs;

-- Profiles: users can read/update their own row
create policy "profiles: own row" on profiles
  for all using (auth.uid() = id);

-- Courses: professors manage their own; students read only enrolled courses
create policy "courses: professor owns" on courses
  for all using (
    auth.uid() = professor_id
  ) with check (
    auth.uid() = professor_id
  );

create policy "courses: enrolled students read" on courses
  for select using (
    exists (
      select 1 from enrollments
      where enrollments.course_id = courses.id
        and enrollments.student_id = auth.uid()
    )
  );

-- Enrollments: students read their own rows.
-- Inserts happen through join_course_by_code(), not direct client writes.
create policy "enrollments: student reads own" on enrollments
  for select using (auth.uid() = student_id);

-- Documents: professors manage their course docs; enrolled students read
create policy "documents: professor owns" on documents
  for all using (
    exists (
      select 1 from courses
      where courses.id = documents.course_id
        and courses.professor_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from courses
      where courses.id = documents.course_id
        and courses.professor_id = auth.uid()
    )
  );

create policy "documents: enrolled students read" on documents
  for select using (
    exists (
      select 1 from enrollments
      where enrollments.course_id = documents.course_id
        and enrollments.student_id = auth.uid()
    )
  );

-- Chat sessions: students manage their own chats for enrolled courses
create policy "chat_sessions: student reads own" on chat_sessions
  for select using (auth.uid() = student_id);

create policy "chat_sessions: student inserts enrolled" on chat_sessions
  for insert with check (
    auth.uid() = student_id
    and exists (
      select 1 from enrollments
      where enrollments.student_id = auth.uid()
        and enrollments.course_id = chat_sessions.course_id
    )
  );

create policy "chat_sessions: student updates own enrolled" on chat_sessions
  for update using (auth.uid() = student_id)
  with check (
    auth.uid() = student_id
    and exists (
      select 1 from enrollments
      where enrollments.student_id = auth.uid()
        and enrollments.course_id = chat_sessions.course_id
    )
  );

create policy "chat_sessions: student deletes own" on chat_sessions
  for delete using (auth.uid() = student_id);

-- Chat messages: students manage messages within their own sessions
create policy "chat_messages: student owns" on chat_messages
  for all using (
    exists (
      select 1 from chat_sessions
      where chat_sessions.id = chat_messages.session_id
        and chat_sessions.student_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from chat_sessions
      where chat_sessions.id = chat_messages.session_id
        and chat_sessions.student_id = auth.uid()
    )
  );

-- Bookings: students manage their own enrolled-course requests; professors manage requests for their courses
create policy "bookings: student owns enrolled" on bookings
  for all using (
    auth.uid() = student_id
  ) with check (
    auth.uid() = student_id
    and exists (
      select 1 from enrollments
      where enrollments.student_id = auth.uid()
        and enrollments.course_id = bookings.course_id
    )
  );

create policy "bookings: professor reads" on bookings
  for select using (
    exists (
      select 1 from courses
      where courses.id = bookings.course_id
        and courses.professor_id = auth.uid()
    )
  );

create policy "bookings: professor updates" on bookings
  for update using (
    exists (
      select 1 from courses
      where courses.id = bookings.course_id
        and courses.professor_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from courses
      where courses.id = bookings.course_id
        and courses.professor_id = auth.uid()
    )
  );

-- Question logs: backend service role writes; professors read their course logs
create policy "question_logs: professor reads" on question_logs
  for select using (
    exists (
      select 1 from courses
      where courses.id = question_logs.course_id
        and courses.professor_id = auth.uid()
    )
  );
