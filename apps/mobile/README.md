# Habituals Mobile (Expo SDK 53)

Production-safe Expo mobile app with strict dependency injection to `@habituals/data`, AsyncStorage offline queue, expo-router navigation, and RevenueCat integration.

## Architecture

- **Framework**: Expo SDK 53 with React Native 0.76.1
- **Routing**: expo-router with typed routes
- **Data Layer**: `@habituals/data` via dependency injection
- **Offline Storage**: AsyncStorage-backed queue
- **Payments**: RevenueCat SDK for subscriptions and consumables
- **State Management**: React Query for server state
- **TypeScript**: Strict mode, no `any` types in core

## Quick Start

```bash
# Install dependencies
pnpm -w install

# Copy environment template
cp apps/mobile/.env.example apps/mobile/.env

# Fill in environment variables:
# EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
# EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
# EXPO_PUBLIC_RC_API_KEY_IOS=your_revenuecat_ios_key
# EXPO_PUBLIC_RC_API_KEY_ANDROID=your_revenuecat_android_key

# Start development server
pnpm -C apps/mobile dev
```

## Project Structure

```
apps/mobile/
├── app/                     # expo-router screens
│   ├── _layout.tsx         # Root layout with providers
│   ├── index.tsx           # Home screen (habits list)
│   ├── paywall.tsx         # Pro subscription screen
│   └── store.tsx           # Consumables store
├── src/
│   ├── providers/          # React providers
│   │   ├── Query.tsx       # React Query provider
│   │   └── SyncBoundary.tsx # Offline sync boundary
│   ├── lib/                # Core utilities
│   │   ├── supabase.ts     # Supabase client with DI
│   │   ├── queue.ts        # AsyncStorage queue
│   │   └── data.ts         # Data layer exports (Q, M)
│   ├── hooks/              # Custom hooks
│   │   └── useStorefront.ts # RevenueCat integration
│   └── srcish/             # Re-exports for compatibility
│       └── queue.ts
└── app.config.ts           # Expo configuration
```

## Features

### Screens

- **Home** (`/`): Habits list with offline mark-done functionality
- **Paywall** (`/paywall`): Pro subscription offerings and management
- **Store** (`/store`): Consumable purchases (Streak Shield, XP Booster, Themes)

### Offline Support

- AsyncStorage-backed operation queue
- Automatic sync when connectivity returns
- Optimistic updates for habits

### RevenueCat Integration

- Platform-specific API key selection
- Offerings and entitlements management
- Purchase and restore functionality
- Pro status tracking

## Development

### Running Tests

```bash
# Run all tests
pnpm -w test

# Run mobile tests only
pnpm -C apps/mobile test

# Run data layer tests (includes AsyncStorage driver)
pnpm -C packages/data test
```

### TypeScript

```bash
# Type check
pnpm -C apps/mobile typecheck
```

### Linting

```bash
# Lint code
pnpm -C apps/mobile lint
```

## Building

### Development Build

```bash
# Prebuild for development
pnpm -C apps/mobile prebuild

# Run on iOS
pnpm -C apps/mobile ios

# Run on Android
pnpm -C apps/mobile android
```

### Production Build

For production builds, use EAS Build:

```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Configure EAS
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

## Configuration

### Environment Variables

All environment variables must be prefixed with `EXPO_PUBLIC_` to be accessible in the app:

- `EXPO_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous/public key
- `EXPO_PUBLIC_RC_API_KEY_IOS`: RevenueCat iOS API key
- `EXPO_PUBLIC_RC_API_KEY_ANDROID`: RevenueCat Android API key

### RevenueCat Setup

1. Create a RevenueCat account and project
2. Configure your iOS and Android apps
3. Set up your products and offerings
4. Add your API keys to `.env`

**Note**: When mobile authentication is implemented, call:
```typescript
Purchases.configure({ apiKey, appUserID: stableUserId });
```

On logout:
```typescript
Purchases.logOut();
```

## Testing

### Unit Tests

- `AsyncStorageDriver`: Storage operations with error handling
- `useStorefront`: RevenueCat integration with mocked SDK

### Integration Testing

Manual testing checklist:

- [ ] Home screen loads habits from `@habituals/data`
- [ ] Mark done works offline and syncs when online
- [ ] Paywall shows offerings and handles purchases
- [ ] Store displays consumables and processes purchases
- [ ] Navigation works correctly between screens
- [ ] Pro status updates after purchase/restore

## Monorepo Integration

The mobile app integrates with the workspace packages:

- `@habituals/data`: Data layer with repositories and hooks
- `@habituals/domain`: Domain utilities (e.g., `occurredAt`)

Metro configuration handles monorepo symlink resolution automatically.

## Production Considerations

1. **App User ID**: Set stable user ID for RevenueCat when auth is implemented
2. **Error Handling**: All RevenueCat operations include error boundaries
3. **Offline Resilience**: Queue persists operations until connectivity returns
4. **Type Safety**: Strict TypeScript prevents runtime type errors
5. **Performance**: React Query optimizes data fetching and caching