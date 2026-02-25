'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Task } from '@/lib/supabase'
import { CATEGORIES, DAYS_OF_WEEK, generateTimeOptions } from '@/lib/schedule'

type FormData = Omit<Task, 'id' | 'cron_expressions' | 'created_at' | 'updated_at'>

const defaultForm: FormData = {
  title: '',
  prompt: '',
  category: 'その他',
  tags: [],
  schedule_type: 'daily',
  schedule_times: ['07:00'],
  schedule_day_of_week: 1,
  schedule_day_of_month: 1,
  is_active: true,
  line_notify: true,
}

type Props = {
  initial?: Partial<FormData>
  taskId?: string
}

const TIME_OPTIONS = generateTimeOptions()

export default function TaskForm({ initial, taskId }: Props) {
  const router = useRouter()
  const [form, setForm] = useState<FormData>({ ...defaultForm, ...initial })
  const [tagInput, setTagInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const isEdit = !!taskId

  const set = (key: keyof FormData, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const addTime = () => {
    if (form.schedule_times.length >= 6) return
    set('schedule_times', [...form.schedule_times, '07:00'])
  }
  const removeTime = (i: number) =>
    set('schedule_times', form.schedule_times.filter((_, idx) => idx !== i))
  const updateTime = (i: number, val: string) =>
    set('schedule_times', form.schedule_times.map((t, idx) => (idx === i ? val : t)))

  const addTag = () => {
    const tag = tagInput.trim()
    if (!tag || form.tags.includes(tag)) return
    set('tags', [...form.tags, tag])
    setTagInput('')
  }
  const removeTag = (tag: string) =>
    set('tags', form.tags.filter((t) => t !== tag))

  const submit = async () => {
    if (!form.title.trim()) { setError('タスク名を入力してください'); return }
    if (!form.prompt.trim()) { setError('実行内容を入力してください'); return }
    setSaving(true)
    setError('')

    const url = isEdit ? `/api/tasks/${taskId}` : '/api/tasks'
    const method = isEdit ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? '保存に失敗しました')
      setSaving(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  const inputStyle = {
    width: '100%',
    background: 'var(--surface2)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '0.625rem 0.875rem',
    color: 'var(--text)',
    fontSize: '0.875rem',
    outline: 'none',
  }
  const labelStyle = {
    display: 'block',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--muted)',
    marginBottom: '0.4rem',
    letterSpacing: '0.04em',
    textTransform: 'uppercase' as const,
  }
  const sectionStyle = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: '1.25rem',
    marginBottom: '1rem',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <header style={{
        borderBottom: '1px solid var(--border)',
        padding: '0 2rem',
        height: 64,
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        position: 'sticky', top: 0,
        background: 'rgba(10,10,15,0.9)',
        backdropFilter: 'blur(12px)',
        zIndex: 100,
      }}>
        <button onClick={() => router.back()} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--muted)', fontSize: '1.2rem',
        }}>←</button>
        <span style={{ fontWeight: 600 }}>{isEdit ? 'タスクを編集' : '新規タスク'}</span>
      </header>

      <main style={{ maxWidth: 640, margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* 基本情報 */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--accent2)' }}>基本情報</h2>
          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>タスク名</label>
            <input value={form.title} onChange={(e) => set('title', e.target.value)}
              placeholder="例：AIニュース朝まとめ" style={inputStyle} />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>実行内容</label>
            <textarea value={form.prompt} onChange={(e) => set('prompt', e.target.value)}
              placeholder="例：今日のAI・テクノロジー関連ニュースを日本語で3〜5項目に要約してください。"
              rows={4} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
            <div>
              <label style={labelStyle}>カテゴリ</label>
              <select value={form.category} onChange={(e) => set('category', e.target.value)} style={inputStyle}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>タグ</label>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTag()}
                  placeholder="タグを追加" style={{ ...inputStyle, flex: 1 }} />
                <button onClick={addTag} style={{
                  padding: '0 0.75rem', borderRadius: 8,
                  border: '1px solid var(--border)', background: 'var(--surface2)',
                  color: 'var(--text)', cursor: 'pointer', fontSize: '1rem',
                }}>＋</button>
              </div>
              {form.tags.length > 0 && (
                <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                  {form.tags.map((tag) => (
                    <span key={tag} style={{
                      display: 'flex', alignItems: 'center', gap: '0.25rem',
                      padding: '0.2rem 0.5rem', borderRadius: 4,
                      background: 'var(--surface2)', border: '1px solid var(--border)',
                      fontSize: '0.75rem', color: 'var(--muted)',
                    }}>
                      #{tag}
                      <button onClick={() => removeTag(tag)} style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--muted)', padding: 0, lineHeight: 1,
                      }}>✕</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* スケジュール */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--accent2)' }}>スケジュール</h2>

          {/* 頻度 */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>頻度</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {(['daily', 'weekly', 'monthly'] as const).map((type) => (
                <button key={type} onClick={() => set('schedule_type', type)} style={{
                  flex: 1, padding: '0.5rem',
                  borderRadius: 8,
                  border: `1px solid ${form.schedule_type === type ? 'var(--accent)' : 'var(--border)'}`,
                  background: form.schedule_type === type ? 'rgba(99,102,241,0.15)' : 'transparent',
                  color: form.schedule_type === type ? 'var(--accent2)' : 'var(--muted)',
                  cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                }}>
                  {type === 'daily' ? '毎日' : type === 'weekly' ? '毎週' : '毎月'}
                </button>
              ))}
            </div>
          </div>

          {/* 曜日（weekly） */}
          {form.schedule_type === 'weekly' && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>曜日</label>
              <div style={{ display: 'flex', gap: '0.375rem' }}>
                {DAYS_OF_WEEK.map((day, i) => (
                  <button key={i} onClick={() => set('schedule_day_of_week', i)} style={{
                    flex: 1, padding: '0.4rem 0',
                    borderRadius: 6,
                    border: `1px solid ${form.schedule_day_of_week === i ? 'var(--accent)' : 'var(--border)'}`,
                    background: form.schedule_day_of_week === i ? 'rgba(99,102,241,0.15)' : 'transparent',
                    color: form.schedule_day_of_week === i ? 'var(--accent2)' : 'var(--muted)',
                    cursor: 'pointer', fontSize: '0.8rem',
                  }}>{day}</button>
                ))}
              </div>
            </div>
          )}

          {/* 日（monthly） */}
          {form.schedule_type === 'monthly' && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>日</label>
              <select value={form.schedule_day_of_month ?? 1}
                onChange={(e) => set('schedule_day_of_month', Number(e.target.value))}
                style={inputStyle}>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>{d}日</option>
                ))}
              </select>
            </div>
          )}

          {/* 実行時刻 */}
          <div>
            <label style={labelStyle}>実行時刻</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {form.schedule_times.map((time, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <select value={time} onChange={(e) => updateTime(i, e.target.value)}
                    style={{ ...inputStyle, flex: 1 }}>
                    {TIME_OPTIONS.map((t) => <option key={t}>{t}</option>)}
                  </select>
                  {form.schedule_times.length > 1 && (
                    <button onClick={() => removeTime(i)} style={{
                      background: 'none', border: '1px solid var(--border)',
                      borderRadius: 6, cursor: 'pointer',
                      color: 'var(--muted)', padding: '0.4rem 0.6rem',
                    }}>✕</button>
                  )}
                </div>
              ))}
              {form.schedule_times.length < 6 && (
                <button onClick={addTime} style={{
                  padding: '0.5rem',
                  border: '1px dashed var(--border)',
                  borderRadius: 8, background: 'transparent',
                  color: 'var(--muted)', cursor: 'pointer',
                  fontSize: '0.8rem',
                }}>＋ 時刻を追加</button>
              )}
            </div>
          </div>
        </div>

        {/* 通知設定 */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--accent2)' }}>通知設定</h2>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
            <button onClick={() => set('line_notify', !form.line_notify)} style={{
              width: 44, height: 24, borderRadius: 12,
              background: form.line_notify ? 'var(--accent)' : 'var(--border)',
              border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
            }}>
              <span style={{
                position: 'absolute', top: 3,
                left: form.line_notify ? 'calc(100% - 21px)' : 3,
                width: 18, height: 18, borderRadius: '50%',
                background: '#fff', transition: 'left 0.2s',
              }} />
            </button>
            <span style={{ fontSize: '0.875rem' }}>LINE通知を受け取る</span>
          </label>
        </div>

        {/* エラー */}
        {error && (
          <div style={{
            padding: '0.75rem 1rem', borderRadius: 8,
            background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)',
            color: 'var(--danger)', fontSize: '0.875rem', marginBottom: '1rem',
          }}>{error}</div>
        )}

        {/* 保存ボタン */}
        <button onClick={submit} disabled={saving} style={{
          width: '100%', padding: '0.875rem',
          borderRadius: 10, border: 'none',
          background: saving
            ? 'var(--surface2)'
            : 'linear-gradient(135deg, var(--accent), var(--accent2))',
          color: saving ? 'var(--muted)' : '#fff',
          fontWeight: 700, fontSize: '0.95rem',
          cursor: saving ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
        }}>
          {saving ? '保存中...' : isEdit ? '変更を保存' : 'タスクを作成'}
        </button>
      </main>
    </div>
  )
}
