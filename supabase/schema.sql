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

alter table tasks
  drop constraint if exists repeat_format;

alter table tasks
  add constraint repeat_format check (
    repeat is null or
    repeat ~ '^(none|daily|every_[0-9]+_days|weekly_[0-9]+x|weekly_(mon|tue|wed|thu|fri|sat|sun)(,(mon|tue|wed|thu|fri|sat|sun))*)$'
  );
