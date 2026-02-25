'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Task, TaskLog } from '@/lib/supabase'
import { formatScheduleLabel, CATEGORIES } from '@/lib/schedule'

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [logs, setLogs] = useState<Record<string, TaskLog[]>>({})
  const [filter, setFilter] = useState<string>('all')
  const [running, setRunning] = useState<string | null>(null)
  const [preview, setPreview] = useState<{ title: string; result: string } | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchTasks = useCallback(async () => {
    const url = filter === 'all' ? '/api/tasks' : `/api/tasks?category=${filter}`
    const res = await fetch(url)
    const data = await res.json()
    setTasks(data)
    setLoading(false)
  }, [filter])

  const fetchRecentLogs = useCallback(async (taskIds: string[]) => {
    const entries = await Promise.all(
      taskIds.map(async (id) => {
        const res = await fetch(`/api/tasks/${id}/logs`)
        const data = await res.json()
        return [id, data.slice(0, 3)] as [string, TaskLog[]]
      })
    )
    setLogs(Object.fromEntries(entries))
  }, [])

  useEffect(() => { fetchTasks() }, [fetchTasks])
  useEffect(() => {
    if (tasks.length > 0) fetchRecentLogs(tasks.map((t) => t.id))
  }, [tasks, fetchRecentLogs])

  const toggleActive = async (task: Task) => {
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...task, is_active: !task.is_active }),
    })
    fetchTasks()
  }

  const runNow = async (task: Task) => {
    setRunning(task.id)
    const res = await fetch(`/api/tasks/${task.id}/run`, { method: 'POST' })
    const data = await res.json()
    setRunning(null)
    if (data.result) setPreview({ title: task.title, result: data.result })
    fetchRecentLogs([task.id])
  }

  const deleteTask = async (id: string) => {
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    setDeleteConfirm(null)
    fetchTasks()
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
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        background: 'rgba(10,10,15,0.9)',
        backdropFilter: 'blur(12px)',
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16,
          }}>⚡</div>
          <span style={{ fontWeight: 600, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>Tasks</span>
        </div>
        <Link href="/tasks/new" style={{
          background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
          color: '#fff',
          padding: '0.5rem 1.25rem',
          borderRadius: 8,
          textDecoration: 'none',
          fontWeight: 600,
          fontSize: '0.875rem',
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          transition: 'opacity 0.2s',
        }}>
          ＋ 新規タスク
        </Link>
      </header>

      <main style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { label: '総タスク', value: tasks.length, icon: '📋' },
            { label: '有効', value: tasks.filter((t) => t.is_active).length, icon: '✅' },
            { label: '停止中', value: tasks.filter((t) => !t.is_active).length, icon: '⏸' },
          ].map((stat) => (
            <div key={stat.label} style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '1.25rem',
              display: 'flex', alignItems: 'center', gap: '0.75rem',
            }}>
              <span style={{ fontSize: '1.5rem' }}>{stat.icon}</span>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, lineHeight: 1 }}>{stat.value}</div>
                <div style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: 2 }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {['all', ...CATEGORIES].map((cat) => (
            <button key={cat} onClick={() => setFilter(cat)} style={{
              padding: '0.375rem 0.875rem',
              borderRadius: 20,
              border: filter === cat ? '1px solid var(--accent)' : '1px solid var(--border)',
              background: filter === cat ? 'rgba(99,102,241,0.15)' : 'transparent',
              color: filter === cat ? 'var(--accent2)' : 'var(--muted)',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: filter === cat ? 600 : 400,
              transition: 'all 0.15s',
            }}>
              {cat === 'all' ? 'すべて' : cat}
            </button>
          ))}
        </div>

        {/* Task List */}
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '4rem' }}>読み込み中...</div>
        ) : tasks.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '5rem 2rem',
            border: '1px dashed var(--border)', borderRadius: 16,
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🤖</div>
            <div style={{ color: 'var(--muted)', marginBottom: '1.5rem' }}>まだタスクがありません</div>
            <Link href="/tasks/new" style={{
              color: 'var(--accent2)', textDecoration: 'none', fontWeight: 600,
            }}>最初のタスクを作成 →</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {tasks.map((task) => (
              <div key={task.id} className="animate-fade-in" style={{
                background: 'var(--surface)',
                border: `1px solid ${task.is_active ? 'var(--border)' : 'rgba(42,42,58,0.5)'}`,
                borderRadius: 12,
                padding: '1.25rem',
                opacity: task.is_active ? 1 : 0.6,
                transition: 'all 0.2s',
              }}>
                {/* タスクヘッダー */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{task.title}</span>
                      <span style={{
                        fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: 4,
                        background: 'rgba(99,102,241,0.15)', color: 'var(--accent2)', border: '1px solid rgba(99,102,241,0.2)',
                      }}>{task.category}</span>
                      {task.tags.map((tag) => (
                        <span key={tag} style={{
                          fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: 4,
                          background: 'var(--surface2)', color: 'var(--muted)', border: '1px solid var(--border)',
                        }}>#{tag}</span>
                      ))}
                    </div>
                    <div style={{ color: 'var(--muted)', fontSize: '0.8rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      <span>🕐 {formatScheduleLabel(task)}</span>
                      <span>{task.line_notify ? '📲 LINE通知ON' : '🔕 通知OFF'}</span>
                    </div>
                  </div>

                  {/* コントロール */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                    {/* 有効/無効トグル */}
                    <button onClick={() => toggleActive(task)} style={{
                      width: 44, height: 24, borderRadius: 12,
                      background: task.is_active ? 'var(--accent)' : 'var(--border)',
                      border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
                    }}>
                      <span style={{
                        position: 'absolute', top: 3,
                        left: task.is_active ? 'calc(100% - 21px)' : 3,
                        width: 18, height: 18, borderRadius: '50%',
                        background: '#fff', transition: 'left 0.2s',
                      }} />
                    </button>

                    {/* 今すぐ実行 */}
                    <button onClick={() => runNow(task)} disabled={running === task.id} style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: 6,
                      border: '1px solid var(--border)',
                      background: running === task.id ? 'var(--surface2)' : 'transparent',
                      color: running === task.id ? 'var(--muted)' : 'var(--text)',
                      cursor: running === task.id ? 'not-allowed' : 'pointer',
                      fontSize: '0.75rem', fontWeight: 500,
                    }}>
                      {running === task.id ? '実行中...' : '▶ 実行'}
                    </button>

                    {/* 編集 */}
                    <Link href={`/tasks/${task.id}/edit`} style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: 6,
                      border: '1px solid var(--border)',
                      color: 'var(--text)',
                      textDecoration: 'none',
                      fontSize: '0.75rem',
                    }}>編集</Link>

                    {/* 削除 */}
                    <button onClick={() => setDeleteConfirm(task.id)} style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: 6,
                      border: '1px solid rgba(244,63,94,0.3)',
                      background: 'transparent',
                      color: 'var(--danger)',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                    }}>削除</button>
                  </div>
                </div>

                {/* 最近のログ */}
                {logs[task.id]?.length > 0 && (
                  <div style={{ marginTop: '0.875rem', borderTop: '1px solid var(--border)', paddingTop: '0.875rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>最近の実行</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                      {logs[task.id].map((log) => (
                        <div key={log.id} style={{
                          display: 'flex', alignItems: 'center', gap: '0.5rem',
                          fontSize: '0.75rem',
                        }}>
                          <span style={{
                            width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                            background: log.status === 'success' ? 'var(--success)' : 'var(--danger)',
                          }} className={log.status === 'success' ? '' : 'pulse-dot'} />
                          <span style={{ color: 'var(--muted)' }}>
                            {new Date(log.executed_at).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}
                          </span>
                          {log.status === 'success' && log.result && (
                            <button onClick={() => setPreview({ title: task.title, result: log.result! })} style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              color: 'var(--accent2)', fontSize: '0.75rem', padding: 0,
                            }}>
                              結果を見る →
                            </button>
                          )}
                          {log.status === 'error' && (
                            <span style={{ color: 'var(--danger)' }}>エラー</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 結果プレビューモーダル */}
      {preview && (
        <div onClick={() => setPreview(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200, padding: '1rem',
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 16, padding: '1.5rem', maxWidth: 600, width: '100%',
            maxHeight: '80vh', display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span style={{ fontWeight: 600 }}>{preview.title}</span>
              <button onClick={() => setPreview(null)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--muted)', fontSize: '1.2rem',
              }}>✕</button>
            </div>
            <div style={{ overflowY: 'auto', color: 'var(--text)', lineHeight: 1.7, fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>
              {preview.result}
            </div>
          </div>
        </div>
      )}

      {/* 削除確認モーダル */}
      {deleteConfirm && (
        <div onClick={() => setDeleteConfirm(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200,
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 16, padding: '2rem', maxWidth: 400, width: '90%',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🗑</div>
            <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>タスクを削除しますか？</div>
            <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              実行履歴も含めて完全に削除されます。
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button onClick={() => setDeleteConfirm(null)} style={{
                padding: '0.6rem 1.5rem', borderRadius: 8,
                border: '1px solid var(--border)', background: 'transparent',
                color: 'var(--text)', cursor: 'pointer',
              }}>キャンセル</button>
              <button onClick={() => deleteTask(deleteConfirm)} style={{
                padding: '0.6rem 1.5rem', borderRadius: 8,
                border: 'none', background: 'var(--danger)',
                color: '#fff', cursor: 'pointer', fontWeight: 600,
              }}>削除する</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
