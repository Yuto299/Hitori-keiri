-- 店名→科目のAI学習(FR-06・Pro)
-- 出典: 要件 第5章 5.3.6 / 第6章 6.6
-- ユーザー × 正規化店名 × 科目 の採用回数を記録し、次回の第一候補に使う。

create table if not exists public.category_learning (
  user_id      uuid not null references auth.users(id) on delete cascade,
  store_key    text not null,
  category_id  text not null,
  count        integer not null default 1 check (count >= 0),
  updated_at   timestamptz not null default now(),
  primary key (user_id, store_key, category_id)
);

create index if not exists idx_category_learning_user_store
  on public.category_learning (user_id, store_key);

alter table public.category_learning enable row level security;

create policy "category_learning is owned by user"
  on public.category_learning
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop trigger if exists trg_category_learning_updated_at on public.category_learning;
create trigger trg_category_learning_updated_at
  before update on public.category_learning
  for each row execute function public.set_updated_at();
