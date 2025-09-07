import { http, HttpResponse } from 'msw'
import type { RCEvent } from '../types'

export const refundHandlers = [
  // RevenueCat webhook refund simulation
  http.post('*/functions/v1/revenuecat-webhook', async ({ request }) => {
    const body = await request.text()
    
    try {
      const event: RCEvent = JSON.parse(body)
      const { type, product_id, app_user_id } = event

      console.log(`[MSW] RevenueCat refund webhook received:`, {
        type,
        product_id,
        app_user_id
      })

      // Simulate refund processing
      if (type === 'REFUND') {
        // Simulate different refund scenarios
        if (product_id === 'pro_month' && app_user_id === 'refund-test-user') {
          return HttpResponse.json(
            { error: 'Refund processing failed' },
            { status: 500 }
          )
        }

        if (app_user_id === 'invalid-refund-user') {
          return HttpResponse.json(
            { error: 'User not found' },
            { status: 404 }
          )
        }

        // Successful refund
        return HttpResponse.json({ status: 'refund_processed' })
      }

      if (type === 'CANCELLATION') {
        // Simulate subscription cancellation
        if (product_id === 'pro_year' && app_user_id === 'cancel-test-user') {
          return HttpResponse.json({ status: 'subscription_cancelled' })
        }
      }

      return HttpResponse.json({ status: 'ok' })
    } catch (error) {
      return HttpResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      )
    }
  }),

  // Claim service refund impact simulation
  http.post('*/functions/v1/claim', async ({ request }) => {
    const body = await request.json()
    const { sku, tx_id } = body

    // Simulate claim after refund scenarios
    if (tx_id === 'refunded-transaction') {
      return HttpResponse.json(
        { error: 'Transaction was refunded' },
        { status: 410 } // Gone
      )
    }

    if (tx_id === 'cancelled-subscription-tx') {
      return HttpResponse.json(
        { error: 'Associated subscription cancelled' },
        { status: 409 }
      )
    }

    // Normal claim processing
    return HttpResponse.json({
      user_id: 'test-user',
      streakshield_count: sku === 'consumable_streakshield_1' ? 1 : 0,
      xp_booster_until: sku === 'consumable_xp_booster_7d' ? 
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : null
    })
  }),

  // Store config for refund testing scenarios
  http.get('*/rest/v1/store_config*', ({ request }) => {
    const url = new URL(request.url)
    const key = url.searchParams.get('key')

    // Simulate different configuration states during refund testing
    const testConfigs = {
      'refund_testing_mode': { on: true },
      'auto_refund_processing': { on: false },
      'refund_grace_period_hours': { value: 24 }
    }

    if (key && testConfigs[key as keyof typeof testConfigs]) {
      return HttpResponse.json([{
        key,
        value: testConfigs[key as keyof typeof testConfigs]
      }])
    }

    // Default store config
    return HttpResponse.json([
      { key: 'storefront_enabled', value: { on: true } },
      { key: 'paywall_enabled', value: { on: true } },
      {
        key: 'sku_enabled',
        value: {
          pro_month: true,
          pro_year: true,
          consumable_streakshield_1: true,
          consumable_xp_booster_7d: true
        }
      }
    ])
  })
]

// Test data generator for refund scenarios
export const generateRefundEvent = (
  type: 'REFUND' | 'CANCELLATION',
  product_id: string,
  app_user_id: string,
  overrides: Partial<RCEvent> = {}
): RCEvent => ({
  id: `refund-${Date.now()}`,
  type,
  product_id,
  app_user_id,
  purchased_at_ms: Date.now() - (24 * 60 * 60 * 1000), // 24 hours ago
  store: 'APP_STORE',
  ...overrides
})

// Refund test scenarios
export const refundTestScenarios = {
  // Successful subscription refund
  subscriptionRefund: () => generateRefundEvent(
    'REFUND',
    'pro_month', 
    'sub-refund-user'
  ),

  // Failed refund processing
  failedRefund: () => generateRefundEvent(
    'REFUND',
    'pro_month',
    'refund-test-user' // Triggers 500 error in handler
  ),

  // Subscription cancellation
  subscriptionCancel: () => generateRefundEvent(
    'CANCELLATION',
    'pro_year',
    'cancel-test-user'
  ),

  // Consumable refund
  consumableRefund: () => generateRefundEvent(
    'REFUND',
    'consumable_streakshield_1',
    'consumable-refund-user'
  ),

  // Invalid user refund
  invalidUserRefund: () => generateRefundEvent(
    'REFUND',
    'pro_month',
    'invalid-refund-user' // Triggers 404 error
  ),

  // Bulk refund scenario
  bulkRefunds: () => [
    'user-1', 'user-2', 'user-3', 'user-4', 'user-5'
  ].map(userId => generateRefundEvent(
    'REFUND',
    'pro_month',
    `bulk-${userId}`
  )),

  // Cross-platform refund
  crossPlatformRefund: () => [
    generateRefundEvent('REFUND', 'pro_month', 'ios-user', { store: 'APP_STORE' }),
    generateRefundEvent('REFUND', 'pro_month', 'android-user', { store: 'PLAY_STORE' })
  ]
}

// Refund testing utilities
export const refundTestUtils = {
  // Simulate refund webhook call
  simulateRefundWebhook: async (event: RCEvent) => {
    const response = await fetch('/functions/v1/revenuecat-webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-RevenueCat-Signature': 'mock-signature'
      },
      body: JSON.stringify(event)
    })
    
    return {
      status: response.status,
      data: await response.json().catch(() => null)
    }
  },

  // Test claim after refund
  testClaimAfterRefund: async (tx_id: string, sku: string) => {
    const response = await fetch('/functions/v1/claim', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ tx_id, sku })
    })

    return {
      status: response.status,
      data: await response.json().catch(() => null)
    }
  },

  // Validate entitlement after refund
  validateEntitlementAfterRefund: async (userId: string, expectedState: {
    pro?: boolean
    streakshield_count?: number
    xp_booster_until?: string | null
  }) => {
    // This would typically query the actual database
    // For testing, we'll simulate the expected behavior
    return {
      userId,
      pro: expectedState.pro ?? false,
      streakshield_count: expectedState.streakshield_count ?? 0,
      xp_booster_until: expectedState.xp_booster_until ?? null,
      verified: true
    }
  }
}