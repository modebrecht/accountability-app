import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import {
  MS_PER_DAY,
  Task,
  pickTaskForNotification,
  shouldShowToday
} from './logic.ts'

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

    const thirtyDaysAgo = new Date(Date.now() - 30 * MS_PER_DAY).toISOString()
    const taskIds = (tasks as Task[]).map((task) => task.id)
    const { data: completions, error: completionsError } = await supabase
      .from('task_completions')
      .select('task_id, completed_at')
      .eq('user_id', payload.user_id)
      .in('task_id', taskIds)
      .gte('completed_at', thirtyDaysAgo)

    if (completionsError) {
      throw completionsError
    }

    const completionCounts = new Map<string, number>()
    completions?.forEach((row) => {
      const current = completionCounts.get(row.task_id) ?? 0
      completionCounts.set(row.task_id, current + 1)
    })

    const enrichedTasks = (tasks as Task[]).map((task) => ({
      ...task,
      recent_completions: completionCounts.get(task.id) ?? 0
    }))

    const today = new Date()
    const chosen = pickTaskForNotification(enrichedTasks, today)

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
