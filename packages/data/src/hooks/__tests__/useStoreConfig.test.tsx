import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createStoreConfigHooks, isStorefrontEnabled, isPaywallEnabled, isSkuEnabled } from '../useStoreConfig'
import type { ReactNode } from 'react'

const mockRequest: any = async (op: any, schema: any) => {
  // Mock store config data
  return schema.parse([
    { key: 'storefront_enabled', value: { on: false } },
    { key: 'paywall_enabled', value: { on: true } },
    { key: 'sku_enabled', value: { pro_month: true, pro_year: false, consumable_streakshield_1: true } }
  ])
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useStoreConfig', () => {
  const hooks = createStoreConfigHooks(mockRequest)
  
  it('loads store config successfully', async () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => hooks.useStoreConfig(), { wrapper })
    
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    
    expect(result.current.data).toEqual({
      storefront_enabled: { on: false },
      paywall_enabled: { on: true },
      sku_enabled: { pro_month: true, pro_year: false, consumable_streakshield_1: true }
    })
  })
})

describe('store config utilities', () => {
  const mockConfig = {
    storefront_enabled: { on: false },
    paywall_enabled: { on: true }, 
    sku_enabled: { pro_month: true, pro_year: false, consumable_streakshield_1: true }
  }
  
  it('checks storefront enabled correctly', () => {
    expect(isStorefrontEnabled(mockConfig)).toBe(false)
    expect(isStorefrontEnabled(undefined)).toBe(false) // Safe default
  })
  
  it('checks paywall enabled correctly', () => {
    expect(isPaywallEnabled(mockConfig)).toBe(true)
    expect(isPaywallEnabled(undefined)).toBe(true) // Safe default
  })
  
  it('checks SKU enabled correctly', () => {
    expect(isSkuEnabled('pro_month', mockConfig)).toBe(true)
    expect(isSkuEnabled('pro_year', mockConfig)).toBe(false)
    expect(isSkuEnabled('unknown_sku', mockConfig)).toBe(false)
    expect(isSkuEnabled('pro_month', undefined)).toBe(true) // Default fallback
  })
})