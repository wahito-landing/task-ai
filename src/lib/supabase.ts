import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ─── 型定義 ───────────────────────────────────────────────────
export type Task = {
  id: string
  title: string
  prompt: string
  category: string
  tags: string[]
  schedule_type: 'daily' | 'weekly' | 'monthly'
  schedule_times: string[]
  schedule_day_of_week: number
  schedule_day_of_month: number
  cron_expressions: string[]
  is_active: boolean
  line_notify: boolean
  created_at: string
  updated_at: string
}

export type TaskLog = {
  id: string
  task_id: string
  result: string | null
  status: 'success' | 'error'
  error_message: string | null
  executed_at: string
}
