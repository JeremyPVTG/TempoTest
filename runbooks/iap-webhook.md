# RevenueCat Webhook Incident Runbook

## Overview
This runbook covers incident response for RevenueCat webhook issues that may affect user purchases, subscriptions, and entitlements.

## Service Level Objectives (SLOs)
- **Availability**: 99.9% uptime
- **Latency**: p95 ≤ 750ms response time
- **Error Rate**: ≤ 1% errors per 15-minute window

## Common Incidents

### 1. Webhook Signature Validation Failures

**Symptoms:**
- High number of 401 responses in function metrics
- `signature_invalid` error codes in logs
- Users reporting purchase issues

**Immediate Actions:**
1. Check HMAC failure rate in monitoring dashboard:
   ```sql
   SELECT * FROM v_hmac_failures_daily ORDER BY day DESC LIMIT 7;
   ```

2. Verify webhook secret configuration:
   - Check Supabase Edge Function environment variables
   - Verify RevenueCat webhook configuration in dashboard

**Resolution Steps:**
1. **Rotate webhook secret if compromised:**
   ```bash
   # Generate new secret
   openssl rand -base64 32
   
   # Update in RevenueCat dashboard
   # Update in Supabase Edge Function environment
   ```

2. **Validate webhook signature implementation:**
   - Review `verifySignature` function in webhook handler
   - Test signature validation with known good payload

**Escalation:** If signature validation is correct but failures persist, escalate to RevenueCat support.

### 2. High Latency / Timeouts

**Symptoms:**
- p95 latency > 750ms in SLO dashboard
- Webhook timeout errors in RevenueCat dashboard
- Delayed entitlement updates for users

**Immediate Actions:**
1. Check database performance:
   ```sql
   SELECT * FROM v_fn_errors_daily 
   WHERE function_name = 'revenuecat-webhook' 
   ORDER BY day DESC LIMIT 1;
   ```

2. Review recent webhook volume:
   ```sql
   SELECT date_trunc('hour', timestamp) as hour, count(*) 
   FROM function_metrics 
   WHERE function_name = 'revenuecat-webhook' 
   AND timestamp > now() - interval '24 hours'
   GROUP BY 1 ORDER BY 1 DESC;
   ```

**Resolution Steps:**
1. **Scale database connections:**
   - Monitor Supabase dashboard for connection limits
   - Consider connection pooling optimizations

2. **Optimize webhook processing:**
   - Review audit_purchases table for slow queries
   - Check user_entitlements upsert performance
   - Verify rc_user_map lookups are indexed

3. **Implement request queuing if needed:**
   - Consider async processing for non-critical operations
   - Prioritize entitlement updates over audit logging

**Escalation:** If performance doesn't improve after optimization, escalate to platform team.

### 3. Purchase Entitlement Sync Issues

**Symptoms:**
- Users report successful purchases but missing pro features
- Discrepancies between RevenueCat and internal entitlements
- `user_mapping_mismatch` errors in logs

**Immediate Actions:**
1. **Check recent entitlement updates:**
   ```sql
   SELECT user_id, pro, updated_at 
   FROM user_entitlements 
   WHERE updated_at > now() - interval '1 hour'
   ORDER BY updated_at DESC;
   ```

2. **Verify user mapping integrity:**
   ```sql
   SELECT COUNT(*) as total_mappings FROM rc_user_map;
   SELECT COUNT(DISTINCT user_id) as unique_users FROM rc_user_map;
   ```

**Resolution Steps:**
1. **Manual entitlement sync for affected user:**
   ```sql
   -- Query RevenueCat API for user's current entitlements
   -- Compare with internal user_entitlements table
   -- Manual UPDATE if discrepancy found
   UPDATE user_entitlements 
   SET pro = true, updated_at = now() 
   WHERE user_id = 'affected_user_id';
   ```

2. **Validate webhook event processing:**
   - Check audit_purchases for missing transactions
   - Review webhook payload structure changes
   - Verify event type handling (INITIAL_PURCHASE, RENEWAL, etc.)

3. **Bulk reconciliation if needed:**
   ```bash
   # Export RevenueCat subscriber data
   # Compare with internal entitlements
   # Generate reconciliation report
   ```

**Escalation:** For widespread entitlement issues, coordinate with customer support team.

### 4. Database Connection Errors

**Symptoms:**
- 500 responses with database connection errors
- `user_mapping_error` or similar error codes
- Supabase connection limit alerts

**Immediate Actions:**
1. **Check Supabase dashboard:**
   - Monitor active connections
   - Review error logs in Supabase logs section

2. **Restart Edge Function if needed:**
   ```bash
   # Redeploy Edge Function to reset connections
   supabase functions deploy revenuecat-webhook
   ```

**Resolution Steps:**
1. **Optimize connection usage:**
   - Review connection pooling configuration
   - Ensure connections are properly closed
   - Consider connection limits per function instance

2. **Scale database if needed:**
   - Upgrade Supabase plan for more connections
   - Review and optimize long-running queries

**Prevention:** Implement connection monitoring and alerts.

## Monitoring & Alerting

### Key Metrics to Monitor
1. **Error Rate**: `error_rate_percent` from `v_fn_errors_daily`
2. **Latency**: `p95_latency_ms` from `v_slo_violations_15min`  
3. **Volume**: Request count per hour
4. **HMAC Failures**: Signature validation error rate

### Alert Thresholds
- **Critical**: Error rate > 5% for 15+ minutes
- **Warning**: p95 latency > 500ms for 30+ minutes
- **Info**: HMAC failure rate > 2% per hour

### Dashboard Queries
```sql
-- Real-time webhook health
SELECT 
  date_trunc('hour', timestamp) as hour,
  count(*) as total_requests,
  count(*) filter (where status_code >= 400) as errors,
  round(avg(duration_ms), 2) as avg_latency_ms,
  round(percentile_cont(0.95) within group (order by duration_ms), 2) as p95_latency_ms
FROM function_metrics 
WHERE function_name = 'revenuecat-webhook'
AND timestamp > now() - interval '24 hours'
GROUP BY 1 ORDER BY 1 DESC;

-- SLO violation tracking
SELECT * FROM v_slo_violations_15min 
WHERE slo_tag = 'webhook' 
AND window_start > now() - interval '4 hours'
ORDER BY window_start DESC;
```

## Emergency Procedures

### Complete Webhook Outage
1. **Immediate Response:**
   - Enable maintenance mode in RevenueCat (pause webhooks)
   - Notify users via in-app message about purchase delays
   - Activate manual purchase processing if available

2. **Recovery:**
   - Fix underlying issue (database, code, infrastructure)
   - Test webhook processing with RevenueCat sandbox
   - Re-enable webhooks gradually (test → production)

3. **Post-Recovery:**
   - Process backlog of webhook events
   - Reconcile any missed entitlements
   - Update incident timeline for post-mortem

### Kill Switch Activation
If webhook processing is causing system instability:

1. **Disable webhook in RevenueCat dashboard**
2. **Activate feature flag kill switch:**
   ```sql
   UPDATE store_config 
   SET value = '{"on": false}' 
   WHERE key = 'paywall_enabled';
   ```
3. **Monitor system recovery**
4. **Plan controlled re-enablement**

## Contact Information

### Escalation Chain
1. **On-Call Engineer** (Primary)
2. **Platform Team Lead** (Secondary) 
3. **CTO** (Executive escalation)

### External Contacts
- **RevenueCat Support**: support@revenuecat.com
- **Supabase Support**: Via dashboard support chat

### Communication Channels
- **Slack**: #incidents channel
- **Status Page**: status.habituals.app
- **Customer Support**: support@habituals.app

## Post-Incident Procedures

### Immediate (Within 1 Hour)
- [ ] Verify full service restoration
- [ ] Update status page with resolution
- [ ] Document incident timeline and impact
- [ ] Notify stakeholders of resolution

### Short Term (Within 24 Hours)
- [ ] Conduct post-mortem meeting
- [ ] Document root cause and contributing factors
- [ ] Create action items for prevention
- [ ] Update monitoring/alerting if needed

### Long Term (Within 1 Week)
- [ ] Implement preventive measures
- [ ] Update runbook based on lessons learned
- [ ] Review and update escalation procedures
- [ ] Share learnings with broader team

## Reference Materials

### Useful Commands
```bash
# Check webhook health endpoint
curl -s "https://[project].supabase.co/functions/v1/revenuecat-webhook?health=1"

# View recent function logs
supabase functions logs revenuecat-webhook --follow

# Test webhook locally
supabase functions serve revenuecat-webhook
```

### Related Documentation
- [RevenueCat Webhook Documentation](https://docs.revenuecat.com/docs/webhooks)
- [Supabase Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [Store Config Management](../packages/data/src/hooks/useStoreConfig.ts)

### Test Payloads
```json
{
  "id": "test-transaction-id",
  "type": "INITIAL_PURCHASE", 
  "app_user_id": "test-user-123",
  "product_id": "pro_month",
  "purchased_at_ms": 1641024000000,
  "store": "APP_STORE"
}
```