# Week 4 Storefront Foundation

## Overview

This implementation provides a complete, ethical, and testable storefront foundation with RevenueCat integration, Supabase Edge Functions, and client-side safety measures.

## Architecture

### Database Schema (`supabase/migrations/20250107_storefront.sql`)

- **`user_entitlements`**: Pro status and cosmetic unlocks
- **`user_wallet_balances`**: Consumable items (streak shields, XP boosters)  
- **`audit_purchases`**: Complete purchase audit trail with idempotency
- **`purchase_claims`**: Tracks claimed consumables to enforce caps
- **Row Level Security (RLS)**: Users can only access their own data

### Edge Functions

#### RevenueCat Webhook (`supabase/functions/revenuecat-webhook/`)
- **Signature verification**: HMAC-SHA256 validation 
- **Idempotent processing**: Uses `tx_id` as primary key
- **Pro subscriptions**: Toggles `user_entitlements.pro` based on status
- **Cosmetics**: Merges into `user_entitlements.cosmetics` JSON
- **Consumables**: Audits only; client claims via separate endpoint

#### Claim Endpoint (`supabase/functions/claim/`)
- **Caps enforcement**: Weekly (1) and monthly (3) limits for streak shields
- **Idempotency**: Same `tx_id` returns identical wallet state
- **XP Boosters**: Extends duration from current end date
- **Server-authoritative**: All limits enforced server-side

### Client Implementation

#### Data Layer (`packages/data/`)
- **Store repository**: Typed API calls with Zod validation
- **React Query hooks**: Caching, optimistic updates, error handling
- **Feature flags**: Server-driven storefront enable/disable
- **Error mapping**: Specific error codes for different failure modes

#### Mobile App (`apps/mobile/`)
- **RevenueCat integration**: Full SDK with offerings, purchases, restore
- **Paywall screen**: Monthly/annual plans with trial messaging
- **Store screen**: Grid layout for consumables, cosmetics, bundles
- **Network safety**: Blocks purchases when offline
- **Cap display**: Shows remaining weekly/monthly limits

## Products Configured

1. **`pro_month`/`pro_year`**: Subscription entitlements
2. **`consumable_streakshield_1`**: Protects streak (1/week, 3/month)
3. **`consumable_xp_booster_7d`**: 7-day XP multiplier
4. **`cos_theme_teal_nebula`**: Cosmetic theme unlock
5. **`bundle_starter_pack`**: Value bundle with multiple items

## Safety & Ethics

### Non-Negotiables Met
- ✅ **RevenueCat only**: No direct store API calls
- ✅ **Server-authoritative**: All fulfillment via webhook
- ✅ **Idempotent operations**: Retries safe, no double-crediting
- ✅ **Caps enforced**: Server-side limits, not client-side
- ✅ **Conflict resolution**: Handles refunds, cancellations gracefully

### Privacy & Ethics
- ✅ **No PII analytics**: Only purchase success/failure events
- ✅ **Transparent pricing**: Localized prices via RevenueCat
- ✅ **Easy cancellation**: Direct links to App Store/Play Store
- ✅ **Clear legal copy**: Minimal, truthful subscription terms

## Testing Coverage

### Unit Tests
- **Webhook parsing**: Event routing and idempotent upserts
- **Claim endpoint**: Cap enforcement and wallet updates  
- **Repository layer**: API calls and error mapping
- **React hooks**: Query caching and mutation side effects

### Integration Points
- **RevenueCat → Webhook**: Purchase events trigger fulfillment
- **Mobile → Claim endpoint**: Consumable purchases increment wallet
- **Offline detection**: Network-aware purchase blocking
- **Feature flags**: Storefront visibility toggle

## Deployment

### Environment Variables
```bash
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# RevenueCat  
REVENUECAT_WEBHOOK_SECRET=your_webhook_secret
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=your_ios_key
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=your_android_key
```

### Deploy Commands
```bash
# Database migration
supabase db push

# Edge Functions
supabase functions deploy revenuecat-webhook
supabase functions deploy claim

# Mobile app (requires Expo dev build for RevenueCat)
expo prebuild
expo run:ios / expo run:android
```

## Client Flow Examples

### Pro Subscription Purchase
1. User taps "Start Free Trial" → RevenueCat handles purchase
2. RevenueCat webhook → Updates `user_entitlements.pro = true`  
3. Client polls → Shows Pro features unlocked
4. Achievement toast → "Welcome to Pro!"

### Consumable Purchase (Streak Shield)
1. User taps "Buy" → RevenueCat purchase completes
2. RevenueCat webhook → Records in `audit_purchases`
3. Client calls claim endpoint with `tx_id`
4. Server checks caps → Increments `streakshield_count`
5. Client shows wallet update + achievement toast

### Offline Protection
1. Network goes down → `useNetworkSafety` detects
2. Purchase buttons show "No Connection" → Prevent transactions
3. Network returns → Buttons re-enable automatically

## Feature Flags

The storefront is **disabled by default** for production safety:

```typescript
{
  storefront_enabled: false,  // Off for non-testers
  paywall_enabled: false,
  consumables_enabled: false, 
  cosmetics_enabled: false
}
```

Development environments automatically enable all flags for testing.

## Success Criteria Met

✅ **Sandbox Purchase**: iOS/Android subscription toggles Pro status  
✅ **Consumable Claiming**: Credits applied with server-side caps  
✅ **Idempotent Operations**: Multiple webhook calls safe
✅ **Conflict Handling**: Refunds/cancellations processed correctly  
✅ **Clean Tests**: All unit and integration tests passing
✅ **Type Safety**: Full TypeScript coverage, no lint errors
✅ **Feature Flag Gating**: Storefront hidden by default

## Next Steps (Week 5+)

- **A/B Testing**: Pricing experiments and conversion optimization
- **Analytics**: Funnel metrics (respecting privacy constraints)
- **Web Paywall**: Stripe integration for web platform
- **Advanced Cosmetics**: Theme system expansion  
- **Seasonal Content**: Limited-time offers and special events

---

This implementation provides a solid, ethical foundation for monetization while maintaining strict privacy standards and technical reliability.