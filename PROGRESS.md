# task-ai 開発進捗メモ

更新日: 2026-02-25

---

## ✅ 完了した作業

### 1. プロジェクト作成
- Next.js 14 (App Router) + TypeScript でプロジェクト新規作成
- 作成場所: `/Users/wasakihitoshi/Documents/task-ai`

### 2. 実装ファイル
| ファイル | 内容 |
|---------|------|
| `src/lib/supabase.ts` | Supabaseクライアント・型定義 |
| `src/lib/schedule.ts` | スケジュール計算・cron式生成 |
| `src/lib/executor.ts` | Tavily検索 → Gemini要約 → LINE通知 |
| `src/app/globals.css` | ダークテーマCSS変数 |
| `src/app/layout.tsx` | HTML基本構造 |
| `src/app/page.tsx` | ダッシュボード |
| `src/components/TaskForm.tsx` | タスク作成・編集フォーム |
| `src/app/tasks/new/page.tsx` | タスク作成ページ |
| `src/app/tasks/[id]/edit/page.tsx` | タスク編集ページ |
| `src/app/api/tasks/route.ts` | GET一覧 / POST作成 |
| `src/app/api/tasks/[id]/route.ts` | GET / PUT / DELETE |
| `src/app/api/tasks/[id]/run/route.ts` | 手動実行 |
| `src/app/api/tasks/[id]/logs/route.ts` | 実行履歴 |
| `src/app/api/cron/run/route.ts` | Vercel Cron（30分ごと） |
| `vercel.json` | Cron設定 |
| `supabase/schema.sql` | DBスキーマ |

### 3. Supabase セットアップ
- プロジェクト: `https://ilynjteggnkuteqrxcpp.supabase.co`
- SQL Editorで `schema.sql` を実行済み
- `tasks` テーブル・`task_logs` テーブル作成済み

### 4. APIキー設定（`.env.local`）
| キー | 状態 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ 設定済み |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ 設定済み |
| `ANTHROPIC_API_KEY` | ✅ 設定済み（未使用） |
| `GEMINI_API_KEY` | ✅ 設定済み |
| `TAVILY_API_KEY` | ✅ 設定済み |
| `LINE_CHANNEL_ACCESS_TOKEN` | ✅ 設定済み |
| `LINE_USER_ID` | ✅ 設定済み |

### 5. GitHub に保存
- リポジトリ: https://github.com/wahito-landing/task-ai
- `.env.local` はGitignoreで除外済み（APIキーは含まれない）

---

## ⚠️ 残タスク

### 優先度：高

#### Gemini APIのクォータ問題を解決する
- **現象**: 429 Too Many Requests（無料枠クォータが0）
- **原因**: Googleアカウントの設定で無料枠が使えない状態
- **解決策（どれか1つ）**:
  1. Google AI Studioで**別のGoogleアカウント**からAPIキーを取得し直す
     - 👉 https://aistudio.google.com/app/apikey
  2. Groqに切り替える（完全無料・高速）
     - 👉 https://console.groq.com
     - モデル: `llama-3.3-70b-versatile`
  3. Anthropicに$5チャージして使う
     - 👉 https://console.anthropic.com/billing

### 優先度：中

#### Vercel にデプロイして本番運用開始
1. Vercelアカウント作成: https://vercel.com
2. GitHubリポジトリ（task-ai）を連携
3. Environment Variables に `.env.local` と同じ内容を設定
4. デプロイ → Vercel Cron が自動で動き始める

#### LINE通知の動作確認
- LINE Messaging APIのチャネルに自分のアカウントを友だち追加済みか確認
- 手動実行ボタンで通知が届くかテスト

---

## 開発サーバーの起動方法

```bash
cd /Users/wasakihitoshi/Documents/task-ai && npm run dev
```

→ http://localhost:3000 で確認

---

## 技術スタック

| 項目 | 内容 |
|------|------|
| フレームワーク | Next.js 14 (App Router) |
| 言語 | TypeScript |
| DB | Supabase (PostgreSQL) |
| AI | Gemini API (gemini-2.0-flash) |
| 検索 | Tavily API |
| 通知 | LINE Messaging API |
| ホスティング | Vercel（予定） |
| Cron | Vercel Cron（30分ごと） |
