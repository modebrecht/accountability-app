create extension if not exists "uuid-ossp";

create table if not exists tasks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade,
  title text not null,
  completed boolean default false,
  completed_at timestamp,
  created_at timestamp default timezone('utc', now()),
  due_date date,
  repeat text,
  priority float default 1.0
);

alter table tasks enable row level security;

create policy "Users can access own tasks" on tasks
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists task_completions (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid references tasks(id) on delete cascade,
  user_id uuid references auth.users on delete cascade,
  completed_at timestamp with time zone default timezone('utc', now())
);

create index if not exists task_completions_task_id_idx on task_completions(task_id);
create index if not exists task_completions_user_id_completed_at_idx on task_completions(user_id, completed_at desc);

alter table task_completions enable row level security;

create policy "Users manage own completion logs" on task_completions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table tasks
  drop constraint if exists repeat_format;

alter table tasks
  add constraint repeat_format check (
    repeat is null or
    repeat ~ '^(none|daily|every_[0-9]+_days|weekly_[0-9]+x|weekly_(mon|tue|wed|thu|fri|sat|sun)(,(mon|tue|wed|thu|fri|sat|sun))*)$'
  );
