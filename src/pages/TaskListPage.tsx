import { useMemo, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTasks } from '../hooks/useTasks'
import { AddTaskForm } from '../components/AddTaskForm'
import { pickTaskForNotification } from '../lib/tasks'
import type { Task } from '../types/task'
import { useSmartNotifications } from '../hooks/useSmartNotifications'
import { CompletionInsights } from '../components/CompletionInsights'
import { useCompletionHistory } from '../hooks/useCompletionHistory'

const tabs = [
  { id: 'active', label: 'Active Tasks' },
  { id: 'completed', label: 'Completed (7 days)' },
  { id: 'archived', label: 'Archive' }
] as const

type TabId = (typeof tabs)[number]['id']

export default function TaskListPage() {
  const { user, signOut } = useAuth()
  const { active, completed, archived, loading, error, createTask, toggleTaskCompletion } = useTasks(user?.id)
  const [tab, setTab] = useState<TabId>('active')
  const [showForm, setShowForm] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const currentTasks = useMemo(() => {
    if (tab === 'completed') return completed
    if (tab === 'archived') return archived
    return active
  }, [tab, active, completed, archived])

  const suggestedTask = useMemo(() => pickTaskForNotification(active), [active])
  const {
    supported: notificationsSupported,
    status: notificationStatus,
    permission: notificationPermission,
    enableNotifications,
    disableNotifications
  } = useSmartNotifications(active)
  const completionHistory = useCompletionHistory(user?.id)

  const handleToggle = async (task: Task) => {
    setActionError(null)
    try {
      await toggleTaskCompletion(task)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to update task'
      setActionError(message)
    }
  }

  return (
    <div className="task-page">
      <header className="task-header">
        <div>
          <p className="eyebrow">Welcome back</p>
          <h1>Your accountability board</h1>
          <p className="muted">{user?.email}</p>
        </div>
        <div className="header-actions">
          <button className="secondary" onClick={() => setShowForm((prev) => !prev)}>
            {showForm ? 'Close form' : 'Add task'}
          </button>
          <button onClick={signOut}>Sign out</button>
        </div>
      </header>

      {showForm ? <AddTaskForm onSubmit={createTask} onCancel={() => setShowForm(false)} /> : null}

      <section className="suggestion-card">
        <p className="eyebrow">Smart reminder</p>
        {suggestedTask ? (
          <>
            <h3>{suggestedTask.title}</h3>
            <p className="muted">
              Repeat pattern: {suggestedTask.repeat ?? 'none'} · Priority weight{' '}
              {(suggestedTask.priority ?? 1).toFixed(1)} ·{' '}
              {suggestedTask.recentCompletions ?? 0} hits last 30d
            </p>
          </>
        ) : (
          <p className="muted">No repeatable tasks to notify today.</p>
        )}
      </section>

      <CompletionInsights {...completionHistory} />

      <section className="notification-settings">
        <p className="eyebrow">Browser notifications</p>
        {!notificationsSupported ? (
          <p className="muted">Notifications are not supported in this browser.</p>
        ) : (
          <>
            <p className="muted">
              Status: {notificationStatus === 'active' ? 'Enabled' : notificationStatus}
              {notificationStatus === 'denied' ? ' · Allow notifications in your browser settings.' : ''}
            </p>
            {notificationStatus === 'active' ? (
              <button className="secondary" onClick={disableNotifications}>
                Pause reminders
              </button>
            ) : (
              <button onClick={enableNotifications}>
                {notificationPermission === 'granted' ? 'Start reminders' : 'Enable notifications'}
              </button>
            )}
          </>
        )}
      </section>

      <nav className="tablist">
        {tabs.map((item) => (
          <button
            key={item.id}
            className={item.id === tab ? 'active' : undefined}
            onClick={() => setTab(item.id)}
          >
            {item.label}
            <span className="count">
              {item.id === 'active'
                ? active.length
                : item.id === 'completed'
                ? completed.length
                : archived.length}
            </span>
          </button>
        ))}
      </nav>

      {loading ? <p>Loading tasks…</p> : null}
      {error ? <p className="error">{error}</p> : null}
      {actionError ? <p className="error">{actionError}</p> : null}

      {!loading && currentTasks.length === 0 ? (
        <div className="empty">
          <p>No tasks in this view yet.</p>
        </div>
      ) : null}

      <ul className="task-list">
        {currentTasks.map((task) => (
          <li key={task.id} className={`task-card ${task.completed ? 'completed' : ''}`}>
            <button onClick={() => handleToggle(task)} className="task-toggle">
              <span className="checkbox" aria-hidden="true">
                {task.completed ? '✓' : ''}
              </span>
              <div>
                <p className="task-title">{task.title}</p>
                <p className="task-meta">
                  {task.repeat ?? 'no repeat'}
                  {task.due_date ? ` · Due ${task.due_date}` : ''}
                  {' · '}
                  {task.recentCompletions ?? 0} hits last 30d
                </p>
              </div>
            </button>
            {task.completed && task.completed_at ? (
              <p className="completed-at">
                Completed at {new Date(task.completed_at).toLocaleDateString()}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  )
}
