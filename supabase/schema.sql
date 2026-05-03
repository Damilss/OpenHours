-- OpenHours — Supabase Schema
-- Run this in the Supabase SQL Editor after enabling the vector extension.
--
-- Step 1: Dashboard → Database → Extensions → enable "vector"
-- Step 2: Paste and run this entire file in the SQL Editor

-- ============================================================
-- Extensions
-- ============================================================

create extension if not exists vector;


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
  created_at    timestamptz default now()
);

create index if not exists courses_professor_id_idx on courses(professor_id);


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
alter table documents      enable row level security;
alter table chat_sessions  enable row level security;
alter table chat_messages  enable row level security;
alter table bookings       enable row level security;
alter table question_logs  enable row level security;

-- Profiles: users can read/update their own row
create policy "profiles: own row" on profiles
  for all using (auth.uid() = id);

-- Courses: professors manage their own; students can read all
create policy "courses: professor owns" on courses
  for all using (
    auth.uid() = professor_id
  );

create policy "courses: students read" on courses
  for select using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'student'
    )
  );

-- Documents: professors manage their course docs; students read
create policy "documents: professor owns" on documents
  for all using (
    exists (
      select 1 from courses
      where courses.id = documents.course_id
        and courses.professor_id = auth.uid()
    )
  );

create policy "documents: students read" on documents
  for select using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'student'
    )
  );

-- Chat sessions: students manage their own
create policy "chat_sessions: student owns" on chat_sessions
  for all using (auth.uid() = student_id);

-- Chat messages: students manage messages within their own sessions
create policy "chat_messages: student owns" on chat_messages
  for all using (
    exists (
      select 1 from chat_sessions
      where chat_sessions.id = chat_messages.session_id
        and chat_sessions.student_id = auth.uid()
    )
  );

-- Bookings: students manage their own; professors read bookings for their courses
create policy "bookings: student owns" on bookings
  for all using (auth.uid() = student_id);

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
