-- ============================================
-- Huddle – Supabase Schema
-- Run this in the Supabase SQL Editor
-- ============================================

-- 1. Profiles
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  avatar text,
  photo text,
  last_seen timestamptz default now()
);

alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on profiles for select using (true);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

-- 2. Servers
create table if not exists servers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon text,
  description text default '',
  owner_id uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);

alter table servers enable row level security;

create policy "Servers are viewable by everyone"
  on servers for select using (true);

create policy "Authenticated users can create servers"
  on servers for insert with check (auth.uid() = owner_id);

-- 3. Server Members
create table if not exists server_members (
  id uuid primary key default gen_random_uuid(),
  server_id uuid not null references servers(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role text not null default 'member',
  joined_at timestamptz default now(),
  unique (server_id, user_id)
);

alter table server_members enable row level security;

create policy "Members are viewable by everyone"
  on server_members for select using (true);

create policy "Authenticated users can join servers"
  on server_members for insert with check (auth.uid() = user_id);

-- 4. Channels
create table if not exists channels (
  id uuid primary key default gen_random_uuid(),
  server_id uuid not null references servers(id) on delete cascade,
  name text not null,
  position integer default 0,
  created_at timestamptz default now()
);

alter table channels enable row level security;

create policy "Channels are viewable by everyone"
  on channels for select using (true);

create policy "Authenticated users can create channels"
  on channels for insert with check (auth.role() = 'authenticated');

-- 5. Messages
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  server_channel text not null,
  user_id uuid not null references profiles(id) on delete cascade,
  author text not null,
  avatar text,
  photo text,
  text text not null,
  time text,
  created_at timestamptz default now()
);

alter table messages enable row level security;

create policy "Messages are viewable by everyone"
  on messages for select using (true);

create policy "Authenticated users can send messages"
  on messages for insert with check (auth.uid() = user_id);

-- Index for fast message queries
create index if not exists idx_messages_channel_created
  on messages (server_channel, created_at);

-- 6. Stock Portfolios
create table if not exists stock_portfolios (
  user_id uuid primary key references profiles(id) on delete cascade,
  cash_balance numeric not null default 100000,
  updated_at timestamptz default now()
);

alter table stock_portfolios enable row level security;

create policy "Users can view own portfolio"
  on stock_portfolios for select using (auth.uid() = user_id);

create policy "Users can insert own portfolio"
  on stock_portfolios for insert with check (auth.uid() = user_id);

create policy "Users can update own portfolio"
  on stock_portfolios for update using (auth.uid() = user_id);

-- 7. Stock Holdings
create table if not exists stock_holdings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  symbol text not null,
  shares numeric not null default 0,
  avg_buy_price numeric not null default 0,
  updated_at timestamptz default now(),
  unique (user_id, symbol)
);

alter table stock_holdings enable row level security;

create policy "Users can view own holdings"
  on stock_holdings for select using (auth.uid() = user_id);

create policy "Users can insert own holdings"
  on stock_holdings for insert with check (auth.uid() = user_id);

create policy "Users can update own holdings"
  on stock_holdings for update using (auth.uid() = user_id);

create policy "Users can delete own holdings"
  on stock_holdings for delete using (auth.uid() = user_id);

-- 8. Stock Transactions
create table if not exists stock_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  symbol text not null,
  stock_name text,
  type text not null,
  shares numeric not null,
  price numeric not null,
  total numeric not null,
  created_at timestamptz default now()
);

alter table stock_transactions enable row level security;

create policy "Users can view own transactions"
  on stock_transactions for select using (auth.uid() = user_id);

create policy "Users can insert own transactions"
  on stock_transactions for insert with check (auth.uid() = user_id);

create policy "Users can delete own transactions"
  on stock_transactions for delete using (auth.uid() = user_id);

-- Index for fast transaction history queries
create index if not exists idx_stock_transactions_user_created
  on stock_transactions (user_id, created_at desc);

-- 9. Storage Bucket for file uploads (chat attachments)
insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true)
on conflict (id) do nothing;

create policy "Anyone can view uploads"
  on storage.objects for select
  using (bucket_id = 'uploads');

create policy "Authenticated users can upload"
  on storage.objects for insert
  with check (bucket_id = 'uploads' and auth.role() = 'authenticated');

-- 10. Storage Bucket for profile pictures (avatars)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatar_select"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatar_insert"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.role() = 'authenticated');

create policy "avatar_update"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = split_part(name, '/', 1));

create policy "avatar_delete"
  on storage.objects for delete
  using (bucket_id = 'avatars' and auth.uid()::text = split_part(name, '/', 1));

-- 11. Messages: allow edit + delete of own messages
create policy "Users can update own messages"
  on messages for update using (auth.uid() = user_id);

create policy "Users can delete own messages"
  on messages for delete using (auth.uid() = user_id);

-- 12. Leaderboard: everyone can view all portfolios and holdings
drop policy if exists "Users can view own portfolio" on stock_portfolios;
create policy "Everyone can view portfolios"
  on stock_portfolios for select using (true);

drop policy if exists "Users can view own holdings" on stock_holdings;
create policy "Everyone can view holdings"
  on stock_holdings for select using (true);

-- 13. Enable Realtime for messages (INSERT + UPDATE + DELETE)
alter publication supabase_realtime add table messages;
