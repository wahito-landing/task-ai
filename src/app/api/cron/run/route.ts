import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { executeTask } from '@/lib/executor'
import { shouldRunNow } from '@/lib/schedule'

// GET /api/cron/run — Vercel Cron（30分ごと）
export async function GET(req: NextRequest) {
  // Cronシークレット検証（任意）
  const secret = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret')
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // アクティブなタスクを全件取得
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('is_active', true)

  if (error) {
    console.error('Cron: failed to fetch tasks:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 現在時刻に実行すべきタスクをフィルタリングして実行
  const targets = (tasks ?? []).filter(shouldRunNow)

  console.log(`Cron: ${targets.length} tasks to run (total active: ${tasks?.length})`)

  const results = await Promise.allSettled(
    targets.map((task) => executeTask(task))
  )

  const summary = results.map((r, i) => ({
    taskId: targets[i].id,
    taskTitle: targets[i].title,
    status: r.status,
    result: r.status === 'fulfilled' ? r.value : r.reason?.message,
  }))

  return NextResponse.json({ ran: targets.length, summary })
}
