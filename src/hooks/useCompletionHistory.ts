import { useCallback, useEffect, useMemo, useState } from 'react'
import type { TaskCompletion } from '../types/task'
import { supabase } from '../supabaseClient'

const MS_PER_DAY = 1000 * 60 * 60 * 24
const HISTORY_WINDOW_DAYS = 60
const CHART_WINDOW_DAYS = 14

type DailyCount = {
  date: string
  count: number
}

function toDayKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

function differenceInDays(a: string, b: string) {
  const dateA = new Date(`${a}T00:00:00Z`)
  const dateB = new Date(`${b}T00:00:00Z`)
  return Math.round((dateA.getTime() - dateB.getTime()) / MS_PER_DAY)
}

function computeCurrentStreak(daySet: Set<string>) {
  let streak = 0
  const cursor = new Date()
  let currentDay = toDayKey(cursor)

  while (daySet.has(currentDay)) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
    currentDay = toDayKey(cursor)
  }

  return streak
}

function computeBestStreak(daySet: Set<string>) {
  if (!daySet.size) return 0
  const sortedDays = Array.from(daySet).sort()
  let best = 1
  let current = 1

  for (let i = 1; i < sortedDays.length; i += 1) {
    const prev = sortedDays[i - 1]
    const curr = sortedDays[i]
    if (differenceInDays(curr, prev) === 1) {
      current += 1
    } else {
      current = 1
    }
    best = Math.max(best, current)
  }

  return best
}

export function useCompletionHistory(userId?: string) {
  const [entries, setEntries] = useState<TaskCompletion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHistory = useCallback(async () => {
    if (!userId) {
      setEntries([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    const since = new Date(Date.now() - HISTORY_WINDOW_DAYS * MS_PER_DAY).toISOString()

    const { data, error: queryError } = await supabase
      .from('task_completions')
      .select('id, task_id, user_id, completed_at, tasks(title)')
      .eq('user_id', userId)
      .gte('completed_at', since)
      .order('completed_at', { ascending: false })

    if (queryError) {
      setError(queryError.message)
      setLoading(false)
      return
    }

    setEntries((data as TaskCompletion[]) ?? [])
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  const derived = useMemo(() => {
    if (!entries.length) {
      const emptySeries: DailyCount[] = Array.from({ length: CHART_WINDOW_DAYS }, (_, index) => {
        const date = new Date()
        date.setDate(date.getDate() - (CHART_WINDOW_DAYS - index - 1))
        return { date: toDayKey(date), count: 0 }
      })

      return {
        last7Count: 0,
        last30Count: 0,
        streak: { current: 0, best: 0 },
        dailySeries: emptySeries
      }
    }

    const now = Date.now()
    const dayCounts = new Map<string, number>()

    entries.forEach((entry) => {
      const dayKey = toDayKey(new Date(entry.completed_at))
      const current = dayCounts.get(dayKey) ?? 0
      dayCounts.set(dayKey, current + 1)
    })

    const last7Threshold = now - 7 * MS_PER_DAY
    const last30Threshold = now - 30 * MS_PER_DAY

    const last7Count = entries.filter(
      (entry) => new Date(entry.completed_at).getTime() >= last7Threshold
    ).length
    const last30Count = entries.filter(
      (entry) => new Date(entry.completed_at).getTime() >= last30Threshold
    ).length

    const daySet = new Set(
      Array.from(dayCounts.entries())
        .filter(([, count]) => count > 0)
        .map(([day]) => day)
    )

    const dailySeries: DailyCount[] = Array.from({ length: CHART_WINDOW_DAYS }, (_, index) => {
      const date = new Date()
      date.setDate(date.getDate() - (CHART_WINDOW_DAYS - index - 1))
      const key = toDayKey(date)
      return { date: key, count: dayCounts.get(key) ?? 0 }
    })

    return {
      last7Count,
      last30Count,
      streak: {
        current: computeCurrentStreak(daySet),
        best: computeBestStreak(daySet)
      },
      dailySeries
    }
  }, [entries])

  return {
    entries,
    loading,
    error,
    refresh: fetchHistory,
    ...derived
  }
}
