import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest'
import type { Task } from '../types/task'
import { shouldShowToday, splitTasks, pickTaskForNotification, daysBetween } from './tasks'

const baseTask: Task = {
  id: 'task-1',
  user_id: 'user-1',
  title: 'Test task',
  completed: false,
  completed_at: null,
  created_at: new Date().toISOString(),
  due_date: null,
  repeat: 'daily',
  priority: 1,
  recentCompletions: 0
}

function createTask(overrides: Partial<Task>): Task {
  return { ...baseTask, ...overrides }
}

describe('daysBetween', () => {
  it('computes whole day differences regardless of time', () => {
    const start = new Date('2024-08-01T05:00:00Z')
    const end = new Date('2024-08-04T03:00:00Z')
    expect(daysBetween(start, end)).toBe(2)
  })
})

describe('shouldShowToday', () => {
  const today = new Date('2024-08-05T12:00:00Z')

  it('returns true for daily tasks', () => {
    const task = createTask({ repeat: 'daily' })
    expect(shouldShowToday(task, today)).toBe(true)
  })

  it('handles every_n_days cadence', () => {
    const created = new Date('2024-07-31T00:00:00Z').toISOString()
    const task = createTask({ repeat: 'every_3_days', created_at: created })
    expect(shouldShowToday(task, today)).toBe(true)
  })

  it('returns false when every_n cadence does not align', () => {
    const created = new Date('2024-08-01T00:00:00Z').toISOString()
    const task = createTask({ repeat: 'every_4_days', created_at: created })
    expect(shouldShowToday(task, today)).toBe(false)
  })

  it('matches weekly patterns', () => {
    const task = createTask({ repeat: 'weekly_mon,wed,fri' })
    expect(shouldShowToday(task, today)).toBe(true)
  })

  it('treats weekly_x goal as always due', () => {
    const task = createTask({ repeat: 'weekly_3x' })
    expect(shouldShowToday(task, today)).toBe(true)
  })

  it('returns false for none repeat', () => {
    const task = createTask({ repeat: 'none' })
    expect(shouldShowToday(task, today)).toBe(false)
  })
})

describe('splitTasks', () => {
  it('categorizes tasks into active/completed/archived buckets', () => {
    const today = new Date('2024-08-05T12:00:00Z')
    const activeTask = createTask({ id: 'active', repeat: 'daily' })
    const completedRecent = createTask({
      id: 'recent',
      completed: true,
      completed_at: new Date('2024-08-03T10:00:00Z').toISOString()
    })
    const archived = createTask({
      id: 'archived',
      completed: true,
      completed_at: new Date('2024-07-20T10:00:00Z').toISOString()
    })

    const { active, completed, archived: archivedList } = splitTasks(
      [activeTask, completedRecent, archived],
      today
    )

    expect(active.map((task) => task.id)).toEqual(['active'])
    expect(completed.map((task) => task.id)).toEqual(['recent'])
    expect(archivedList.map((task) => task.id)).toEqual(['archived'])
  })
})

describe('pickTaskForNotification', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('prefers tasks with fewer recent completions', () => {
    const today = new Date('2024-08-05T12:00:00Z')
    const lowHistory = createTask({ id: 'low', repeat: 'daily', recentCompletions: 0 })
    const highHistory = createTask({ id: 'high', repeat: 'daily', recentCompletions: 4 })

    const choice = pickTaskForNotification([lowHistory, highHistory], today)
    expect(choice?.id).toBe('low')
  })

  it('returns null when no candidates repeat today', () => {
    const task = createTask({ repeat: 'none' })
    expect(pickTaskForNotification([task], new Date())).toBeNull()
  })
})
