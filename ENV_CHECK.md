# Environment Variable Requirements

## Overview
This document defines all required environment variables for Habituals deployment across different environments.

## Client Applications (Web & Mobile)

### Required Variables
- `VITE_SUPABASE_URL` - Supabase project URL (e.g., https://abc123.supabase.co)
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous/public key for client access
- `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` - RevenueCat iOS API key (mobile only)
- `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY` - RevenueCat Android API key (mobile only)

### Environment Examples
```bash
# Development
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGc...

# Production  
VITE_SUPABASE_URL=https://habituals-prod.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGc...
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=appl_abc123
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=goog_xyz789
```

## Edge Functions (Supabase)

### Required Variables
- `SUPABASE_URL` - Supabase project URL (same as client but for server context)
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (bypasses RLS)
- `REVENUECAT_WEBHOOK_SECRET` - RevenueCat webhook HMAC secret for signature verification

### Environment Examples
```bash
# Production Edge Functions
SUPABASE_URL=https://habituals-prod.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ0eXAiOiJKV1QiLCJhbGc...
REVENUECAT_WEBHOOK_SECRET=rcat_webhook_secret_prod_abc123
```

## Validation

The application includes runtime validation that will:
- Log warnings for missing non-critical variables
- Continue operation with degraded functionality when possible
- Never crash in production due to missing env vars

## Security Notes

- Service role keys have full database access - secure accordingly
- RevenueCat secrets enable HMAC webhook verification - rotate regularly  
- All secrets should be unique per environment (dev/staging/prod)
- Use your deployment platform's secure secret management (Vercel, Railway, etc.)

## Deployment Checklist

- [ ] All required variables present for target environment
- [ ] Service role key has correct permissions
- [ ] RevenueCat webhook URL configured with matching secret
- [ ] Client keys match Supabase project configuration
- [ ] Mobile RevenueCat keys match app store configuration