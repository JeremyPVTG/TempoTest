# Claim Service Incident Runbook

## Overview
This runbook covers incident response for the claim service that processes consumable in-app purchases (Streak Shields, XP Boosters) and manages user wallet balances.

## Service Level Objectives (SLOs)
- **Availability**: 99.9% uptime
- **Latency**: p95 ≤ 500ms response time
- **Error Rate**: ≤ 1% errors per 15-minute window
- **Data Integrity**: 100% accurate wallet balance updates

## Common Incidents

### 1. Purchase Cap Exceeded Errors (409 Conflicts)

**Symptoms:**
- High volume of 409 responses with `cap_exceeded` error codes
- Users unable to claim legitimate purchases
- Customer support reports about purchase failures

**Immediate Actions:**
1. **Check cap conflict rate:**
   ```sql
   SELECT * FROM v_claim_conflicts_rolling 
   ORDER BY hour DESC LIMIT 24;
   ```

2. **Review specific user patterns:**
   ```sql
   SELECT user_id, sku, count(*) as attempts, 
          min(claimed_at) as first_claim, 
          max(claimed_at) as last_claim
   FROM purchase_claims 
   WHERE claimed_at > now() - interval '7 days'
   AND sku = 'consumable_streakshield_1'
   GROUP BY user_id, sku 
   HAVING count(*) > 3
   ORDER BY attempts DESC;
   ```

**Resolution Steps:**
1. **Validate cap logic:**
   - Weekly cap: 1 streak shield per week
   - Monthly cap: 3 streak shields per month
   - Review date calculation logic for edge cases

2. **Manual cap override for legitimate cases:**
   ```sql
   -- For legitimate customer support cases only
   -- Verify purchase in audit_purchases first
   INSERT INTO purchase_claims (tx_id, user_id, sku) 
   VALUES ('tx_id_from_audit', 'user_id', 'consumable_streakshield_1');
   
   -- Update wallet balance
   UPDATE user_wallet_balances 
   SET streakshield_count = streakshield_count + 1,
       updated_at = now()
   WHERE user_id = 'user_id';
   ```

3. **Address systematic issues:**
   - Check for timezone-related cap calculation bugs
   - Verify week/month boundary calculations
   - Review for potential abuse patterns

**Prevention:** Implement better user communication about purchase limits.

### 2. Wallet Balance Inconsistencies

**Symptoms:**
- Users report incorrect streak shield or XP booster counts
- Wallet balances don't match claim history
- `wallet_update_error` codes in logs

**Immediate Actions:**
1. **Audit wallet vs claims consistency:**
   ```sql
   WITH claim_totals AS (
     SELECT user_id, 
            count(*) filter (where sku = 'consumable_streakshield_1') as claimed_shields
     FROM purchase_claims 
     GROUP BY user_id
   )
   SELECT w.user_id, 
          w.streakshield_count as wallet_shields,
          COALESCE(c.claimed_shields, 0) as claimed_shields,
          w.streakshield_count - COALESCE(c.claimed_shields, 0) as discrepancy
   FROM user_wallet_balances w
   LEFT JOIN claim_totals c ON w.user_id = c.user_id
   WHERE w.streakshield_count != COALESCE(c.claimed_shields, 0)
   LIMIT 50;
   ```

2. **Check for concurrent update issues:**
   ```sql
   SELECT user_id, count(*) as concurrent_claims
   FROM purchase_claims 
   WHERE claimed_at > now() - interval '1 hour'
   GROUP BY user_id 
   HAVING count(*) > 1
   ORDER BY concurrent_claims DESC;
   ```

**Resolution Steps:**
1. **Reconcile wallet balances:**
   ```sql
   -- Backup current state first
   CREATE TABLE wallet_backup AS 
   SELECT *, now() as backup_at FROM user_wallet_balances;
   
   -- Recalculate from claims history
   WITH correct_balances AS (
     SELECT user_id,
            count(*) filter (where sku = 'consumable_streakshield_1') as correct_shields
     FROM purchase_claims 
     GROUP BY user_id
   )
   UPDATE user_wallet_balances w
   SET streakshield_count = COALESCE(c.correct_shields, 0),
       updated_at = now()
   FROM correct_balances c 
   WHERE w.user_id = c.user_id;
   ```

2. **Implement transaction consistency:**
   - Review claim function for race conditions
   - Add database constraints if needed
   - Consider pessimistic locking for wallet updates

3. **Add integrity checks:**
   ```sql
   -- Scheduled integrity check query
   CREATE OR REPLACE FUNCTION check_wallet_integrity()
   RETURNS TABLE(user_id text, wallet_count int, claim_count bigint) AS $$
   BEGIN
     RETURN QUERY
     WITH claim_counts AS (
       SELECT pc.user_id, 
              count(*) as claims
       FROM purchase_claims pc 
       WHERE pc.sku = 'consumable_streakshield_1'
       GROUP BY pc.user_id
     )
     SELECT w.user_id::text, 
            w.streakshield_count, 
            COALESCE(cc.claims, 0)
     FROM user_wallet_balances w
     LEFT JOIN claim_counts cc ON w.user_id = cc.user_id
     WHERE w.streakshield_count != COALESCE(cc.claims, 0);
   END;
   $$ LANGUAGE plpgsql;
   ```

**Escalation:** For widespread inconsistencies, coordinate with data team for bulk reconciliation.

### 3. XP Booster Expiration Issues

**Symptoms:**
- Users report XP boosters expiring too early or too late
- Incorrect `xp_booster_until` timestamps
- Logic errors in booster stacking

**Immediate Actions:**
1. **Check recent XP booster claims:**
   ```sql
   SELECT user_id, xp_booster_until, updated_at
   FROM user_wallet_balances 
   WHERE xp_booster_until IS NOT NULL
   AND updated_at > now() - interval '1 hour'
   ORDER BY updated_at DESC;
   ```

2. **Validate booster stacking logic:**
   ```sql
   -- Users with multiple recent XP booster purchases
   SELECT user_id, count(*) as booster_purchases,
          array_agg(claimed_at order by claimed_at) as claim_times
   FROM purchase_claims 
   WHERE sku = 'consumable_xp_booster_7d'
   AND claimed_at > now() - interval '7 days'
   GROUP BY user_id 
   HAVING count(*) > 1;
   ```

**Resolution Steps:**
1. **Fix incorrect expiration times:**
   ```sql
   -- For users with incorrect booster expiration
   -- Recalculate based on claim history
   WITH booster_calc AS (
     SELECT user_id,
            max(claimed_at) + interval '7 days' as correct_expiry
     FROM purchase_claims 
     WHERE sku = 'consumable_xp_booster_7d'
     AND user_id = 'affected_user_id'
     GROUP BY user_id
   )
   UPDATE user_wallet_balances w
   SET xp_booster_until = bc.correct_expiry,
       updated_at = now()
   FROM booster_calc bc 
   WHERE w.user_id = bc.user_id;
   ```

2. **Review stacking implementation:**
   - Verify max(current_expiry, new_expiry) logic
   - Check for timezone handling issues
   - Test edge cases around daylight saving time

**Prevention:** Add automated tests for XP booster expiration edge cases.

### 4. Database Connection/Performance Issues

**Symptoms:**
- High latency (p95 > 500ms)
- Database timeout errors
- `internal_error` responses

**Immediate Actions:**
1. **Check database performance:**
   ```sql
   -- Monitor active connections
   SELECT count(*) as active_connections 
   FROM pg_stat_activity 
   WHERE state = 'active';
   
   -- Check for slow queries
   SELECT query, mean_exec_time, calls 
   FROM pg_stat_statements 
   WHERE query LIKE '%purchase_claims%' 
   OR query LIKE '%user_wallet_balances%'
   ORDER BY mean_exec_time DESC 
   LIMIT 10;
   ```

2. **Review recent claim volume:**
   ```sql
   SELECT date_trunc('hour', timestamp) as hour, 
          count(*) as requests,
          avg(duration_ms) as avg_latency
   FROM function_metrics 
   WHERE function_name = 'claim'
   AND timestamp > now() - interval '6 hours'
   GROUP BY 1 ORDER BY 1 DESC;
   ```

**Resolution Steps:**
1. **Optimize queries:**
   - Add missing indexes on frequently queried columns
   - Review claim cap calculation queries for efficiency
   - Consider materialized views for complex aggregations

2. **Scale resources:**
   - Monitor Supabase dashboard for resource utilization
   - Consider upgrading database tier if needed
   - Implement connection pooling optimizations

3. **Add query monitoring:**
   ```sql
   -- Create index for performance if missing
   CREATE INDEX IF NOT EXISTS idx_purchase_claims_user_sku_time 
   ON purchase_claims(user_id, sku, claimed_at);
   
   CREATE INDEX IF NOT EXISTS idx_user_wallet_balances_user_id 
   ON user_wallet_balances(user_id);
   ```

**Escalation:** If performance issues persist, escalate to platform team for infrastructure review.

## Monitoring & Alerting

### Key Metrics to Monitor
1. **Claim Success Rate**: Overall success rate of claim requests
2. **Cap Conflict Rate**: Percentage of 409 responses
3. **Wallet Consistency**: Automated integrity checks
4. **Processing Latency**: p95 response time trends

### Alert Thresholds
- **Critical**: Error rate > 5% for 15+ minutes
- **Warning**: p95 latency > 300ms for 30+ minutes  
- **Info**: Cap conflict rate > 10% per hour

### Dashboard Queries
```sql
-- Claim service health overview
SELECT 
  date_trunc('hour', timestamp) as hour,
  count(*) as total_requests,
  count(*) filter (where status_code = 200) as successful,
  count(*) filter (where status_code = 409) as cap_exceeded,
  count(*) filter (where status_code >= 500) as errors,
  round(avg(duration_ms), 2) as avg_latency_ms
FROM function_metrics 
WHERE function_name = 'claim'
AND timestamp > now() - interval '24 hours'
GROUP BY 1 ORDER BY 1 DESC;

-- Wallet balance health check
SELECT 
  'streak_shields' as item_type,
  sum(streakshield_count) as total_balance,
  count(*) filter (where streakshield_count > 0) as users_with_balance
FROM user_wallet_balances
UNION ALL
SELECT 
  'xp_boosters' as item_type,
  count(*) filter (where xp_booster_until > now()) as active_boosters,
  count(*) filter (where xp_booster_until IS NOT NULL) as total_users
FROM user_wallet_balances;
```

## Emergency Procedures

### Complete Claim Service Outage
1. **Immediate Response:**
   - Disable claim functionality via feature flag
   - Notify users about temporary purchase processing delays
   - Queue purchase events for later processing

2. **Recovery:**
   - Fix underlying issue (database, logic, infrastructure)
   - Test claim processing in development environment
   - Gradually re-enable claim functionality

3. **Post-Recovery:**
   - Process queued claim requests
   - Run wallet integrity checks
   - Verify all affected users have correct balances

### Wallet Data Corruption
If widespread wallet inconsistencies are detected:

1. **Stop all claim processing immediately**
2. **Backup current wallet state:**
   ```sql
   CREATE TABLE emergency_wallet_backup AS 
   SELECT *, now() as backup_timestamp 
   FROM user_wallet_balances;
   ```
3. **Calculate correct balances from audit trail:**
   ```sql
   -- Restore from purchase_claims history
   -- This script should be thoroughly tested before use
   ```
4. **Coordinate with customer support for user communication**

### Kill Switch Scenarios
```sql
-- Disable all consumable purchases
UPDATE store_config 
SET value = '{}' 
WHERE key = 'sku_enabled';

-- Disable specific SKU
UPDATE store_config 
SET value = jsonb_set(value, '{consumable_streakshield_1}', 'false')
WHERE key = 'sku_enabled';
```

## Data Recovery Procedures

### Wallet Balance Recovery
```sql
-- Step 1: Identify affected users
WITH inconsistent_wallets AS (
  SELECT w.user_id,
         w.streakshield_count as wallet_shields,
         COALESCE(c.claim_count, 0) as actual_claims
  FROM user_wallet_balances w
  LEFT JOIN (
    SELECT user_id, count(*) as claim_count
    FROM purchase_claims 
    WHERE sku = 'consumable_streakshield_1'
    GROUP BY user_id
  ) c ON w.user_id = c.user_id
  WHERE w.streakshield_count != COALESCE(c.claim_count, 0)
)
SELECT * FROM inconsistent_wallets;

-- Step 2: Backup before correction
CREATE TABLE wallet_correction_backup AS
SELECT *, now() as backup_time FROM user_wallet_balances
WHERE user_id IN (SELECT user_id FROM inconsistent_wallets);

-- Step 3: Apply corrections (requires approval)
-- This should only be run after thorough validation
```

### Purchase Claim Recovery
```sql
-- Recover missing claims from audit_purchases
INSERT INTO purchase_claims (tx_id, user_id, sku, claimed_at)
SELECT a.tx_id, a.user_id, a.sku, a.purchased_at
FROM audit_purchases a
LEFT JOIN purchase_claims c ON a.tx_id = c.tx_id
WHERE c.tx_id IS NULL 
AND a.sku IN ('consumable_streakshield_1', 'consumable_xp_booster_7d')
AND a.status = 'INITIAL_PURCHASE'
-- Add date constraints and manual verification before running
```

## Contact Information

### Escalation Chain
1. **On-Call Engineer** (Primary)
2. **Backend Team Lead** (Secondary)
3. **CTO** (Executive escalation)

### Customer Support Coordination
- **Support Team Lead**: For user communication
- **Data Team**: For bulk data corrections
- **Finance Team**: For revenue impact assessment

## Reference Materials

### Related Functions
- `claim/index.ts`: Main claim processing logic
- `useStoreConfig.ts`: Feature flag management
- `storeRepo.ts`: Purchase repository layer

### Test Commands
```bash
# Test claim endpoint
curl -X POST "https://[project].supabase.co/functions/v1/claim" \
  -H "Content-Type: application/json" \
  -d '{"sku": "consumable_streakshield_1", "tx_id": "test-tx-123"}'

# Check health endpoint  
curl "https://[project].supabase.co/functions/v1/claim?health=1"
```

### Useful SQL Queries
```sql
-- User's complete claim history
SELECT pc.*, ap.purchased_at, ap.status 
FROM purchase_claims pc
JOIN audit_purchases ap ON pc.tx_id = ap.tx_id
WHERE pc.user_id = 'user_id_here'
ORDER BY pc.claimed_at DESC;

-- Current wallet vs claim totals
SELECT user_id,
       streakshield_count,
       (SELECT count(*) FROM purchase_claims 
        WHERE user_id = w.user_id 
        AND sku = 'consumable_streakshield_1') as claim_count
FROM user_wallet_balances w
WHERE user_id = 'user_id_here';
```