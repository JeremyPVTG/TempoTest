-- Week 4 Storefront Foundation
-- Tables for user entitlements, wallet balances, audit purchases, and purchase claims

-- Tables
create table if not exists public.user_entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  pro boolean not null default false,
  cosmetics jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.user_wallet_balances (
  user_id uuid primary key references auth.users(id) on delete cascade,
  streakshield_count int not null default 0,
  xp_booster_until timestamptz null,
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_purchases (
  tx_id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  sku text not null,
  price_micros bigint,
  currency text,
  platform text,             -- 'ios' | 'android' | 'web'
  purchased_at timestamptz not null default now(),
  status text not null,      -- 'INITIAL_PURCHASE' | 'RENEWAL' | 'CANCELLATION' | 'REFUND' | ...
  raw jsonb not null default '{}'::jsonb
);

create table if not exists public.purchase_claims (
  tx_id text primary key references public.audit_purchases(tx_id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  sku text not null,
  claimed_at timestamptz not null default now()
);

-- Helpful indexes
create index if not exists idx_audit_user on public.audit_purchases(user_id);
create index if not exists idx_claims_user_time on public.purchase_claims(user_id, claimed_at);
create index if not exists idx_claims_sku_time on public.purchase_claims(sku, claimed_at);

-- RLS
alter table public.user_entitlements enable row level security;
alter table public.user_wallet_balances enable row level security;
alter table public.audit_purchases enable row level security;
alter table public.purchase_claims enable row level security;

-- Policies: users read their own entitlements & wallet; webhooks (service_role) bypass RLS automatically.
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='user_entitlements' and policyname='read_own_entitlements'
  ) then
    create policy read_own_entitlements on public.user_entitlements
      for select using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='user_wallet_balances' and policyname='read_own_wallet'
  ) then
    create policy read_own_wallet on public.user_wallet_balances
      for select using (auth.uid() = user_id);
  end if;

  -- Lock down audit tables to end users (no select), service_role bypasses RLS for webhooks/claims.
end $$;

-- Utility views (optional)
create or replace view public.v_wallet as
  select user_id, streakshield_count, xp_booster_until, updated_at from public.user_wallet_balances;

-- Caps helper (optional; claim logic still enforced in Edge)
create or replace function public.caps_remaining_streakshield(p_user uuid)
returns jsonb language sql stable as $$
  with week_claims as (
    select count(*)::int c from public.purchase_claims
    where user_id = p_user
      and sku = 'consumable_streakshield_1'
      and claimed_at >= date_trunc('week', now())
  ),
  month_claims as (
    select count(*)::int c from public.purchase_claims
    where user_id = p_user
      and sku = 'consumable_streakshield_1'
      and claimed_at >= date_trunc('month', now())
  )
  select jsonb_build_object(
    'week', greatest(0, 1 - coalesce((select c from week_claims),0)),
    'month', greatest(0, 3 - coalesce((select c from month_claims),0))
  );
$$;