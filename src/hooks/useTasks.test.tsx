import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, expect, it, beforeEach, vi } from 'vitest'
import type { Task } from '../types/task'
import { useTasks } from './useTasks'

const mockFrom = vi.fn()

vi.mock('../supabaseClient', () => ({
  supabase: {
    from: mockFrom
  }
}))

const baseTaskRecord = {
  id: 'task-1',
  user_id: 'user-1',
  title: 'Demo',
  completed: false,
  completed_at: null,
  created_at: '2024-08-01T00:00:00Z',
  due_date: null,
  repeat: 'daily',
  priority: 1
}

function createTasksFetchBuilder(data: unknown, error: Error | null = null) {
  return {
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data, error })
  }
}

function createCompletionsFetchBuilder(data: unknown, error: Error | null = null) {
  return {
    select: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockResolvedValue({ data, error })
  }
}

function createUpdateBuilder(data: unknown, error: Error | null = null) {
  return {
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error })
  }
}

function createInsertBuilder(error: Error | null = null) {
  return {
    insert: vi.fn().mockResolvedValue({ error })
  }
}

function createDeleteBuilder(error: Error | null = null) {
  return {
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ error })
  }
}

describe('useTasks', () => {
  beforeEach(() => {
    mockFrom.mockReset()
  })

  it('loads tasks and enriches recent completion counts', async () => {
    const tasksBuilder = createTasksFetchBuilder([baseTaskRecord])
    const completionsBuilder = createCompletionsFetchBuilder([
      { task_id: 'task-1', completed_at: '2024-08-04T12:00:00Z' },
      { task_id: 'task-1', completed_at: '2024-08-05T12:00:00Z' }
    ])

    mockFrom.mockImplementationOnce(() => tasksBuilder).mockImplementationOnce(() => completionsBuilder)

    const { result } = renderHook(() => useTasks('user-1'))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBeNull()
    expect(result.current.tasks).toHaveLength(1)
    expect(result.current.tasks[0].recentCompletions).toBe(2)
  })

  it('surfaces query errors when the initial fetch fails', async () => {
    const error = { message: 'Unable to fetch tasks' } as Error
    const tasksBuilder = createTasksFetchBuilder(null, error)

    mockFrom.mockImplementationOnce(() => tasksBuilder)

    const { result } = renderHook(() => useTasks('user-1'))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('Unable to fetch tasks')
    expect(result.current.tasks).toHaveLength(0)
  })

  it('updates completion state and logs inserts/deletes when toggling tasks', async () => {
    const tasksBuilder = createTasksFetchBuilder([baseTaskRecord])
    const completionsBuilder = createCompletionsFetchBuilder([{ task_id: 'task-1', completed_at: '2024-08-01T00:00:00Z' }])

    const updateCompleteBuilder = createUpdateBuilder({
      ...baseTaskRecord,
      completed: true,
      completed_at: '2024-08-06T10:00:00Z'
    })

    const insertCompletionBuilder = createInsertBuilder()

    const updateIncompleteBuilder = createUpdateBuilder({
      ...baseTaskRecord,
      completed: false,
      completed_at: null
    })

    const deleteCompletionBuilder = createDeleteBuilder()

    mockFrom
      .mockImplementationOnce(() => tasksBuilder) // initial tasks fetch
      .mockImplementationOnce(() => completionsBuilder) // initial completion fetch
      .mockImplementationOnce(() => updateCompleteBuilder) // toggle to complete
      .mockImplementationOnce(() => insertCompletionBuilder) // log completion
      .mockImplementationOnce(() => updateIncompleteBuilder) // toggle back to incomplete
      .mockImplementationOnce(() => deleteCompletionBuilder) // remove latest completion log

    const { result } = renderHook(() => useTasks('user-1'))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.tasks[0].recentCompletions).toBe(1)

    await act(async () => {
      await result.current.toggleTaskCompletion(result.current.tasks[0])
    })

    expect(updateCompleteBuilder.update).toHaveBeenCalledTimes(1)
    expect(insertCompletionBuilder.insert).toHaveBeenCalledTimes(1)
    expect(result.current.tasks[0].completed).toBe(true)
    expect(result.current.tasks[0].recentCompletions).toBe(2)

    await act(async () => {
      await result.current.toggleTaskCompletion(result.current.tasks[0])
    })

    expect(updateIncompleteBuilder.update).toHaveBeenCalledTimes(1)
    expect(deleteCompletionBuilder.delete).toHaveBeenCalledTimes(1)
    expect(result.current.tasks[0].completed).toBe(false)
    expect(result.current.tasks[0].recentCompletions).toBe(1)
  })
})
