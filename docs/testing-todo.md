# 🧪 Unit Testing TODO

We currently only cover the pure helpers in `src/lib/tasks.ts` and the derived math exported from `useCompletionHistory`. Everything else (hooks, components, edge logic) still lacks regression coverage. The list below captures the next unit/integration tests we should add.

### [x] #t1 Stabilize `useTasks` data flow
- Mock Supabase client calls for `.from('tasks')`, `.from('task_completions')`, and mutation paths.
- Assert loading/error transitions and the enrichment of `recentCompletions`.
- Cover toggling completion to ensure insert/delete side-effects run exactly once per call.

### [x] #t2 Exercise `useSmartNotifications`
- Fake the `Notification` API and timers to verify requestPermission, enable/pause, and interval scheduling.
- Confirm that it calls `pickTaskForNotification` with the freshest task list.

### [x] #t3 Component tests for `CompletionInsights`
- Snapshot/core assertions for streak/summary cards given mock props.
- Validate bar chart renders 14 points and recent log truncates to five entries.

### [x] #t4 Form interaction tests (`AddTaskForm`)
- Use React Testing Library to submit a title, change repeat/due date/priority, and ensure `onSubmit` payload matches expectations.
- Cover validation edge cases (empty title, custom repeat).

### [x] #t5 Auth UI flow (`AuthPage`)
- Simulate login/register clicks, propagate mock `useAuth` context handlers, and assert loading/disabled states + error rendering.

### [x] #t6 Task list integration (`TaskListPage`)
- Mock `useTasks`, `useCompletionHistory`, and `useSmartNotifications` to ensure tabs/filtering, completion toggles, and notification controls render consistently.

### [x] #t7 Edge function logic
- Extract `pickTaskForNotification` helpers (or import from shared file) into a Deno test that mocks Supabase responses, ensuring weighting honors completion counts server-side.

### [ ] #t8 Lint/test automation
- Add CI job (GitHub Action or Supabase pipeline) that runs `npm run lint` and `npm run test` to prevent regressions from landing untested.

### [ ] #t9 Coverage tracking
- Configure Vitest `coverage: true` with thresholds so we can measure progress as we add the suites above.
