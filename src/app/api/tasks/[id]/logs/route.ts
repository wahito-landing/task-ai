import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

type Params = { params: Promise<{ id: string }> }

// GET /api/tasks/[id]/logs — 実行履歴取得
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params

  const { data, error } = await supabase
    .from('task_logs')
    .select('*')
    .eq('task_id', id)
    .order('executed_at', { ascending: false })
    .limit(20)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
