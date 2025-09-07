import '@testing-library/jest-dom/vitest'

// Lightweight RN/Web mocks for jsdom testing
vi.mock('react-native-reanimated', () => ({}), { virtual: true })
vi.mock('expo-linking', () => ({ createURL: (p: string = '') => 'app://' + p }), { virtual: true })
vi.mock('expo-constants', () => ({ default: { expoConfig: {} } }), { virtual: true })

// No-op for PostHog or analytics direct imports if any
vi.mock('posthog-js', () => ({ init: vi.fn(), capture: vi.fn(), identify: vi.fn() }), { virtual: true })
