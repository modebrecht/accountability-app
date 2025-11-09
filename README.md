## Accountability App

React + Supabase project for recurring accountability tasks with smart reminders.

### Getting Started

1. Copy `.env.example` to `.env` and populate `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
2. Install dependencies: `npm install`.
3. Run dev server: `npm run dev`.

### Database Setup

Use the Supabase SQL editor or CLI to run `supabase/schema.sql`. It will:

- Enable `uuid-ossp`,
- Create the `tasks` table,
- Enforce repeat pattern validation,
- Enable RLS and add the per-user policy.

### Edge Function: Smart Task Notify

- Location: `supabase/functions/smart-task-notify`.
- Deploy with `supabase functions deploy smart-task-notify --env-file ./supabase/.env`.
- Expects `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
- Call with POST body: `{ "user_id": "<uuid>" }`.
- Returns `{ "task": Task | null }` favoring tasks with fewer recent completions and lower priority weight.

Schedule the function via Supabase cron or your scheduler of choice to push reminders.
