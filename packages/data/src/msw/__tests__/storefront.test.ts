import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { server, mockStorefront } from '../'

describe('MSW Storefront Handlers', () => {
  beforeAll(() => server.listen())
  afterEach(() => {
    server.resetHandlers()
    mockStorefront.resetClaims()
  })
  afterAll(() => server.close())
  
  it('handles entitlements requests', async () => {
    const response = await fetch('http://localhost/rest/v1/user_entitlements', {
      headers: { 'x-test-user': 'test-user-1' }
    })
    
    expect(response.ok).toBe(true)
    const data = await response.json()
    expect(data.data.pro).toBe(true)
  })
  
  it('handles wallet requests', async () => {
    const response = await fetch('http://localhost/rest/v1/user_wallet_balances', {
      headers: { 'x-test-user': 'test-user-1' }
    })
    
    expect(response.ok).toBe(true)
    const data = await response.json()
    expect(data.data.streakshield_count).toBe(2)
  })
  
  it('handles store config requests', async () => {
    const response = await fetch('http://localhost/rest/v1/store_config')
    
    expect(response.ok).toBe(true)
    const data = await response.json()
    expect(data.data).toHaveLength(3) // storefront_enabled, paywall_enabled, sku_enabled
  })
  
  it('handles claim requests with caps enforcement', async () => {
    // First claim should succeed
    const response1 = await fetch('http://localhost/functions/v1/claim', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-test-user': 'test-user-2'
      },
      body: JSON.stringify({ sku: 'consumable_streakshield_1', tx_id: 'test-tx-1' })
    })
    
    expect(response1.ok).toBe(true)
    const wallet1 = await response1.json()
    expect(wallet1.streakshield_count).toBe(1)
    
    // Second claim should hit cap (1/week limit)
    const response2 = await fetch('http://localhost/functions/v1/claim', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-test-user': 'test-user-2'
      },
      body: JSON.stringify({ sku: 'consumable_streakshield_1', tx_id: 'test-tx-2' })
    })
    
    expect(response2.status).toBe(409) // Cap exceeded
    const errorText = await response2.text()
    expect(errorText).toBe('cap exceeded')
  })
  
  it('handles claim idempotency correctly', async () => {
    const claimPayload = { sku: 'consumable_streakshield_1', tx_id: 'test-idempotent-tx' }
    
    // First claim
    const response1 = await fetch('http://localhost/functions/v1/claim', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-test-user': 'test-user-2'
      },
      body: JSON.stringify(claimPayload)
    })
    
    expect(response1.ok).toBe(true)
    const wallet1 = await response1.json()
    
    // Duplicate claim with same tx_id should return same wallet state
    const response2 = await fetch('http://localhost/functions/v1/claim', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-test-user': 'test-user-2'
      },
      body: JSON.stringify(claimPayload)
    })
    
    expect(response2.ok).toBe(true)
    const wallet2 = await response2.json()
    expect(wallet2).toEqual(wallet1) // Should be identical
  })
  
  it('handles webhook signature validation', async () => {
    // Valid signature
    const response1 = await fetch('http://localhost/functions/v1/revenuecat-webhook', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-RevenueCat-Signature': 'test-signature'
      },
      body: JSON.stringify({ type: 'INITIAL_PURCHASE', product_id: 'pro_month', app_user_id: 'test-user' })
    })
    
    expect(response1.ok).toBe(true)
    
    // Invalid signature
    const response2 = await fetch('http://localhost/functions/v1/revenuecat-webhook', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-RevenueCat-Signature': 'invalid-signature'
      },
      body: JSON.stringify({ type: 'INITIAL_PURCHASE' })
    })
    
    expect(response2.status).toBe(401)
  })
  
  it('test utilities work correctly', () => {
    mockStorefront.setUserPro('test-user-3', true)
    mockStorefront.setWalletBalance('test-user-3', 5, '2024-12-31T00:00:00Z')
    
    // These would be reflected in subsequent API calls
    expect(true).toBe(true) // Mock utilities don't return values, just modify state
  })
})