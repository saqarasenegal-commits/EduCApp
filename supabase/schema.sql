-- EduCApp storage. Only the server (secret key) reads and writes these tables:
-- RLS is enabled with no policies, so the public/anon key has no access.

create table if not exists public.edu_students (
  id uuid primary key,
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 1 and 60),
  level text not null,
  grade text not null,
  lang text not null default 'fr' check (lang in ('fr', 'en'))
);

create table if not exists public.edu_results (
  id uuid primary key,
  student_id uuid not null references public.edu_students (id) on delete cascade,
  date timestamptz not null default now(),
  data jsonb not null
);
create index if not exists edu_results_student_date_idx on public.edu_results (student_id, date);

-- Tests waiting to be submitted (they hold the answers, so never exposed to browsers).
create table if not exists public.edu_quizzes (
  id uuid primary key,
  created_at timestamptz not null default now(),
  data jsonb not null
);
create index if not exists edu_quizzes_created_idx on public.edu_quizzes (created_at);

alter table public.edu_students enable row level security;
alter table public.edu_results enable row level security;
alter table public.edu_quizzes enable row level security;
