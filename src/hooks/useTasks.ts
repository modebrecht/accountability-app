import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Task, TaskInput } from '../types/task'
import { supabase } from '../supabaseClient'
import { splitTasks } from '../lib/tasks'

const MS_PER_DAY = 1000 * 60 * 60 * 24
const RECENT_WINDOW_DAYS = 30

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
      setLoading(false)
      return
    }

    const taskData = (data ?? []) as Task[]

    if (!taskData.length) {
      setTasks([])
      setLoading(false)
      return
    }

    const thirtyDaysAgo = new Date(Date.now() - RECENT_WINDOW_DAYS * MS_PER_DAY).toISOString()
    const { data: completionRows, error: completionsError } = await supabase
      .from('task_completions')
      .select('task_id, completed_at')
      .in(
        'task_id',
        taskData.map((task) => task.id)
      )
      .eq('user_id', userId)
      .gte('completed_at', thirtyDaysAgo)

    if (completionsError) {
      setError(completionsError.message)
    }

    const completionCounts = new Map<string, number>()
    completionRows?.forEach((row) => {
      const current = completionCounts.get(row.task_id) ?? 0
      completionCounts.set(row.task_id, current + 1)
    })

    const enrichedTasks = taskData.map((task) => ({
      ...task,
      recentCompletions: completionCounts.get(task.id) ?? 0
    }))

    setTasks(enrichedTasks)
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

    if (!task.completed) {
      const { error: insertError } = await supabase.from('task_completions').insert({
        task_id: task.id,
        user_id: task.user_id,
        completed_at: updates.completed_at
      })
      if (insertError) throw insertError
    } else {
      const { error: deleteError } = await supabase
        .from('task_completions')
        .delete()
        .eq('task_id', task.id)
        .order('completed_at', { ascending: false })
        .limit(1)
      if (deleteError) throw deleteError
    }

    const updatedTask: Task = {
      ...(data as Task),
      recentCompletions: !task.completed
        ? (task.recentCompletions ?? 0) + 1
        : Math.max(0, (task.recentCompletions ?? 0) - 1)
    }

    setTasks((prev) => prev.map((current) => (current.id === task.id ? updatedTask : current)))
    return updatedTask
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
