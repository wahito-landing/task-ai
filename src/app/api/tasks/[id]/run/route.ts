import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { executeTask } from '@/lib/executor'

type Params = { params: Promise<{ id: string }> }

// POST /api/tasks/[id]/run — 手動実行
export async function POST(_req: NextRequest, { params }: Params) {
  const { id } = await params

  const { data: task, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !task) {
    return NextResponse.json({ error: 'タスクが見つかりません' }, { status: 404 })
  }

  const result = await executeTask(task)
  return NextResponse.json(result)
}
