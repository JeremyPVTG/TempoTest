import { http, HttpResponse } from 'msw'
import type { UserEntitlement, UserWallet } from '../../repositories/storeRepo'

// Mock data store
const mockEntitlements: Record<string, UserEntitlement> = {
  'test-user-1': { user_id: 'test-user-1', pro: true, cosmetics: { teal_nebula: true }, updated_at: new Date().toISOString() },
  'test-user-2': { user_id: 'test-user-2', pro: false, cosmetics: {}, updated_at: new Date().toISOString() }
}

const mockWallets: Record<string, UserWallet> = {
  'test-user-1': { user_id: 'test-user-1', streakshield_count: 2, xp_booster_until: null, updated_at: new Date().toISOString() },
  'test-user-2': { user_id: 'test-user-2', streakshield_count: 0, xp_booster_until: null, updated_at: new Date().toISOString() }
}

const mockStoreConfig = {
  storefront_enabled: { on: true },
  paywall_enabled: { on: true },
  sku_enabled: {
    pro_month: true,
    pro_year: true,
    consumable_streakshield_1: true,
    consumable_xp_booster_7d: true,
    cos_theme_teal_nebula: true,
    bundle_starter_pack: true
  }
}

// Mock purchase claims for idempotency testing
const claimedTransactions = new Set<string>()

// Mock caps tracking
const capsTracker: Record<string, { week: number; month: number }> = {}

function getTestUserId(request: Request): string {
  return request.headers.get('x-test-user') || 'test-user-1'
}

function simulateClaimCaps(userId: string, sku: string): { weekCount: number; monthCount: number } {
  if (sku !== 'consumable_streakshield_1') return { weekCount: 0, monthCount: 0 }
  
  const key = `${userId}:${sku}`
  if (!capsTracker[key]) {
    capsTracker[key] = { week: 0, month: 0 }
  }
  return { weekCount: capsTracker[key].week, monthCount: capsTracker[key].month }
}

export const storefrontHandlers = [
  // Get user entitlements
  http.get('*/rest/v1/user_entitlements', ({ request }) => {
    const userId = getTestUserId(request)
    const entitlements = mockEntitlements[userId]
    
    if (!entitlements) {
      return HttpResponse.json({ data: null, error: null })
    }
    
    return HttpResponse.json({ data: entitlements, error: null })
  }),

  // Get user wallet balances
  http.get('*/rest/v1/user_wallet_balances', ({ request }) => {
    const userId = getTestUserId(request)
    const wallet = mockWallets[userId]
    
    if (!wallet) {
      return HttpResponse.json({ data: null, error: null })
    }
    
    return HttpResponse.json({ data: wallet, error: null })
  }),

  // Get store config (feature flags)
  http.get('*/rest/v1/store_config', () => {
    const configRows = Object.entries(mockStoreConfig).map(([key, value]) => ({
      key,
      value
    }))
    
    return HttpResponse.json({ data: configRows, error: null })
  }),

  // Claim purchase endpoint  
  http.post('*/functions/v1/claim', async ({ request }) => {
    const userId = getTestUserId(request)
    const body = await request.json() as { sku: string; tx_id: string }
    
    // Idempotency check
    if (claimedTransactions.has(body.tx_id)) {
      const wallet = mockWallets[userId] || mockWallets['test-user-1']
      return HttpResponse.json(wallet)
    }
    
    // Simulate caps enforcement for streak shields
    if (body.sku === 'consumable_streakshield_1') {
      const caps = simulateClaimCaps(userId, body.sku)
      
      if (caps.weekCount >= 1 || caps.monthCount >= 3) {
        return HttpResponse.text('cap exceeded', { status: 409 })
      }
      
      // Update caps
      const key = `${userId}:${body.sku}`
      if (!capsTracker[key]) {
        capsTracker[key] = { week: 0, month: 0 }
      }
      capsTracker[key].week += 1
      capsTracker[key].month += 1
      
      // Update mock wallet
      if (!mockWallets[userId]) {
        mockWallets[userId] = { 
          user_id: userId, 
          streakshield_count: 0, 
          xp_booster_until: null, 
          updated_at: new Date().toISOString() 
        }
      }
      mockWallets[userId].streakshield_count += 1
      mockWallets[userId].updated_at = new Date().toISOString()
    }
    
    // Handle XP booster
    if (body.sku === 'consumable_xp_booster_7d') {
      if (!mockWallets[userId]) {
        mockWallets[userId] = { 
          user_id: userId, 
          streakshield_count: 0, 
          xp_booster_until: null, 
          updated_at: new Date().toISOString() 
        }
      }
      
      const now = new Date()
      const currentEnd = mockWallets[userId].xp_booster_until ? new Date(mockWallets[userId].xp_booster_until) : now
      const newEnd = new Date(Math.max(now.getTime(), currentEnd.getTime()) + 7 * 24 * 60 * 60 * 1000)
      
      mockWallets[userId].xp_booster_until = newEnd.toISOString()
      mockWallets[userId].updated_at = new Date().toISOString()
    }
    
    // Mark transaction as claimed
    claimedTransactions.add(body.tx_id)
    
    return HttpResponse.json(mockWallets[userId] || mockWallets['test-user-1'])
  }),

  // RevenueCat webhook (for testing webhook flow)
  http.post('*/functions/v1/revenuecat-webhook', async ({ request }) => {
    const signature = request.headers.get('X-RevenueCat-Signature')
    
    // Simple signature validation for testing
    if (!signature || signature !== 'test-signature') {
      return HttpResponse.text('invalid signature', { status: 401 })
    }
    
    const event = await request.json() as any
    console.log('[MSW] RevenueCat webhook received:', event)
    
    // Simulate webhook processing
    if (event.type === 'INITIAL_PURCHASE' && event.product_id?.includes('pro_')) {
      const userId = event.app_user_id || 'test-user-1'
      if (!mockEntitlements[userId]) {
        mockEntitlements[userId] = { 
          user_id: userId, 
          pro: false, 
          cosmetics: {}, 
          updated_at: new Date().toISOString() 
        }
      }
      mockEntitlements[userId].pro = true
      mockEntitlements[userId].updated_at = new Date().toISOString()
    }
    
    return HttpResponse.text('ok', { status: 200 })
  })
]

// Test utilities
export const mockStorefront = {
  setUserPro: (userId: string, isPro: boolean) => {
    if (!mockEntitlements[userId]) {
      mockEntitlements[userId] = { user_id: userId, pro: false, cosmetics: {}, updated_at: new Date().toISOString() }
    }
    mockEntitlements[userId].pro = isPro
    mockEntitlements[userId].updated_at = new Date().toISOString()
  },
  
  setWalletBalance: (userId: string, streakshield: number, xpBooster?: string) => {
    if (!mockWallets[userId]) {
      mockWallets[userId] = { user_id: userId, streakshield_count: 0, xp_booster_until: null, updated_at: new Date().toISOString() }
    }
    mockWallets[userId].streakshield_count = streakshield
    mockWallets[userId].xp_booster_until = xpBooster || null
    mockWallets[userId].updated_at = new Date().toISOString()
  },
  
  resetClaims: () => {
    claimedTransactions.clear()
    Object.keys(capsTracker).forEach(key => delete capsTracker[key])
  },
  
  setStoreConfig: (key: string, value: unknown) => {
    (mockStoreConfig as any)[key] = value
  }
}