import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { generateCronExpressions } from '@/lib/schedule'

// GET /api/tasks — タスク一覧取得
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')

  let query = supabase.from('tasks').select('*').order('created_at', { ascending: false })
  if (category) query = query.eq('category', category)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

// POST /api/tasks — タスク作成
export async function POST(req: NextRequest) {
  const body = await req.json()
  const {
    title,
    prompt,
    category,
    tags,
    schedule_type,
    schedule_times,
    schedule_day_of_week,
    schedule_day_of_month,
    is_active,
    line_notify,
  } = body

  // cron式を生成
  const cron_expressions = generateCronExpressions(
    schedule_type,
    schedule_times,
    schedule_day_of_week,
    schedule_day_of_month
  )

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      title,
      prompt,
      category,
      tags,
      schedule_type,
      schedule_times,
      schedule_day_of_week,
      schedule_day_of_month,
      cron_expressions,
      is_active,
      line_notify,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data, { status: 201 })
}
