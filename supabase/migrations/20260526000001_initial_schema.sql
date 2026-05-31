-- ひとり経理 初期スキーマ
-- 出典: 要件 第5章(データモデル) / 第7章 7.4(セキュリティ・RLS)
--
-- 要点:
-- * すべてのユーザーデータは Supabase Auth の auth.uid() と紐付ける
-- * 行レベルセキュリティ(RLS)を ENABLE し、user_id = auth.uid() の行だけ操作可
-- * 金額は整数(円)・日付は date 型・メモは jsonb で保持

-- ============================================================
-- 1. subscriptions
--   現在のプランと課金状態(FR-20〜22, 5.3.2)
-- ============================================================
create table if not exists public.subscriptions (
  user_id              uuid primary key references auth.users(id) on delete cascade,
  plan                 text not null default 'free' check (plan in ('free', 'light', 'pro')),
  billing_cycle        text check (billing_cycle in ('monthly', 'yearly')),
  status               text not null default 'active' check (status in ('active', 'expired', 'in_grace')),
  current_period_end   timestamptz,
  store                text check (store in ('app_store', 'play_store')),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

-- 本人だけが自分の subscription を読み書きできる
create policy "subscriptions are owned by user"
  on public.subscriptions
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============================================================
-- 2. receipts
--   レシート1件(中核エンティティ, 5.3.3)
-- ============================================================
create table if not exists public.receipts (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  date            date not null,
  amount_yen      integer not null check (amount_yen >= 0),
  store           text not null,
  category        text not null,
  memo            jsonb not null default '{}'::jsonb,
  image_status    text not null default 'deleted' check (image_status in ('stored', 'deleted')),
  image_path      text,
  captured_plan   text not null check (captured_plan in ('free', 'light', 'pro')),
  ocr_raw         jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_receipts_user_date
  on public.receipts (user_id, date desc);

alter table public.receipts enable row level security;

create policy "receipts are owned by user"
  on public.receipts
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============================================================
-- 3. updated_at 自動更新トリガー
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_receipts_updated_at on public.receipts;
create trigger trg_receipts_updated_at
  before update on public.receipts
  for each row execute function public.set_updated_at();

drop trigger if exists trg_subscriptions_updated_at on public.subscriptions;
create trigger trg_subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- ============================================================
-- 4. サインアップ時に subscriptions の初期行を作る
--   新規 auth.users が作られたら自動で plan='free' のレコードを挿入。
--   これにより「ログイン後にプランが未定義」状態をなくす。
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.subscriptions (user_id) values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
