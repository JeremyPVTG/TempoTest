-- Week 6: SLOs, Alerts, and Revenue Reporting Views
-- Error tracking for monitoring and alerting

-- Function error tracking (parsed from edge function logs)
create table if not exists public.function_metrics (
  id bigserial primary key,
  function_name text not null,
  request_id text,
  status_code int not null,
  duration_ms int not null,
  error_code text,
  slo_tag text, -- 'webhook' | 'claim' for SLO tracking
  timestamp timestamptz not null default now()
);

-- Indexes for fast queries
create index if not exists idx_function_metrics_timestamp on public.function_metrics(timestamp desc);
create index if not exists idx_function_metrics_function on public.function_metrics(function_name, timestamp desc);
create index if not exists idx_function_metrics_slo on public.function_metrics(slo_tag, timestamp desc);

-- Daily error aggregation view
create or replace view public.v_fn_errors_daily as
select 
  date_trunc('day', timestamp) as day,
  function_name,
  slo_tag,
  count(*) as total_requests,
  count(*) filter (where status_code >= 400) as error_count,
  round(count(*) filter (where status_code >= 400) * 100.0 / count(*), 2) as error_rate_percent,
  round(percentile_cont(0.95) within group (order by duration_ms), 2) as p95_latency_ms,
  round(avg(duration_ms), 2) as avg_latency_ms
from public.function_metrics
where timestamp >= current_date - interval '30 days'
group by 1, 2, 3
order by 1 desc, 2;

-- Rolling 15-minute SLO monitoring view
create or replace view public.v_slo_violations_15min as
select
  date_trunc('minute', timestamp) - interval '1 minute' * (extract(minute from timestamp)::int % 15) as window_start,
  slo_tag,
  count(*) as requests,
  count(*) filter (where status_code >= 400) as errors,
  round(count(*) filter (where status_code >= 400) * 100.0 / count(*), 2) as error_rate_percent,
  round(percentile_cont(0.95) within group (order by duration_ms), 2) as p95_latency_ms,
  -- SLO violation flags
  case when round(count(*) filter (where status_code >= 400) * 100.0 / count(*), 2) > 1.0 then true else false end as error_rate_violation,
  case when slo_tag = 'webhook' and round(percentile_cont(0.95) within group (order by duration_ms), 2) > 750 then true else false end as webhook_latency_violation,
  case when slo_tag = 'claim' and round(percentile_cont(0.95) within group (order by duration_ms), 2) > 500 then true else false end as claim_latency_violation
from public.function_metrics
where timestamp >= now() - interval '4 hours'
  and slo_tag is not null
group by 1, 2
having count(*) >= 5  -- Only evaluate windows with enough data
order by 1 desc;

-- Claim conflict tracking (caps exceeded, etc.)
create or replace view public.v_claim_conflicts_rolling as
select
  date_trunc('hour', timestamp) as hour,
  count(*) filter (where status_code = 409 and error_code like '%cap%') as cap_exceeded_count,
  count(*) filter (where status_code = 409) as total_conflicts,
  count(*) as total_claims
from public.function_metrics
where function_name = 'claim'
  and timestamp >= now() - interval '24 hours'
group by 1
order by 1 desc;

-- Revenue reporting views (enhanced from Phase 5)
create or replace view public.v_consumables_rolling_7d as
select 
  date_trunc('day', claimed_at) as day,
  sku,
  count(*) as claims_count,
  count(distinct user_id) as unique_users
from public.purchase_claims
where claimed_at >= current_date - interval '7 days'
  and sku like 'consumable_%'
group by 1, 2
order by 1 desc, 2;

-- Enhanced revenue daily view with more metrics
create or replace view public.v_revenue_daily_enhanced as
select 
  date_trunc('day', purchased_at) as day,
  platform,
  count(*) filter (where status in ('INITIAL_PURCHASE','RENEWAL')) as purchases,
  count(*) filter (where status in ('REFUND','CANCELLATION')) as refunds,
  count(*) filter (where sku like 'pro_%') as subscription_transactions,
  count(*) filter (where sku like 'consumable_%') as consumable_transactions,
  count(*) filter (where sku like 'cos_%') as cosmetic_transactions,
  count(distinct user_id) as unique_buyers,
  array_agg(distinct sku) filter (where status in ('INITIAL_PURCHASE','RENEWAL')) as purchased_skus
from public.audit_purchases
where purchased_at >= current_date - interval '30 days'
group by 1, 2
order by 1 desc, 2;

-- HMAC failure tracking (security monitoring)
create or replace view public.v_hmac_failures_daily as
select
  date_trunc('day', timestamp) as day,
  count(*) filter (where status_code = 401 and error_code like '%signature%') as hmac_failures,
  count(*) filter (where function_name = 'revenuecat-webhook') as total_webhook_requests
from public.function_metrics
where function_name = 'revenuecat-webhook'
  and timestamp >= current_date - interval '7 days'
group by 1
order by 1 desc;

-- RLS for function_metrics (admin-only access)
alter table public.function_metrics enable row level security;

-- Only allow service_role to insert metrics
create policy function_metrics_service_only on public.function_metrics
  for all using (auth.role() = 'service_role');

-- Allow authenticated users to read views (for admin dashboards)
-- Views inherit permissions from underlying tables automatically