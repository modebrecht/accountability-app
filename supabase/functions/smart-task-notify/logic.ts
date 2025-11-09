export const MS_PER_DAY = 1000 * 60 * 60 * 24

export type Task = {
  id: string
  user_id: string
  title: string
  repeat: string | null
  completed_at: string | null
  priority: number | null
  created_at: string
  recent_completions?: number
}

export function daysBetween(start: string | Date, end: Date) {
  const startDate = typeof start === 'string' ? new Date(start) : start
  return Math.floor((end.getTime() - startDate.getTime()) / MS_PER_DAY)
}

export function shouldShowToday(task: Task, today: Date) {
  const repeat = task.repeat

  if (!repeat || repeat === 'none') return false
  if (repeat === 'daily') return true

  if (repeat.startsWith('every_')) {
    const days = parseInt(repeat.split('_')[1], 10)
    if (!Number.isNaN(days) && days > 0) {
      const daysSinceCreated = daysBetween(task.created_at, today)
      return daysSinceCreated % days === 0
    }
    return false
  }

  if (repeat.startsWith('weekly_')) {
    if (repeat.endsWith('x')) return true
    const todayName = today.toLocaleString('en-US', { weekday: 'short' }).toLowerCase().slice(0, 3)
    return repeat.includes(todayName)
  }

  return false
}

export function pickTaskForNotification(tasks: Task[], today: Date) {
  const candidates = tasks.filter((task) => shouldShowToday(task, today))
  if (!candidates.length) return null

  const weighted = candidates.map((task) => {
    const recentCompletions = task.recent_completions ?? 0
    const weight = (1 / (1 + recentCompletions)) * (task.priority ?? 1)
    return { task, weight }
  })

  const totalWeight = weighted.reduce((sum, entry) => sum + entry.weight, 0)
  const target = Math.random() * totalWeight
  let cumulative = 0

  for (const entry of weighted) {
    cumulative += entry.weight
    if (target <= cumulative) {
      return entry.task
    }
  }

  return weighted[weighted.length - 1]?.task ?? null
}
