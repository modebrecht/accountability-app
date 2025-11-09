import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables')
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false
  }
})

type Task = {
  id: string
  user_id: string
  title: string
  repeat: string | null
  completed_at: string | null
  priority: number | null
  created_at: string
}

type Payload = {
  user_id: string
}

serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const payload = (await req.json().catch(() => ({}))) as Partial<Payload>

    if (!payload.user_id) {
      return new Response(JSON.stringify({ error: 'Missing user_id in payload' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', payload.user_id)
      .neq('repeat', 'none')
      .not('repeat', 'is', null)

    if (error) {
      throw error
    }

    if (!tasks || tasks.length === 0) {
      return new Response(JSON.stringify({ task: null }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const today = new Date()
    const chosen = pickTaskForNotification(tasks as Task[], today)

    return new Response(JSON.stringify({ task: chosen }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (err) {
    console.error(err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})

const MS_PER_DAY = 1000 * 60 * 60 * 24

function daysBetween(start: string | Date, end: Date) {
  const startDate = typeof start === 'string' ? new Date(start) : start
  return Math.floor((end.getTime() - startDate.getTime()) / MS_PER_DAY)
}

function shouldShowToday(task: Task, today: Date) {
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

function pickTaskForNotification(tasks: Task[], today: Date) {
  const candidates = tasks.filter((task) => shouldShowToday(task, today))
  if (!candidates.length) return null

  const weighted = candidates.map((task) => {
    const recentCompletions = task.completed_at && daysBetween(task.completed_at, today) <= 30 ? 1 : 0
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
