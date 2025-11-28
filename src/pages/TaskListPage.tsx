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
  const [view, setView] = useState<'board' | 'insights' | 'settings'>('board')
  const [randomMode, setRandomMode] = useState(false)
  const [intervalMinutes, setIntervalMinutes] = useState(15)
  const [focusHours, setFocusHours] = useState(4)
  const [nextTaskMessage, setNextTaskMessage] = useState<string | null>(null)

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
  } = useSmartNotifications(active, { intervalMs: intervalMinutes * 60 * 1000, randomize: randomMode })
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

  const pickNextTask = () => {
    const task = randomMode ? active[Math.floor(Math.random() * (active.length || 1))] : pickTaskForNotification(active)
    if (!task) {
      setNextTaskMessage('Keine Tasks verfügbar.')
      return
    }
    setNextTaskMessage(`Nächster Task: ${task.title}`)
    try {
      if (Notification.permission === 'granted') {
        new Notification('Nächster Task', { body: task.title })
      }
    } catch {
      // ignore if Notification API not available
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

      <div className="view-switch">
        <button className={view === 'board' ? 'active' : 'secondary'} onClick={() => setView('board')}>
          Tasks
        </button>
        <button className={view === 'insights' ? 'active' : 'secondary'} onClick={() => setView('insights')}>
          Completion insights
        </button>
        <button className={view === 'settings' ? 'active' : 'secondary'} onClick={() => setView('settings')}>
          Einstellungen
        </button>
      </div>

      {showForm ? <AddTaskForm onSubmit={createTask} onCancel={() => setShowForm(false)} /> : null}

      {view === 'board' ? (
        <>
          <section className="suggestion-card">
            <div className="suggestion-header">
              <div>
                <p className="eyebrow">Priority suggestion</p>
                {suggestedTask ? (
                  <>
                    <h3>{suggestedTask.title}</h3>
                    <p className="muted">
                      Wiederholung: {suggestedTask.repeat ?? 'keine'} · Gewicht {(suggestedTask.priority ?? 1).toFixed(1)} ·{' '}
                      {suggestedTask.recentCompletions ?? 0} Treffer letzte 30 Tage
                    </p>
                  </>
                ) : (
                  <p className="muted">Keine Vorschläge für heute.</p>
                )}
              </div>
              <div className="suggestion-actions">
                <button className="secondary" onClick={pickNextTask}>
                  Nächster Task
                </button>
                <button onClick={enableNotifications}>
                  {notificationPermission === 'granted' ? 'Start & Focus' : 'Benachrichtigen'}
                </button>
              </div>
            </div>
            {nextTaskMessage ? <p className="status">{nextTaskMessage}</p> : null}
          </section>

          <section className="focus-panel">
            <div className="focus-row">
              <label>
                <input
                  type="checkbox"
                  checked={randomMode}
                  onChange={(event) => setRandomMode(event.target.checked)}
                />{' '}
                Zufall (Priorität ignorieren)
              </label>
              <div className="badge">
                Fokus-Fenster: {focusHours}h · Benachrichtigung alle {intervalMinutes} min
              </div>
            </div>
            <div className="focus-controls">
              <div>
                <p className="muted">Fokus-Zeitraum (Stunden)</p>
                <input
                  type="range"
                  min={1}
                  max={8}
                  step={1}
                  value={focusHours}
                  onChange={(event) => setFocusHours(Number(event.target.value))}
                />
              </div>
              <div>
                <p className="muted">Benachrichtigung alle (Minuten)</p>
                <input
                  type="range"
                  min={5}
                  max={60}
                  step={5}
                  value={intervalMinutes}
                  onChange={(event) => setIntervalMinutes(Number(event.target.value))}
                />
              </div>
            </div>
          </section>
        </>
      ) : null}

      {view === 'insights' ? <CompletionInsights {...completionHistory} /> : null}

      {view === 'settings' ? (
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
      ) : null}

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
