# Spec: Chat History & Sidebar

## Status: Implemented

---

## Requirements

1. Student chat conversations must persist across page refreshes and sessions
2. Each course has its own independent chat history
3. Switching between courses loads that course's chat history
4. Students can start new conversations without losing past ones
5. Students can manage past chats: rename, pin to top, delete with confirmation
6. Pinned chats appear in a separate section above recent chats
7. The input box must remain focused after sending a message
8. Sending must be blocked while a response is loading

---

## Design

### Data Model

Two new Supabase tables:

**`chat_sessions`** — one row per conversation
| column | type | notes |
|---|---|---|
| id | uuid | PK |
| student_id | uuid | FK → profiles |
| course_id | uuid | FK → courses |
| title | text | first message, truncated to 50 chars |
| pinned | boolean | default false |
| created_at | timestamptz | |
| updated_at | timestamptz | bumped on each new message |

**`chat_messages`** — one row per message
| column | type | notes |
|---|---|---|
| id | uuid | PK |
| session_id | uuid | FK → chat_sessions |
| role | text | 'user' or 'assistant' |
| content | text | |
| created_at | timestamptz | |

RLS: students can only read/write their own sessions and messages.

### Session lifecycle
1. Student types first message → new `chat_session` created with title = first message (truncated)
2. Each message pair (user + assistant) inserted into `chat_messages`
3. `chat_sessions.updated_at` bumped after each exchange
4. Sidebar refreshes after each exchange without clearing the active chat

### Sidebar behavior
- Loads sessions for the active course on mount and on course switch
- Pinned sessions sorted first, then by `updated_at` desc
- Clicking a session loads its messages from `chat_messages`
- "New chat" clears messages and `activeSessionId` without touching the DB

---

## Implementation

### Files changed
- `frontend/app/student/page.tsx` — full rewrite with sidebar, session management, join modal
- `supabase/schema.sql` — `chat_sessions` and `chat_messages` tables + RLS

### Key decisions
- Session title is auto-generated from the first message rather than asking the user to name it
- `loadSessions` accepts a `keepMessages` flag to refresh the sidebar without wiping the active chat — this was the fix for messages disappearing after send
- `SessionItem` is extracted as a separate component to keep the main page manageable
- Hover effects use inline `onMouseEnter`/`onMouseLeave` instead of Tailwind hover classes due to Tailwind purging dynamic class strings

### SQL to run
```sql
create table if not exists chat_sessions (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid references profiles(id) on delete cascade not null,
  course_id   uuid references courses(id) on delete cascade not null,
  title       text not null default 'New conversation',
  pinned      boolean not null default false,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
create index on chat_sessions(student_id, updated_at desc);

create table if not exists chat_messages (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid references chat_sessions(id) on delete cascade not null,
  role        text not null check (role in ('user', 'assistant')),
  content     text not null,
  created_at  timestamptz default now()
);
create index on chat_messages(session_id, created_at);

alter table chat_sessions enable row level security;
alter table chat_messages  enable row level security;

create policy "chat_sessions: student owns" on chat_sessions
  for all using (auth.uid() = student_id);

create policy "chat_messages: student owns via session" on chat_messages
  for all using (
    exists (
      select 1 from chat_sessions
      where chat_sessions.id = chat_messages.session_id
        and chat_sessions.student_id = auth.uid()
    )
  );
```

---

## Known Issues / Future Work
- Chat titles are never updated after the first message — could be improved with AI-generated titles
- No pagination on chat history — could get slow with many sessions
- No way to search past chats
