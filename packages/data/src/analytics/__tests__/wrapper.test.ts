import { describe, it, expect, vi, beforeEach } from 'vitest'
import { track, analytics, setAnalyticsProvider, enableConsoleAnalytics, type AnalyticsProvider } from '../wrapper'

describe('Analytics Wrapper', () => {
  let mockProvider: AnalyticsProvider
  
  beforeEach(() => {
    mockProvider = {
      track: vi.fn()
    }
    setAnalyticsProvider(mockProvider)
  })
  
  it('tracks events with sanitized data', () => {
    track('purchase_success', { sku: 'pro_month', platform: 'ios' })
    
    expect(mockProvider.track).toHaveBeenCalledWith('purchase_success', {
      sku: 'pro_month',
      platform: 'ios'
    })
  })
  
  it('sanitizes invalid SKUs', () => {
    // Try to track with potentially malicious SKU
    track('purchase_success', { sku: 'user@email.com', platform: 'ios' })
    
    expect(mockProvider.track).toHaveBeenCalledWith('purchase_success', {
      platform: 'ios'
      // sku should be filtered out
    })
  })
  
  it('sanitizes invalid platforms', () => {
    track('purchase_success', { sku: 'pro_month', platform: 'malicious' as any })
    
    expect(mockProvider.track).toHaveBeenCalledWith('purchase_success', {
      sku: 'pro_month'
      // platform should be filtered out
    })
  })
  
  it('only allows valid error codes', () => {
    track('purchase_failure', { 
      sku: 'pro_month', 
      error_code: 'E.VALIDATION_FAILED' 
    })
    
    expect(mockProvider.track).toHaveBeenCalledWith('purchase_failure', {
      sku: 'pro_month',
      error_code: 'E.VALIDATION_FAILED'
    })
  })
  
  it('filters out long/invalid error codes', () => {
    track('purchase_failure', { 
      sku: 'pro_month', 
      error_code: 'this-is-a-very-long-error-code-that-might-contain-sensitive-data'
    })
    
    expect(mockProvider.track).toHaveBeenCalledWith('purchase_failure', {
      sku: 'pro_month'
      // error_code should be filtered out
    })
  })
  
  it('convenience methods work correctly', () => {
    analytics.paywall.view('pro_month')
    analytics.purchase.success('pro_month', 'ios')
    analytics.claim.capExceeded('consumable_streakshield_1')
    
    expect(mockProvider.track).toHaveBeenCalledTimes(3)
    expect(mockProvider.track).toHaveBeenNthCalledWith(1, 'paywall_view', expect.objectContaining({ sku: 'pro_month' }))
    expect(mockProvider.track).toHaveBeenNthCalledWith(2, 'purchase_success', expect.objectContaining({ sku: 'pro_month', platform: 'ios' }))
    expect(mockProvider.track).toHaveBeenNthCalledWith(3, 'claim_cap_exceeded', expect.objectContaining({ sku: 'consumable_streakshield_1' }))
  })
  
  it('handles provider errors gracefully', () => {
    const faultyProvider: AnalyticsProvider = {
      track: () => { throw new Error('Provider failed') }
    }
    setAnalyticsProvider(faultyProvider)
    
    // Should not throw
    expect(() => {
      track('purchase_success', { sku: 'pro_month' })
    }).not.toThrow()
  })
  
  it('console provider logs to console', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    
    enableConsoleAnalytics()
    track('purchase_success', { sku: 'pro_month' })
    
    expect(consoleSpy).toHaveBeenCalledWith('[Analytics]', 'purchase_success', expect.any(Object))
    
    consoleSpy.mockRestore()
  })
})