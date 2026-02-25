import { GoogleGenerativeAI } from '@google/generative-ai'
import axios from 'axios'
import { supabase, Task } from './supabase'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// ─── Tavily Web検索 ───────────────────────────────────────────
async function searchWeb(query: string): Promise<string> {
  try {
    const res = await axios.post(
      'https://api.tavily.com/search',
      {
        api_key: process.env.TAVILY_API_KEY,
        query,
        search_depth: 'basic',
        max_results: 5,
        include_answer: true,
      },
      { timeout: 15000 }
    )

    const answer = res.data.answer ?? ''
    const results = (res.data.results ?? [])
      .map((r: { title: string; content: string; url: string }) =>
        `【${r.title}】\n${r.content}\n出典: ${r.url}`
      )
      .join('\n\n')

    return answer ? `${answer}\n\n${results}` : results
  } catch (err) {
    console.error('Tavily search error:', err)
    return ''
  }
}

// ─── Gemini API 実行 ──────────────────────────────────────────
async function runGemini(prompt: string, webContext: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

  const fullPrompt = `あなたは情報収集・要約の専門アシスタントです。
提供されたWeb検索結果を参考に、ユーザーの指示に従って日本語で回答してください。
回答は読みやすく、簡潔にまとめてください。

【ユーザーの指示】
${prompt}

${webContext ? `---\n【参考情報（Web検索結果）】\n${webContext}` : ''}`

  const result = await model.generateContent(fullPrompt)
  const response = result.response
  return response.text()
}

// ─── LINE通知 ─────────────────────────────────────────────────
async function sendLine(taskTitle: string, result: string): Promise<void> {
  const message = `📋 【${taskTitle}】\n\n${result}\n\n─────────────\n実行時刻: ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}`

  await axios.post(
    'https://api.line.me/v2/bot/message/push',
    {
      to: process.env.LINE_USER_ID,
      messages: [{ type: 'text', text: message }],
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      timeout: 10000,
    }
  )
}

// ─── タスク実行メイン ─────────────────────────────────────────
export async function executeTask(task: Task): Promise<{ success: boolean; result?: string; error?: string }> {
  try {
    // 1. Web検索
    const webContext = await searchWeb(task.prompt)

    // 2. Gemini で要約
    const result = await runGemini(task.prompt, webContext)

    // 3. 実行ログを保存
    await supabase.from('task_logs').insert({
      task_id: task.id,
      result,
      status: 'success',
    })

    // 4. LINE通知
    if (task.line_notify) {
      await sendLine(task.title, result).catch((e) =>
        console.error('LINE notify error:', e)
      )
    }

    return { success: true, result }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    console.error(`Task execution error [${task.title}]:`, err)

    // エラーログを保存
    await supabase.from('task_logs').insert({
      task_id: task.id,
      status: 'error',
      error_message: errorMessage,
    })

    // エラーもLINEに通知
    if (task.line_notify) {
      await sendLine(task.title, `⚠️ エラーが発生しました\n${errorMessage}`).catch(() => {})
    }

    return { success: false, error: errorMessage }
  }
}
