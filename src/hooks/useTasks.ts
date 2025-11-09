import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Task, TaskInput } from '../types/task'
import { supabase } from '../supabaseClient'
import { splitTasks } from '../lib/tasks'

export function useTasks(userId?: string) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTasks = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    const { data, error: queryError } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })

    if (queryError) {
      setError(queryError.message)
    } else {
      setTasks(data ?? [])
    }

    setLoading(false)
  }, [userId])

  useEffect(() => {
    if (!userId) {
      setTasks([])
      setLoading(false)
      return
    }
    fetchTasks()
  }, [userId, fetchTasks])

  const createTask = useCallback(
    async (payload: TaskInput) => {
      if (!userId) throw new Error('No authenticated user')
      const insertPayload = {
        user_id: userId,
        title: payload.title,
        repeat: payload.repeat ?? 'daily',
        due_date: payload.due_date ?? null,
        priority: payload.priority ?? 1
      }

      const { data, error: insertError } = await supabase
        .from('tasks')
        .insert(insertPayload)
        .select('*')
        .single()

      if (insertError) throw insertError

      setTasks((prev) => (data ? [data, ...prev] : prev))
      return data
    },
    [userId]
  )

  const toggleTaskCompletion = useCallback(async (task: Task) => {
    const updates = {
      completed: !task.completed,
      completed_at: !task.completed ? new Date().toISOString() : null
    }

    const { data, error: updateError } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', task.id)
      .select('*')
      .single()

    if (updateError) throw updateError

    setTasks((prev) => prev.map((current) => (current.id === task.id ? (data as Task) : current)))
    return data as Task
  }, [])

  const categorized = useMemo(() => splitTasks(tasks), [tasks])

  return {
    tasks,
    ...categorized,
    loading,
    error,
    refresh: fetchTasks,
    createTask,
    toggleTaskCompletion
  }
}
