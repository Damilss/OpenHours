-- ============================================================
-- OpenHours Database Schema
-- Run this in Supabase SQL Editor after enabling pgvector
-- ============================================================

-- Enable pgvector extension (required for embeddings)
create extension if not exists vector;

-- ============================================================
-- Profiles (extends Supabase auth.users)
-- ============================================================
create table profiles (
  id uuid references auth.users(id) primary key,
  role text check (role in ('professor', 'student')),
  full_name text,
  created_at timestamp default now()
);

-- ============================================================
-- Courses
-- ============================================================
create table courses (
  id uuid primary key default gen_random_uuid(),
  professor_id uuid references profiles(id),
  name text not null,
  description text,
  created_at timestamp default now()
);

-- ============================================================
-- Documents (parsed chunks + embeddings from uploaded files)
-- ============================================================
create table documents (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses(id),
  content text not null,
  embedding vector(1536),
  source_file text,
  created_at timestamp default now()
);

-- ============================================================
-- Student Queries (logged for analytics)
-- Stores extracted topic keywords only — never raw question text (privacy)
-- ============================================================
create table student_queries (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses(id),
  topics text[] default '{}',          -- e.g. {"binary search", "arrays"}
  suggested_booking boolean default false,
  created_at timestamp default now()
);

-- ============================================================
-- Office Hours Bookings
-- ============================================================
create table bookings (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references profiles(id),
  course_id uuid references courses(id),
  message text,
  status text default 'pending',
  created_at timestamp default now()
);

-- ============================================================
-- Semantic Search Function (used by RAG pipeline)
-- Finds the most relevant document chunks for a given query
-- ============================================================
create or replace function match_documents(
  query_embedding vector(1536),
  match_course_id uuid,
  match_count int default 5
)
returns table(content text, source_file text, similarity float)
language sql stable
as $$
  select
    content,
    source_file,
    1 - (embedding <-> query_embedding) as similarity
  from documents
  where course_id = match_course_id
  order by embedding <-> query_embedding
  limit match_count;
$$;
