import type { Task } from '../types/task'

const MS_PER_DAY = 1000 * 60 * 60 * 24
const WEEKDAY_NAMES: Record<number, string> = {
  0: 'sun',
  1: 'mon',
  2: 'tue',
  3: 'wed',
  4: 'thu',
  5: 'fri',
  6: 'sat'
}

export function daysBetween(startDate: string | Date, endDate: Date) {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate
  const diff = endDate.getTime() - start.getTime()
  return Math.floor(diff / MS_PER_DAY)
}

export function shouldShowToday(task: Task, today = new Date()): boolean {
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
    const todayName = WEEKDAY_NAMES[today.getDay()]
    const daysList = repeat.replace('weekly_', '').split(',')
    return daysList.includes(todayName)
  }

  return false
}

export function isCompletedWithinDays(task: Task, days: number, today = new Date()) {
  if (!task.completed_at) return false
  const completedAt = new Date(task.completed_at)
  const diff = today.getTime() - completedAt.getTime()
  return diff <= days * MS_PER_DAY
}

export function isCompletedOlderThan(task: Task, days: number, today = new Date()) {
  if (!task.completed_at) return false
  const completedAt = new Date(task.completed_at)
  const diff = today.getTime() - completedAt.getTime()
  return diff > days * MS_PER_DAY
}

export function splitTasks(tasks: Task[], today = new Date()) {
  const active = tasks.filter((task) => !task.completed && shouldShowToday(task, today))
  const completed = tasks.filter((task) => task.completed && isCompletedWithinDays(task, 7, today))
  const archived = tasks.filter((task) => task.completed && isCompletedOlderThan(task, 7, today))

  return { active, completed, archived }
}

export function pickTaskForNotification(tasks: Task[], today = new Date()) {
  const candidates = tasks.filter((task) => shouldShowToday(task, today) && task.repeat && task.repeat !== 'none')
  if (!candidates.length) return null

  const weighted = candidates.map((task) => {
    const recentCompletions = task.recentCompletions ?? 0
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
