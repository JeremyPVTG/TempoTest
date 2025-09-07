-- Week 5 Guardrails & QA Foundation
-- Feature flags via store_config, RevenueCat user mapping verification, observability

-- Feature flags & remote product configuration
create table if not exists public.store_config (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- RevenueCat user mapping (spoof-proof)
create table if not exists public.rc_user_map (
  user_id uuid primary key references auth.users(id) on delete cascade,
  rc_app_user_id text not null unique,
  created_at timestamptz not null default now()
);

-- Revenue observability view
create or replace view public.v_revenue_daily as
select 
  date_trunc('day', purchased_at) as day,
  count(*) filter (where status in ('INITIAL_PURCHASE','RENEWAL')) as tx_count,
  count(*) filter (where status in ('REFUND','CANCELLATION')) as refunds,
  jsonb_agg(distinct sku) as skus
from public.audit_purchases
group by 1
order by 1 desc;

-- Wallet helper view  
create or replace view public.v_wallet as
select user_id, streakshield_count, xp_booster_until, updated_at 
from public.user_wallet_balances;

-- RLS for new tables
alter table public.store_config enable row level security;
alter table public.rc_user_map enable row level security;

-- Policies
do $$ begin
  -- store_config: read-only for authenticated users (feature flags)
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='store_config' and policyname='read_store_config') then
    create policy read_store_config on public.store_config for select using (auth.role() = 'authenticated');
  end if;
  
  -- rc_user_map: users can read their own mapping (optional, for debugging)
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='rc_user_map' and policyname='read_own_rc_mapping') then
    create policy read_own_rc_mapping on public.rc_user_map for select using (auth.uid() = user_id);
  end if;
end $$;

-- Seed initial config (storefront disabled by default for safety)
insert into public.store_config (key, value) values
  ('storefront_enabled', '{"on": false}'::jsonb),
  ('paywall_enabled', '{"on": true}'::jsonb),
  ('sku_enabled', '{
    "pro_month": true,
    "pro_year": true, 
    "consumable_streakshield_1": true,
    "consumable_xp_booster_7d": true,
    "cos_theme_teal_nebula": true,
    "bundle_starter_pack": true
  }'::jsonb)
on conflict (key) do nothing;

-- Indexes for performance
create index if not exists idx_rc_user_map_rc_id on public.rc_user_map(rc_app_user_id);
create index if not exists idx_store_config_updated on public.store_config(updated_at desc);