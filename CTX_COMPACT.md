# Expo Mobile App Scaffold (SDK 53) - Context Map

## Overview
Creating production-safe Expo (SDK 53) mobile app with strict DI to @habituals/data, AsyncStorage offline queue, expo-router screens, and RevenueCat integration.

## Files to Create/Modify

### Core Mobile App Structure
- `apps/mobile/package.json` - Expo SDK 53 deps, scripts
- `apps/mobile/app.config.ts` - Expo config with typed routes, RevenueCat plugin
- `apps/mobile/tsconfig.json` - Strict TS with workspace paths
- `apps/mobile/babel.config.js` - Expo preset + router plugin
- `apps/mobile/metro.config.js` - Monorepo resolver with symlinks
- `apps/mobile/.env.example` - Environment template

### Expo Router Screens
- `apps/mobile/app/_layout.tsx` - Root layout with providers
- `apps/mobile/app/index.tsx` - Home screen with habits list
- `apps/mobile/app/paywall.tsx` - Pro subscription screen
- `apps/mobile/app/store.tsx` - Consumables store

### Providers & Data Layer
- `apps/mobile/src/providers/Query.tsx` - React Query provider
- `apps/mobile/src/providers/SyncBoundary.tsx` - Offline sync boundary
- `apps/mobile/src/lib/supabase.ts` - Supabase client DI
- `apps/mobile/src/lib/queue.ts` - AsyncStorage queue instance
- `apps/mobile/src/lib/data.ts` - Data layer exports (Q, M)
- `apps/mobile/src/srcish/queue.ts` - Queue re-export

### Hooks & Storage
- `apps/mobile/src/hooks/useStorefront.ts` - RevenueCat hook
- `packages/data/src/offlineQueue/storage/asyncStorageDriver.ts` - Shared storage driver

### Tests
- `packages/data/src/offlineQueue/storage/__tests__/asyncStorageDriver.test.ts` - Storage driver tests
- `apps/mobile/src/hooks/__tests__/useStorefront.test.ts` - RevenueCat hook tests
- `apps/mobile/vitest.config.ts` - Test configuration

### Documentation
- `apps/mobile/README.md` - Setup and usage guide

## Environment Variables Used
```bash
EXPO_PUBLIC_SUPABASE_URL - Supabase project URL
EXPO_PUBLIC_SUPABASE_ANON_KEY - Supabase anonymous key  
EXPO_PUBLIC_RC_API_KEY_IOS - RevenueCat iOS API key
EXPO_PUBLIC_RC_API_KEY_ANDROID - RevenueCat Android API key
```

## High-Risk Areas
1. **Metro Configuration**: Monorepo symlink resolution for workspace packages
2. **AsyncStorage Driver**: JSON parse safety and error handling
3. **RevenueCat Integration**: Platform-specific API keys and entitlement handling
4. **Offline Queue**: Proper error boundary and sync logic
5. **TypeScript Strictness**: No `any` types in core functionality

## Test Plan
### Unit Tests
- AsyncStorageDriver: read/write/clear operations, JSON parse error handling
- useStorefront hook: offerings load, purchase/restore flows with mocks

### Integration Tests
- Home screen: habits list via @habituals/data, offline mark done → online sync
- Paywall screen: offerings display, purchase/restore functionality
- Store screen: consumables display and purchase flows

### Manual Testing
- Offline/online state changes trigger queue drain
- RevenueCat sandbox purchase flows work end-to-end
- Navigation between screens maintains state

## Dependencies Added
- `expo-router ~3.5.18` - File-based routing
- `@react-native-async-storage/async-storage ^1.21.0` - Offline storage
- `react-native-purchases ^7.21.1` - RevenueCat SDK
- `@rnx-kit/metro-resolver-symlinks ^1.0.34` - Monorepo resolution

## Success Criteria
- ✅ All workspace tests pass (no regressions)
- ✅ Strict TypeScript compilation (no `any` in core)
- ✅ Offline queue persists and syncs when online
- ✅ RevenueCat integration handles purchase/restore flows
- ✅ expo-router screens navigate correctly
- ✅ @habituals/data integration via proper DI