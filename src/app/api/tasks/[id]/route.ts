import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { generateCronExpressions } from '@/lib/schedule'

type Params = { params: Promise<{ id: string }> }

// GET /api/tasks/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const { data, error } = await supabase.from('tasks').select('*').eq('id', id).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

// PUT /api/tasks/[id]
export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params
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

  // cron式を再生成
  const cron_expressions = generateCronExpressions(
    schedule_type,
    schedule_times,
    schedule_day_of_week,
    schedule_day_of_month
  )

  const { data, error } = await supabase
    .from('tasks')
    .update({
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
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE /api/tasks/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
