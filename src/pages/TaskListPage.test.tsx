import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import TaskListPage from './TaskListPage'
import type { Task } from '../types/task'

const mockUseTasks = vi.fn()
const mockUseCompletionHistory = vi.fn()
const mockUseSmartNotifications = vi.fn()

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'user@example.com' },
    signOut: vi.fn()
  })
}))

vi.mock('../hooks/useTasks', () => ({
  useTasks: () => mockUseTasks()
}))

vi.mock('../hooks/useCompletionHistory', () => ({
  useCompletionHistory: () => mockUseCompletionHistory()
}))

vi.mock('../hooks/useSmartNotifications', () => ({
  useSmartNotifications: () => mockUseSmartNotifications()
}))

const sampleTask: Task = {
  id: 'task-1',
  user_id: 'user-1',
  title: 'Read',
  completed: false,
  completed_at: null,
  created_at: '2024-08-01T00:00:00Z',
  due_date: '2024-08-10',
  repeat: 'daily',
  priority: 1,
  recentCompletions: 0
}

describe('TaskListPage', () => {
  beforeEach(() => {
    mockUseTasks.mockReturnValue({
      active: [sampleTask],
      completed: [],
      archived: [],
      loading: false,
      error: null,
      createTask: vi.fn(),
      toggleTaskCompletion: vi.fn(),
      tasks: [sampleTask]
    })

    mockUseCompletionHistory.mockReturnValue({
      loading: false,
      error: null,
      entries: [],
      dailySeries: Array.from({ length: 14 }, (_, index) => ({
        date: `2024-08-${String(index + 1).padStart(2, '0')}`,
        count: 0
      })),
      last7Count: 0,
      last30Count: 0,
      streak: { current: 0, best: 0 }
    })

    mockUseSmartNotifications.mockReturnValue({
      supported: true,
      status: 'paused',
      permission: 'default',
      enableNotifications: vi.fn(),
      disableNotifications: vi.fn()
    })
  })

  it('renders tabs, task cards, and completion insights', () => {
    render(<TaskListPage />)
    expect(screen.getByText(/active tasks/i)).toBeInTheDocument()
    expect(screen.getByText(/completion insights/i)).toBeInTheDocument()
    expect(screen.getByText(/read/i)).toBeInTheDocument()
  })

  it('switches tabs when buttons are clicked', () => {
    mockUseTasks.mockReturnValueOnce({
      active: [],
      completed: [sampleTask],
      archived: [],
      loading: false,
      error: null,
      createTask: vi.fn(),
      toggleTaskCompletion: vi.fn(),
      tasks: [sampleTask]
    })

    render(<TaskListPage />)
    fireEvent.click(screen.getByRole('button', { name: /completed/i }))
    expect(screen.getByText(/read/i)).toBeInTheDocument()
  })

  it('toggles notification controls based on hook state', () => {
    const enable = vi.fn()
    mockUseSmartNotifications.mockReturnValue({
      supported: true,
      status: 'paused',
      permission: 'default',
      enableNotifications: enable,
      disableNotifications: vi.fn()
    })

    render(<TaskListPage />)
    fireEvent.click(screen.getByRole('button', { name: /enable notifications/i }))
    expect(enable).toHaveBeenCalledTimes(1)
  })
})
