import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AddTaskForm } from './AddTaskForm'

describe('AddTaskForm', () => {
  it('submits task data with repeat/due date/priority', async () => {
    const handleSubmit = vi.fn().mockResolvedValue(undefined)
    const handleCancel = vi.fn()

    render(<AddTaskForm onSubmit={handleSubmit} onCancel={handleCancel} />)

    fireEvent.change(screen.getByLabelText(/task title/i), { target: { value: 'Daily walk' } })
    fireEvent.change(screen.getByLabelText(/repeat pattern/i), { target: { value: 'weekly_mon,wed,fri' } })
    fireEvent.change(screen.getByLabelText(/due date/i), { target: { value: '2024-08-10' } })
    fireEvent.change(screen.getByLabelText(/priority \(affects notifications\)/i), { target: { value: '1.5' } })

    fireEvent.click(screen.getByRole('button', { name: /save task/i }))

    await waitFor(() =>
      expect(handleSubmit).toHaveBeenCalledWith({
        title: 'Daily walk',
        repeat: 'weekly_mon,wed,fri',
        due_date: '2024-08-10',
        priority: 1.5
      })
    )
  })

  it('allows custom repeat override when text input is used', async () => {
    const handleSubmit = vi.fn().mockResolvedValue(undefined)
    const handleCancel = vi.fn()

    render(<AddTaskForm onSubmit={handleSubmit} onCancel={handleCancel} />)

    fireEvent.change(screen.getByLabelText(/task title/i), { target: { value: 'Yoga' } })
    fireEvent.change(screen.getByPlaceholderText(/enter custom pattern/i), {
      target: { value: 'weekly_tue,thu' }
    })

    fireEvent.click(screen.getByRole('button', { name: /save task/i }))

    await waitFor(() =>
      expect(handleSubmit).toHaveBeenCalledWith({
        title: 'Yoga',
        repeat: 'weekly_tue,thu',
        due_date: null,
        priority: 1
      })
    )
  })
})
