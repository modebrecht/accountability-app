import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { pickTaskForNotification, shouldShowToday, Task } from './logic'

const baseTask: Task = {
  id: 'task-1',
  user_id: 'user-1',
  title: 'Task',
  repeat: 'daily',
  completed_at: null,
  priority: 1,
  created_at: '2024-08-01T00:00:00Z',
  recent_completions: 0
}

describe('shouldShowToday (edge logic)', () => {
  const today = new Date('2024-08-05T12:00:00Z')

  it('supports daily tasks', () => {
    expect(shouldShowToday(baseTask, today)).toBe(true)
  })

  it('respects every_n cadence', () => {
    const task = { ...baseTask, repeat: 'every_2_days', created_at: '2024-08-03T00:00:00Z' }
    expect(shouldShowToday(task, today)).toBe(true)
  })

  it('handles weekly specific days', () => {
    const task = { ...baseTask, repeat: 'weekly_mon,wed' }
    expect(shouldShowToday(task, today)).toBe(true)
  })
})

describe('pickTaskForNotification (edge logic)', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0.05)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('favors lower completion counts', () => {
    const today = new Date('2024-08-05T12:00:00Z')
    const high = { ...baseTask, id: 'high', recent_completions: 5 }
    const low = { ...baseTask, id: 'low', recent_completions: 0 }

    const task = pickTaskForNotification([high, low], today)
    expect(task?.id).toBe('low')
  })

  it('returns null when nothing repeats today', () => {
    const today = new Date('2024-08-05T12:00:00Z')
    const task = { ...baseTask, repeat: 'none' }
    expect(pickTaskForNotification([task], today)).toBeNull()
  })
})
