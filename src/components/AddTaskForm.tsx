import { FormEvent, useState } from 'react'
import type { TaskInput } from '../types/task'

type AddTaskFormProps = {
  onSubmit: (payload: TaskInput) => Promise<unknown>
  onCancel: () => void
}

const repeatOptions = [
  { label: 'No repeat', value: 'none' },
  { label: 'Daily', value: 'daily' },
  { label: 'Every 2 days', value: 'every_2_days' },
  { label: 'Every 3 days', value: 'every_3_days' },
  { label: 'Weekdays (Mon-Fri)', value: 'weekly_mon,tue,wed,thu,fri' },
  { label: 'Mon/Wed/Fri', value: 'weekly_mon,wed,fri' },
  { label: 'Custom weekly target', value: 'weekly_3x' }
]

export function AddTaskForm({ onSubmit, onCancel }: AddTaskFormProps) {
  const [title, setTitle] = useState('')
  const [repeat, setRepeat] = useState<string>('daily')
  const [customRepeat, setCustomRepeat] = useState('')
  const [dueDate, setDueDate] = useState<string>('')
  const [priority, setPriority] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!title.trim() || saving) return

    const repeatValue = customRepeat.trim() || repeat
    setSaving(true)
    setError(null)
    try {
      await onSubmit({
        title: title.trim(),
        repeat: repeatValue,
        due_date: dueDate || null,
        priority
      })
      setTitle('')
      setRepeat('daily')
      setCustomRepeat('')
      setDueDate('')
      setPriority(1)
      onCancel()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to save task'
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="add-task-form" onSubmit={handleSubmit}>
      <h3>Add a new task</h3>

      <label className="field">
        <span>Task title *</span>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Write the daily habit"
          required
        />
      </label>

      <label className="field">
        <span>Repeat pattern</span>
        <select value={repeat} onChange={(event) => setRepeat(event.target.value)}>
          {repeatOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <input
          value={customRepeat}
          onChange={(event) => setCustomRepeat(event.target.value)}
          placeholder="Or enter custom pattern e.g. weekly_mon,wed"
        />
      </label>

      <label className="field">
        <span>Due date</span>
        <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
      </label>

      <label className="field">
        <span>Priority (affects notifications)</span>
        <input
          type="range"
          min={0.1}
          max={2}
          step={0.1}
          value={priority}
          onChange={(event) => setPriority(Number(event.target.value))}
        />
        <small>Current weight: {priority.toFixed(1)}</small>
      </label>

      {error ? <p className="error">{error}</p> : null}

      <div className="actions">
        <button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save task'}
        </button>
        <button type="button" className="secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
      </div>
    </form>
  )
}
