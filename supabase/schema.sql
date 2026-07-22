-- ============================================================
-- Collection —— Supabase 結構定義
--
-- 使用方式：Supabase 主控台 › SQL Editor › 貼上整份 › Run
-- 可重複執行，不會破壞既有資料。
-- ============================================================

-- ---------- 1. 藏品資料表 ----------

create table if not exists public.items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,

  type        text not null check (type in ('card', 'vinyl', 'other')),
  title       text not null default '',
  subtitle    text not null default '',
  year        text not null default '',
  tags        text[] not null default '{}',
  favorite    boolean not null default false,

  acquired_at text not null default '',
  price       text not null default '',
  currency    text not null default 'TWD',
  notes       text not null default '',

  -- 各品類的專屬欄位，結構由前端 lib/schema.ts 定義
  fields      jsonb not null default '{}'::jsonb,

  -- 封面圖存於 Storage，這裡只記路徑
  cover_path  text,

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 列表頁一律以 user_id + 更新時間倒序查詢
create index if not exists items_user_updated_idx
  on public.items (user_id, updated_at desc);

-- ---------- 2. 自動維護 updated_at ----------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists items_touch_updated_at on public.items;
create trigger items_touch_updated_at
  before update on public.items
  for each row execute function public.touch_updated_at();

-- ---------- 3. Row Level Security ----------
-- 沒有這一段，任何拿到 anon key 的人都能讀寫全部資料。

alter table public.items enable row level security;

drop policy if exists "使用者只能存取自己的藏品" on public.items;
create policy "使用者只能存取自己的藏品"
  on public.items
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------- 4. 封面圖的 Storage bucket ----------

insert into storage.buckets (id, name, public)
values ('covers', 'covers', false)
on conflict (id) do nothing;

-- 檔案路徑規範為 <user_id>/<item_id>.<ext>，
-- 以路徑的第一段比對 uid，達成使用者之間的隔離。

drop policy if exists "自己的封面可讀" on storage.objects;
create policy "自己的封面可讀"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "自己的封面可寫" on storage.objects;
create policy "自己的封面可寫"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "自己的封面可更新" on storage.objects;
create policy "自己的封面可更新"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "自己的封面可刪除" on storage.objects;
create policy "自己的封面可刪除"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
