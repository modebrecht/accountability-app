export type Task = {
  id: string
  user_id: string
  title: string
  completed: boolean
  completed_at: string | null
  created_at: string
  due_date: string | null
  repeat: string | null
  priority: number | null
}

export type TaskInput = {
  title: string
  due_date?: string | null
  repeat?: string | null
  priority?: number | null
}
