import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import TaskForm from '@/components/TaskForm'

type Props = {
  params: Promise<{ id: string }>
}

export default async function EditTaskPage({ params }: Props) {
  const { id } = await params
  const { data: task, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !task) notFound()

  return (
    <TaskForm
      taskId={id}
      initial={{
        title: task.title,
        prompt: task.prompt,
        category: task.category,
        tags: task.tags,
        schedule_type: task.schedule_type,
        schedule_times: task.schedule_times,
        schedule_day_of_week: task.schedule_day_of_week,
        schedule_day_of_month: task.schedule_day_of_month,
        is_active: task.is_active,
        line_notify: task.line_notify,
      }}
    />
  )
}
