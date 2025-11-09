# 🧠 Coding AI Briefing: React + Supabase **Accountability App**

## 📁 Project Structure
```
/accountability-app
  /src
    /components
    /pages
    /lib
  supabaseClient.ts
  App.tsx
  index.tsx
```

---

## ✅ Task List (for the Coding AI)

### [ ] #t1 Setup Supabase Client (`supabaseClient.ts`)
```ts
// src/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://<your-project>.supabase.co'
const supabaseAnonKey = '<your-anon-key>'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```
👉 This will later be moved to environment variables.

---

### [ ] #t2 Supabase Schema (Database Table `tasks`)
```sql
create table if not exists tasks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade,
  title text not null,
  completed boolean default false,
  completed_at timestamp,
  created_at timestamp default now(),
  due_date date,
  repeat text, -- e.g. 'daily', 'every_2_days', 'weekly_mon,wed,fri'
  priority float default 1.0 -- used for random notification weighting
);
```

Optional repeat syntax validation:
```sql
check (
  repeat is null or
  repeat ~ '^(none|daily|every_[0-9]+_days|weekly_[0-9]+x|weekly_(mon|tue|wed|thu|fri|sat|sun)(,(mon|tue|wed|thu|fri|sat|sun))*)$'
)
```

---

### [ ] #t3 Enable Row-Level Security (RLS)
```sql
alter table tasks enable row level security;

create policy "Users can access own tasks" on tasks
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

---

### [ ] #t4 Build Login/Register Page
- Input for email address
- Two buttons: `Login` and `Register`
- On success: redirect to main task page
- On error: show error message

---

### [ ] #t5 Main Task Page (`TaskListPage.tsx`)
- Show tasks in three views (tabs or filters):
  - **Active Tasks**: not completed and `shouldShowToday()` returns true
  - **Completed Tasks**: completed within the last 7 days
  - **Archive**: completed and older than 7 days
- Button to add a new task
- Clicking a task toggles its `completed` state and sets `completed_at`

---

### [ ] #t6 Add Task Form
- Input for task title
- Optional: dropdown for repeat mode (e.g. daily, every 3 days, weekly Mon+Wed)
- Optional: due date picker
- Save to `tasks` table in Supabase

---

### [ ] #t7 Repeat Logic in Frontend (`shouldShowToday()`)
```ts
function shouldShowToday(task: Task, today: Date): boolean {
  const repeat = task.repeat

  if (!repeat || repeat === 'none') return false
  if (repeat === 'daily') return true

  if (repeat.startsWith('every_')) {
    const days = parseInt(repeat.split('_')[1])
    const daysSinceCreated = daysBetween(task.created_at, today)
    return daysSinceCreated % days === 0
  }

  if (repeat.startsWith('weekly_')) {
    if (repeat.endsWith('x')) return true // track actual completions elsewhere
    const todayName = today.toLocaleString('en-US', { weekday: 'short' }).toLowerCase()
    return repeat.includes(todayName)
  }

  return false
}
```

---

### [ ] #t8 Notification Logic – Smart Random Mode
- A scheduled process (e.g. edge function, CRON, or client timer) picks **one repeatable task** to notify the user about.
- The selection favors tasks with **lower recent completion frequency**.
- Example weight formula:
```ts
weight = 1 / (1 + completions_last_30_days)
```
- Tasks with no recent completions are more likely to be selected.

---

### [ ] #t9 Prompt for the Coding AI
> "Build a React app with Supabase login (email/password). After login, the user sees a personalized accountability task list. Tasks can be created with a title, optional due date, and optional repeat pattern. Tasks are shown in three views: active (relevant today), completed (last 7 days), and archived (older). Repeatable tasks may trigger notifications based on a smart random system that prioritizes underperformed tasks."

---

Ready to code! 🚀