import { describe, it, expect, vi, beforeEach } from 'vitest'
import { makeStoreRepo, toStoreError, StoreErrorCodes } from '../storeRepo'

describe('storeRepo', () => {
  const mockClient = {
    request: vi.fn(),
    supabase: {
      supabaseUrl: 'https://test.supabase.co',
      supabaseKey: 'test-key',
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } }
        })
      },
      rpc: vi.fn(),
    }
  }

  const storeRepo = makeStoreRepo(mockClient)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getEntitlements', () => {
    it('returns user entitlements', async () => {
      const mockEntitlements = {
        user_id: '12345678-1234-5678-9012-123456789012',
        pro: true,
        cosmetics: { teal_nebula: true },
        updated_at: '2024-01-01T00:00:00Z'
      }

      mockClient.request.mockResolvedValue(mockEntitlements)

      const result = await storeRepo.getEntitlements()
      
      expect(result).toEqual(mockEntitlements)
      expect(mockClient.request).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Object)
      )
    })

    it('returns null if no entitlements exist', async () => {
      mockClient.request.mockRejectedValue(new Error('Not found'))

      const result = await storeRepo.getEntitlements()
      expect(result).toBeNull()
    })
  })

  describe('getWallet', () => {
    it('returns user wallet', async () => {
      const mockWallet = {
        user_id: '12345678-1234-5678-9012-123456789012',
        streakshield_count: 3,
        xp_booster_until: '2024-01-08T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      mockClient.request.mockResolvedValue(mockWallet)

      const result = await storeRepo.getWallet()
      expect(result).toEqual(mockWallet)
    })

    it('returns null if no wallet exists', async () => {
      mockClient.request.mockRejectedValue(new Error('Not found'))

      const result = await storeRepo.getWallet()
      expect(result).toBeNull()
    })
  })

  describe('claimPurchase', () => {
    beforeEach(() => {
      global.fetch = vi.fn()
    })

    it('successfully claims a purchase', async () => {
      const mockResponse = {
        user_id: '12345678-1234-5678-9012-123456789012',
        streakshield_count: 1,
        xp_booster_until: null,
        updated_at: '2024-01-01T00:00:00Z'
      }

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const result = await storeRepo.claimPurchase({
        sku: 'consumable_streakshield_1',
        tx_id: 'test-tx-123'
      })

      expect(result).toEqual(mockResponse)
      expect(fetch).toHaveBeenCalledWith(
        'https://test.supabase.co/functions/v1/claim',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-key',
          }),
          body: JSON.stringify({
            sku: 'consumable_streakshield_1',
            tx_id: 'test-tx-123'
          })
        })
      )
    })

    it('throws error on failed claim', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: false,
        status: 409,
        text: () => Promise.resolve('cap exceeded')
      })

      await expect(
        storeRepo.claimPurchase({
          sku: 'consumable_streakshield_1',
          tx_id: 'test-tx-123'
        })
      ).rejects.toThrow('Claim failed: 409 cap exceeded')
    })

    it('validates input parameters', async () => {
      await expect(
        storeRepo.claimPurchase({
          sku: '',
          tx_id: 'test-tx-123'
        } as any)
      ).rejects.toThrow()
    })
  })

  describe('toStoreError', () => {
    it('maps cap exceeded errors', () => {
      const error = toStoreError(new Error('cap exceeded'))
      expect(error.code).toBe(StoreErrorCodes.CAP_EXCEEDED)
      expect(error.message).toBe('cap exceeded')
    })

    it('maps purchase not found errors', () => {
      const error = toStoreError(new Error('purchase not found'))
      expect(error.code).toBe(StoreErrorCodes.PURCHASE_NOT_FOUND)
    })

    it('maps invalid sku errors', () => {
      const error = toStoreError(new Error('sku not claimable'))
      expect(error.code).toBe(StoreErrorCodes.INVALID_SKU)
    })

    it('defaults to network error', () => {
      const error = toStoreError(new Error('unknown error'))
      expect(error.code).toBe(StoreErrorCodes.NETWORK_ERROR)
    })
  })
})