-- =============================================
-- タスク自動化アプリ DBスキーマ
-- Supabase SQL Editorで実行してください
-- =============================================

-- タスクテーブル
create table tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  prompt text not null,
  category text not null default 'その他',
  tags text[] default '{}',
  schedule_type text not null check (schedule_type in ('daily', 'weekly', 'monthly')),
  schedule_times text[] not null default '{"07:00"}',  -- 例: ["07:00", "21:00"]
  schedule_day_of_week int check (schedule_day_of_week between 0 and 6),  -- weeklyのみ (0=日曜)
  schedule_day_of_month int check (schedule_day_of_month between 1 and 31),  -- monthlyのみ
  cron_expressions text[] not null default '{}',  -- 例: ["0 7 * * *", "0 21 * * *"]
  is_active boolean not null default true,
  line_notify boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 実行履歴テーブル
create table task_logs (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  result text,
  status text not null check (status in ('success', 'error')),
  error_message text,
  executed_at timestamptz not null default now()
);

-- updated_at 自動更新トリガー
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tasks_updated_at
  before update on tasks
  for each row execute function update_updated_at();

-- インデックス
create index idx_task_logs_task_id on task_logs(task_id);
create index idx_task_logs_executed_at on task_logs(executed_at desc);
create index idx_tasks_is_active on tasks(is_active);

-- サンプルデータ（動作確認用）
insert into tasks (title, prompt, category, tags, schedule_type, schedule_times, cron_expressions, line_notify)
values (
  'AIニュース朝まとめ',
  '今日のAI・機械学習に関する最新ニュースを日本語で3〜5項目に要約してください。各項目は2〜3文で簡潔にまとめてください。',
  'テクノロジー',
  array['AI', 'ニュース'],
  'daily',
  array['07:00'],
  array['0 7 * * *'],
  true
);
