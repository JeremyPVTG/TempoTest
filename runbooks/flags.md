# Feature Flags & Kill-Switch Runbook

## Overview
This runbook covers management of feature flags, kill-switch procedures, and emergency configuration changes for the Habituals application.

## Feature Flag System Architecture
- **Storage**: `store_config` table in Supabase
- **Client Caching**: React Query with 60-second stale time  
- **Propagation SLA**: <60 seconds from database change to client effect
- **Fallback**: Conservative defaults ensure system stability

## Available Flags

### Core Business Flags
1. **`storefront_enabled`**: Controls entire purchase flow visibility
   - Default: `{"on": false}` (conservative)
   - Impact: Hides all monetization UI when disabled

2. **`paywall_enabled`**: Controls subscription paywall behavior
   - Default: `{"on": true}`
   - Impact: Disables upgrade prompts and subscription flows

3. **`sku_enabled`**: Granular product availability control
   - Default: All core SKUs enabled
   - Impact: Prevents purchase of specific products

4. **`min_supported_app_version`**: Forces app updates
   - Default: `{"version": "1.0.0"}`
   - Impact: Shows upgrade gate for older versions

## Emergency Procedures

### 🚨 Complete Monetization Kill Switch
**Use Case**: Critical payment processing issue, regulatory concern, or major bug affecting revenue

**Immediate Action** (ETA: <2 minutes):
```sql
-- Step 1: Disable all purchase flows
UPDATE store_config SET value = '{"on": false}' WHERE key = 'storefront_enabled';
UPDATE store_config SET value = '{"on": false}' WHERE key = 'paywall_enabled';

-- Step 2: Disable all SKUs to prevent backend processing
UPDATE store_config SET value = '{}' WHERE key = 'sku_enabled';

-- Step 3: Verify changes
SELECT key, value, updated_at FROM store_config 
WHERE key IN ('storefront_enabled', 'paywall_enabled', 'sku_enabled');
```

**Validation** (ETA: <5 minutes):
- [ ] Test purchase flow is hidden in app
- [ ] Verify existing subscribers retain access
- [ ] Check webhook processing still handles existing subscriptions
- [ ] Monitor function metrics for error reduction

**Communication**:
- Update status page: "Purchase functionality temporarily disabled for maintenance"
- Notify support team with standard response template
- Alert stakeholders via #incidents channel

### 🚨 Emergency Version Gate (Force Update)
**Use Case**: Critical security vulnerability, data corruption bug, or breaking API changes

**Immediate Action** (ETA: <1 minute):
```sql
-- Force all users to latest version (adjust version as needed)
UPDATE store_config 
SET value = '{"version": "999.0.0"}' 
WHERE key = 'min_supported_app_version';
```

**Validation**:
- [ ] Test with older app version shows upgrade gate
- [ ] Verify app store links work correctly
- [ ] Monitor user upgrade adoption rate

**Rollback** when ready:
```sql
-- Return to normal minimum version
UPDATE store_config 
SET value = '{"version": "1.0.0"}' 
WHERE key = 'min_supported_app_version';
```

### 🛡️ Selective SKU Disable
**Use Case**: Issues with specific product, Apple/Google policy violation, or pricing problems

**Target Pro Subscriptions**:
```sql
-- Disable subscription products only
UPDATE store_config 
SET value = jsonb_set(
  COALESCE(value, '{}'), 
  '{pro_month}', 
  'false'
) WHERE key = 'sku_enabled';

UPDATE store_config 
SET value = jsonb_set(
  value, 
  '{pro_year}', 
  'false'
) WHERE key = 'sku_enabled';
```

**Target Consumables**:
```sql
-- Disable consumable purchases
UPDATE store_config 
SET value = jsonb_set(value, '{consumable_streakshield_1}', 'false')
WHERE key = 'sku_enabled';

UPDATE store_config 
SET value = jsonb_set(value, '{consumable_xp_booster_7d}', 'false')
WHERE key = 'sku_enabled';
```

**Target Cosmetics**:
```sql
-- Disable theme purchases
UPDATE store_config 
SET value = jsonb_set(value, '{cos_theme_teal_nebula}', 'false')
WHERE key = 'sku_enabled';
```

### 🔄 Safe Mode (All Features Disabled)
**Use Case**: Major system instability, unknown critical bug, or infrastructure migration

```sql
-- Safe mode configuration
UPDATE store_config SET value = '{"on": false}' WHERE key = 'storefront_enabled';
UPDATE store_config SET value = '{"on": false}' WHERE key = 'paywall_enabled';  
UPDATE store_config SET value = '{}' WHERE key = 'sku_enabled';
UPDATE store_config SET value = '{"version": "1.0.0"}' WHERE key = 'min_supported_app_version';
```

This configuration:
- ✅ Keeps app functional for existing users
- ❌ Prevents new purchases
- ❌ Hides upgrade prompts
- ✅ Preserves existing subscriptions and entitlements

## Recovery Procedures

### Standard Recovery (Gradual Re-enablement)

**Step 1: Validate System Health**
```sql
-- Check recent error rates
SELECT * FROM v_fn_errors_daily 
WHERE day >= current_date - interval '1 day'
ORDER BY day DESC;

-- Verify database integrity
SELECT count(*) as total_users FROM user_entitlements;
SELECT count(*) as total_purchases FROM audit_purchases;
```

**Step 2: Re-enable Non-Critical Features First**
```sql
-- Re-enable cosmetic purchases (lowest risk)
UPDATE store_config 
SET value = jsonb_set(COALESCE(value, '{}'), '{cos_theme_teal_nebula}', 'true')
WHERE key = 'sku_enabled';

-- Wait 15 minutes, monitor for issues
```

**Step 3: Re-enable Core Revenue Features**
```sql
-- Re-enable storefront visibility  
UPDATE store_config SET value = '{"on": true}' WHERE key = 'storefront_enabled';

-- Re-enable subscription SKUs
UPDATE store_config 
SET value = jsonb_set(value, '{pro_month}', 'true')
WHERE key = 'sku_enabled';

UPDATE store_config 
SET value = jsonb_set(value, '{pro_year}', 'true') 
WHERE key = 'sku_enabled';

-- Re-enable paywall last (triggers upgrade prompts)
UPDATE store_config SET value = '{"on": true}' WHERE key = 'paywall_enabled';
```

**Step 4: Full Recovery Validation**
- [ ] End-to-end purchase test (sandbox)
- [ ] Verify all UI components visible
- [ ] Check webhook processing resumed
- [ ] Monitor metrics for 30 minutes
- [ ] Update status page with "all systems operational"

### Rapid Recovery (Emergency Restore)
If safe mode was activated unnecessarily:

```sql
-- Restore to production defaults (use with caution)
UPDATE store_config SET value = '{"on": false}' WHERE key = 'storefront_enabled'; -- Conservative default
UPDATE store_config SET value = '{"on": true}' WHERE key = 'paywall_enabled';
UPDATE store_config SET value = '{
  "pro_month": true,
  "pro_year": true,
  "consumable_streakshield_1": true,
  "consumable_xp_booster_7d": true,
  "cos_theme_teal_nebula": true,
  "bundle_starter_pack": true
}' WHERE key = 'sku_enabled';
UPDATE store_config SET value = '{"version": "1.0.0"}' WHERE key = 'min_supported_app_version';
```

## Monitoring & Validation

### Flag Propagation Testing
```bash
# Kill-switch rehearsal script
cd packages/data/src/scripts
npx tsx kill-switch-rehearsal.ts validate
npx tsx kill-switch-rehearsal.ts rehearse --live
```

### Client-Side Validation
```javascript
// Test flag changes in browser console
// Check flag values are updating
const config = await client.from('store_config').select('*')
console.log('Current flags:', config.data)

// Verify React Query cache invalidation
// Should see new request in network tab within 60s
```

### Monitoring Queries
```sql
-- Flag change audit
SELECT key, value, updated_at 
FROM store_config 
ORDER BY updated_at DESC;

-- Impact assessment
SELECT 
  date_trunc('hour', timestamp) as hour,
  function_name,
  count(*) as requests,
  count(*) filter (where status_code >= 400) as errors
FROM function_metrics 
WHERE timestamp > now() - interval '6 hours'
GROUP BY 1, 2 ORDER BY 1 DESC;

-- Purchase flow impact
SELECT 
  date_trunc('hour', purchased_at) as hour,
  count(*) as purchases,
  count(distinct user_id) as unique_buyers
FROM audit_purchases 
WHERE purchased_at > now() - interval '24 hours'
GROUP BY 1 ORDER BY 1 DESC;
```

## Development Environment Overrides

### Testing Kill Switches Locally
```typescript
// Override flags in development
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

// Force production flag behavior for testing
export function getEffectiveConfig(config?: StoreConfig): Required<StoreConfig> {
  if (process.env.FORCE_PROD_FLAGS === 'true') {
    return config // Use actual production flags
  }
  // ... normal development overrides
}
```

### Local Testing Commands
```bash
# Set environment to test production flag behavior
FORCE_PROD_FLAGS=true npm run dev

# Test with specific flag values
VITE_OVERRIDE_STOREFRONT_ENABLED=false npm run dev
```

## Advanced Procedures

### Gradual Rollout (Canary Release)
For testing new features or recovering from incidents:

```sql
-- Phase 1: Internal testing only (disable for all users)  
UPDATE store_config SET value = '{"on": false}' WHERE key = 'storefront_enabled';

-- Phase 2: Enable for beta users (implement user-based targeting)
-- This requires additional logic in useStoreConfig hook

-- Phase 3: Enable for percentage of users (implement percentage rollout)
-- This requires client-side randomization logic

-- Phase 4: Full rollout
UPDATE store_config SET value = '{"on": true}' WHERE key = 'storefront_enabled';
```

### A/B Testing Integration
```sql
-- Configure A/B test variants
UPDATE store_config SET value = '{
  "variant_a": {"storefront_enabled": true, "paywall_style": "minimal"},
  "variant_b": {"storefront_enabled": true, "paywall_style": "detailed"}
}' WHERE key = 'ab_test_config';
```

### Scheduled Flag Changes
For planned maintenance or releases:

```sql
-- Create scheduled flag changes table
CREATE TABLE scheduled_flag_changes (
  id SERIAL PRIMARY KEY,
  flag_key TEXT NOT NULL,
  flag_value JSONB NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  executed_at TIMESTAMPTZ,
  created_by TEXT NOT NULL
);

-- Example: Schedule storefront disable for maintenance
INSERT INTO scheduled_flag_changes (flag_key, flag_value, scheduled_at, created_by)
VALUES ('storefront_enabled', '{"on": false}', '2025-01-15 02:00:00+00', 'maintenance_team');
```

## Troubleshooting

### Flag Changes Not Propagating

**Check 1: Database Update Successful**
```sql
SELECT key, value, updated_at FROM store_config 
WHERE updated_at > now() - interval '10 minutes';
```

**Check 2: React Query Cache**
- Clear browser cache/localStorage
- Check network requests for store_config
- Verify 60-second cache TTL in useStoreConfig

**Check 3: Component Re-rendering**
- Use React Developer Tools to inspect component state
- Check if useStoreConfig hook is being called
- Verify conditional rendering logic

### Unexpected Flag Behavior

**Check 1: Default Fallbacks**
```typescript
// Review DEFAULT_CONFIG in useStoreConfig.ts
const DEFAULT_CONFIG: Required<StoreConfig> = {
  storefront_enabled: { on: false }, // Conservative default
  paywall_enabled: { on: true },
  // ... other defaults
}
```

**Check 2: Development Overrides**
```typescript
// Check if development mode is overriding flags
if (isDevelopment()) {
  return {
    storefront_enabled: { on: true }, // Dev override
    // ...
  }
}
```

**Check 3: Client-Side Caching**
- Check browser localStorage for cached config
- Verify React Query devtools for stale data
- Clear cache and test again

## Documentation & Training

### Flag Change Procedures
1. **Document Reason**: Always document why flag is being changed
2. **Get Approval**: Major flag changes require team lead approval  
3. **Monitor Impact**: Watch metrics for 15 minutes after change
4. **Communicate**: Update relevant teams about flag changes

### Emergency Contact Information
- **On-Call Engineer**: Primary responder for flag issues
- **Product Team**: For business impact assessment
- **Customer Support**: For user communication
- **DevOps Team**: For infrastructure-level kill switches

### Training Resources
- Kill-switch rehearsal schedule: Monthly
- New team member onboarding: Include flag system training
- Documentation updates: Required for any new flags

## Appendix: Flag Configuration Reference

### Complete Flag Schema
```typescript
interface StoreConfig {
  storefront_enabled?: { on: boolean }
  paywall_enabled?: { on: boolean }
  sku_enabled?: Record<string, boolean>
  min_supported_app_version?: { version: string }
}
```

### Production-Safe Defaults
```json
{
  "storefront_enabled": {"on": false},
  "paywall_enabled": {"on": true}, 
  "sku_enabled": {
    "pro_month": true,
    "pro_year": true,
    "consumable_streakshield_1": true,
    "consumable_xp_booster_7d": true,
    "cos_theme_teal_nebula": true,
    "bundle_starter_pack": true
  },
  "min_supported_app_version": {"version": "1.0.0"}
}
```

### Test Scenarios
- ✅ All flags disabled (safe mode)
- ✅ Only subscriptions enabled 
- ✅ Only consumables enabled
- ✅ Version gate active
- ✅ Gradual re-enablement