import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Task } from '../types/task'
import { pickTaskForNotification } from '../lib/tasks'

const DEFAULT_INTERVAL_MS = 15 * 60 * 1000

type NotificationOptions = {
  intervalMs?: number
  randomize?: boolean
}

function pickRandomTask(tasks: Task[]) {
  if (!tasks.length) return null
  const index = Math.floor(Math.random() * tasks.length)
  return tasks[index]
}

export function useSmartNotifications(tasks: Task[], options: NotificationOptions = {}) {
  const intervalMs = options.intervalMs ?? DEFAULT_INTERVAL_MS
  const randomize = options.randomize ?? false
  const supportsNotifications = typeof window !== 'undefined' && 'Notification' in window
  const [permission, setPermission] = useState<NotificationPermission>(
    supportsNotifications ? Notification.permission : 'denied'
  )
  const [enabled, setEnabled] = useState(false)
  const tasksRef = useRef<Task[]>(tasks)
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    tasksRef.current = tasks
  }, [tasks])

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  useEffect(() => clearTimer, [clearTimer])

  const triggerNotification = useCallback(() => {
    if (!supportsNotifications || permission !== 'granted') return
    const task = randomize ? pickRandomTask(tasksRef.current) : pickTaskForNotification(tasksRef.current)
    if (!task) return

    const bodyParts = [
      task.title,
      task.repeat && task.repeat !== 'none' ? `Pattern: ${task.repeat}` : undefined
    ].filter(Boolean)

    new Notification(randomize ? 'Zufälliger Task' : 'Accountability reminder', {
      body: bodyParts.join('\n'),
      tag: task.id,
      renotify: false
    })
  }, [permission, supportsNotifications, randomize])

  useEffect(() => {
    if (!enabled || permission !== 'granted' || !supportsNotifications) {
      clearTimer()
      return
    }

    triggerNotification()
    const id = window.setInterval(triggerNotification, intervalMs)
    intervalRef.current = id

    return () => {
      window.clearInterval(id)
      intervalRef.current = null
    }
  }, [enabled, permission, supportsNotifications, intervalMs, triggerNotification, clearTimer])

  const enableNotifications = useCallback(async () => {
    if (!supportsNotifications) return
    if (permission !== 'granted') {
      const result = await Notification.requestPermission()
      setPermission(result)
      if (result !== 'granted') {
        setEnabled(false)
        return
      }
    }
    setEnabled(true)
  }, [permission, supportsNotifications])

  const disableNotifications = useCallback(() => {
    setEnabled(false)
    clearTimer()
  }, [clearTimer])

  const status = useMemo(() => {
    if (!supportsNotifications) return 'unsupported'
    if (permission === 'granted' && enabled) return 'active'
    if (permission === 'granted') return 'paused'
    return permission
  }, [supportsNotifications, permission, enabled])

  return {
    supported: supportsNotifications,
    permission,
    enabled,
    status,
    enableNotifications,
    disableNotifications
  }
}
