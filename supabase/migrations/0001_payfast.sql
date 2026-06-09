-- PayFast orders + user entitlements
-- Run in Supabase SQL editor (or via supabase db push if/when the CLI is wired).
-- Idempotent: safe to re-run.

-- ──────────────────────────────────────────────────────────────────────────────
-- orders: one row per checkout attempt. Keyed on m_payment_id (UUID we generate
-- in /api/payfast/initiate) so ITN retries are idempotent.
-- ──────────────────────────────────────────────────────────────────────────────
create table if not exists public.orders (
  m_payment_id   uuid primary key,
  user_id        uuid not null references auth.users(id) on delete cascade,
  course_id      text not null,
  amount_zar     numeric(10, 2) not null,
  status         text not null default 'pending'
                 check (status in ('pending', 'complete', 'failed', 'cancelled')),
  pf_payment_id  text,
  raw_itn        jsonb,
  created_at     timestamptz not null default now(),
  paid_at        timestamptz
);

create index if not exists orders_user_id_idx on public.orders(user_id);
create index if not exists orders_pf_payment_id_idx on public.orders(pf_payment_id);

alter table public.orders enable row level security;

drop policy if exists "orders: read own" on public.orders;
create policy "orders: read own"
  on public.orders for select
  using (auth.uid() = user_id);

-- No insert/update/delete policies → only the service-role key (used by the
-- ITN handler) can write. Anon/authenticated clients are read-own only.

-- ──────────────────────────────────────────────────────────────────────────────
-- user_purchases: granted entitlements. One row per (user, course).
-- Bundle expands to three rows server-side in the ITN handler.
-- ──────────────────────────────────────────────────────────────────────────────
create table if not exists public.user_purchases (
  user_id     uuid not null references auth.users(id) on delete cascade,
  course_id   text not null,
  granted_at  timestamptz not null default now(),
  source      text not null default 'payfast',
  order_id    uuid references public.orders(m_payment_id) on delete set null,
  primary key (user_id, course_id)
);

create index if not exists user_purchases_user_id_idx on public.user_purchases(user_id);

alter table public.user_purchases enable row level security;

drop policy if exists "user_purchases: read own" on public.user_purchases;
create policy "user_purchases: read own"
  on public.user_purchases for select
  using (auth.uid() = user_id);

-- No write policies → service-role only.
