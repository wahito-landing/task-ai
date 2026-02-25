import { Task } from './supabase'

// ─── 定数 ──────────────────────────────────────────────────────
export const CATEGORIES = [
  'テクノロジー',
  'ビジネス',
  'ニュース',
  'エンタメ',
  'スポーツ',
  'ライフスタイル',
  'その他',
]

export const DAYS_OF_WEEK = ['日', '月', '火', '水', '木', '金', '土']

// ─── 30分刻みの時刻リスト ──────────────────────────────────────
export function generateTimeOptions(): string[] {
  const times: string[] = []
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      times.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    }
  }
  return times
}

// ─── cron式生成 ────────────────────────────────────────────────
export function generateCronExpressions(
  scheduleType: Task['schedule_type'],
  scheduleTimes: string[],
  scheduleDayOfWeek?: number,
  scheduleDayOfMonth?: number
): string[] {
  return scheduleTimes.map((time) => {
    const [hourStr, minuteStr] = time.split(':')
    const h = parseInt(hourStr, 10)
    const m = parseInt(minuteStr, 10)

    if (scheduleType === 'daily') {
      return `${m} ${h} * * *`
    } else if (scheduleType === 'weekly') {
      const dow = scheduleDayOfWeek ?? 1
      return `${m} ${h} * * ${dow}`
    } else {
      // monthly
      const dom = scheduleDayOfMonth ?? 1
      return `${m} ${h} ${dom} * *`
    }
  })
}

// ─── 表示用ラベル ──────────────────────────────────────────────
export function formatScheduleLabel(task: Task): string {
  const times = task.schedule_times.join(', ')

  if (task.schedule_type === 'daily') {
    return `毎日 ${times}`
  } else if (task.schedule_type === 'weekly') {
    const dayName = DAYS_OF_WEEK[task.schedule_day_of_week] ?? '月'
    return `毎週${dayName}曜 ${times}`
  } else {
    return `毎月${task.schedule_day_of_month}日 ${times}`
  }
}

// ─── 現在時刻に実行すべきか判定 ───────────────────────────────
export function shouldRunNow(task: Task): boolean {
  const now = new Date()
  const jstNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }))

  const currentHour = jstNow.getHours()
  const currentMinute = jstNow.getMinutes()
  const currentDow = jstNow.getDay()
  const currentDom = jstNow.getDate()

  // スケジュールタイプの確認
  if (task.schedule_type === 'weekly' && task.schedule_day_of_week !== currentDow) {
    return false
  }
  if (task.schedule_type === 'monthly' && task.schedule_day_of_month !== currentDom) {
    return false
  }

  // 時刻の確認（±1分の余裕を持つ）
  return task.schedule_times.some((time) => {
    const [h, m] = time.split(':').map(Number)
    const taskMinutes = h * 60 + m
    const nowMinutes = currentHour * 60 + currentMinute
    return Math.abs(taskMinutes - nowMinutes) <= 1
  })
}
