// Analytics wrapper with strict no-PII policy
// Only tracks behavioral events, never user data, emails, or identifiers

export type AnalyticsEvent = 
  | 'paywall_view'
  | 'purchase_attempt'
  | 'purchase_success'  
  | 'purchase_failure'
  | 'claim_success'
  | 'claim_failure'
  | 'claim_cap_exceeded'
  | 'restore_attempt'
  | 'restore_success'
  | 'feature_gate_hit'

export interface AnalyticsEventData {
  event: AnalyticsEvent
  sku?: string
  platform?: 'ios' | 'android' | 'web'
  error_code?: string
  timestamp: string
}

// Abstract analytics provider interface
export interface AnalyticsProvider {
  track(event: AnalyticsEvent, data: Omit<AnalyticsEventData, 'event' | 'timestamp'>): void
}

// Default no-op provider (safe fallback)
class NoOpProvider implements AnalyticsProvider {
  track(): void {
    // No-op for privacy-first default
  }
}

// Console provider for development
class ConsoleProvider implements AnalyticsProvider {
  track(event: AnalyticsEvent, data: Omit<AnalyticsEventData, 'event' | 'timestamp'>): void {
    console.log('[Analytics]', event, { ...data, timestamp: new Date().toISOString() })
  }
}

// Global analytics instance
let analyticsProvider: AnalyticsProvider = new NoOpProvider()

// Configuration
export function setAnalyticsProvider(provider: AnalyticsProvider): void {
  analyticsProvider = provider
}

export function enableConsoleAnalytics(): void {
  analyticsProvider = new ConsoleProvider()
}

// Core tracking function (no PII allowed)
export function track(event: AnalyticsEvent, data: Omit<AnalyticsEventData, 'event' | 'timestamp'> = {}): void {
  // Strict PII validation - reject any suspicious data
  const sanitizedData = sanitizeEventData(data)
  
  try {
    analyticsProvider.track(event, sanitizedData)
  } catch (error) {
    console.warn('[Analytics] Failed to track event:', event, error)
  }
}

// PII sanitization - remove any potentially identifying information
function sanitizeEventData(data: Omit<AnalyticsEventData, 'event' | 'timestamp'>): Omit<AnalyticsEventData, 'event' | 'timestamp'> {
  const sanitized: Omit<AnalyticsEventData, 'event' | 'timestamp'> = {}
  
  // Only allow specific whitelisted fields
  if (data.sku && typeof data.sku === 'string' && isValidSku(data.sku)) {
    sanitized.sku = data.sku
  }
  
  if (data.platform && ['ios', 'android', 'web'].includes(data.platform)) {
    sanitized.platform = data.platform
  }
  
  if (data.error_code && typeof data.error_code === 'string' && isValidErrorCode(data.error_code)) {
    sanitized.error_code = data.error_code
  }
  
  return sanitized
}

function isValidSku(sku: string): boolean {
  // Only allow known SKU patterns (no user data)
  const validSkus = [
    'pro_month',
    'pro_year',
    'consumable_streakshield_1',
    'consumable_xp_booster_7d',
    'cos_theme_teal_nebula',
    'bundle_starter_pack'
  ]
  return validSkus.includes(sku)
}

function isValidErrorCode(code: string): boolean {
  // Only allow known error codes (no user data)
  return code.startsWith('E.') && code.length < 50
}

// Convenience functions for common events
export const analytics = {
  paywall: {
    view: (sku?: string) => track('paywall_view', { sku }),
  },
  
  purchase: {
    attempt: (sku: string, platform?: 'ios' | 'android' | 'web') => 
      track('purchase_attempt', { sku, platform }),
    success: (sku: string, platform?: 'ios' | 'android' | 'web') => 
      track('purchase_success', { sku, platform }),
    failure: (sku: string, errorCode?: string, platform?: 'ios' | 'android' | 'web') => 
      track('purchase_failure', { sku, error_code: errorCode, platform }),
  },
  
  claim: {
    success: (sku: string) => track('claim_success', { sku }),
    failure: (sku: string, errorCode?: string) => track('claim_failure', { sku, error_code: errorCode }),
    capExceeded: (sku: string) => track('claim_cap_exceeded', { sku }),
  },
  
  restore: {
    attempt: () => track('restore_attempt'),
    success: () => track('restore_success'),
  },
  
  gate: {
    hit: () => track('feature_gate_hit'),
  }
}

// Development utilities
export function getAnalyticsProvider(): AnalyticsProvider {
  return analyticsProvider
}