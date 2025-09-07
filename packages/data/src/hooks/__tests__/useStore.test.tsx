import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, act } from '@testing-library/react'
import { createStoreMutations, createStoreQueries } from '../useStore'

describe('store hooks', () => {
  let queryClient: QueryClient
  let wrapper: React.FC<{ children: React.ReactNode }>

  const mockRepo = {
    getEntitlements: vi.fn(),
    getWallet: vi.fn(),
    claimPurchase: vi.fn(),
    getCapsRemaining: vi.fn(),
  }

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })
    wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    vi.clearAllMocks()
  })

  describe('createStoreQueries', () => {
    it('useEntitlements fetches and caches entitlements', async () => {
      const mockEntitlements = {
        user_id: 'test-user',
        pro: true,
        cosmetics: { teal_nebula: true },
        updated_at: '2024-01-01T00:00:00Z'
      }

      mockRepo.getEntitlements.mockResolvedValue(mockEntitlements)
      const queries = createStoreQueries(mockRepo)

      const { result } = renderHook(() => queries.useEntitlements(), { wrapper })

      // Wait for query to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
      })

      expect(result.current.data).toEqual(mockEntitlements)
      expect(mockRepo.getEntitlements).toHaveBeenCalledOnce()
    })

    it('useWallet fetches and caches wallet data', async () => {
      const mockWallet = {
        user_id: 'test-user',
        streakshield_count: 2,
        xp_booster_until: null,
        updated_at: '2024-01-01T00:00:00Z'
      }

      mockRepo.getWallet.mockResolvedValue(mockWallet)
      const queries = createStoreQueries(mockRepo)

      const { result } = renderHook(() => queries.useWallet(), { wrapper })

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
      })

      expect(result.current.data).toEqual(mockWallet)
      expect(mockRepo.getWallet).toHaveBeenCalledOnce()
    })

    it('useCapsRemaining fetches caps data', async () => {
      const mockCaps = { week: 1, month: 2 }
      mockRepo.getCapsRemaining.mockResolvedValue(mockCaps)
      
      const queries = createStoreQueries(mockRepo)
      const { result } = renderHook(() => queries.useCapsRemaining(), { wrapper })

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
      })

      expect(result.current.data).toEqual(mockCaps)
    })
  })

  describe('createStoreMutations', () => {
    it('useClaimPurchase claims purchase and updates wallet', async () => {
      const mockUpdatedWallet = {
        user_id: 'test-user',
        streakshield_count: 3,
        xp_booster_until: null,
        updated_at: '2024-01-01T00:00:00Z'
      }

      mockRepo.claimPurchase.mockResolvedValue(mockUpdatedWallet)
      
      const mutations = createStoreMutations(mockRepo)
      const { result } = renderHook(() => mutations.useClaimPurchase(), { wrapper })

      await act(async () => {
        await result.current.mutateAsync({
          sku: 'consumable_streakshield_1',
          tx_id: 'test-tx-123'
        })
      })

      expect(mockRepo.claimPurchase).toHaveBeenCalledWith({
        sku: 'consumable_streakshield_1',
        tx_id: 'test-tx-123'
      })

      // Check that wallet query was updated
      const walletData = queryClient.getQueryData(['wallet'])
      expect(walletData).toEqual(mockUpdatedWallet)
    })

    it('useClaimPurchase handles caps exceeded error', async () => {
      const capError = new Error('cap exceeded')
      
      mockRepo.claimPurchase.mockRejectedValue(capError)
      
      const mutations = createStoreMutations(mockRepo)
      const { result } = renderHook(() => mutations.useClaimPurchase(), { wrapper })

      await act(async () => {
        try {
          await result.current.mutateAsync({
            sku: 'consumable_streakshield_1',
            tx_id: 'test-tx-123'
          })
        } catch (error: any) {
          expect(error.message).toContain('cap exceeded')
          expect(error.code).toBe('E.CAP_EXCEEDED')
        }
      })

      expect(result.current.error?.message).toContain('cap exceeded')
    })

    it('useRefreshEntitlements invalidates entitlements query', async () => {
      mockRepo.getEntitlements.mockResolvedValue({
        user_id: 'test-user',
        pro: true,
        cosmetics: {},
        updated_at: '2024-01-01T00:00:00Z'
      })

      const mutations = createStoreMutations(mockRepo)
      const { result } = renderHook(() => mutations.useRefreshEntitlements(), { wrapper })

      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      await act(async () => {
        await result.current.mutateAsync()
      })

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['entitlements'] })
      expect(mockRepo.getEntitlements).toHaveBeenCalled()
    })

    it('useRefreshWallet invalidates wallet query', async () => {
      mockRepo.getWallet.mockResolvedValue({
        user_id: 'test-user',
        streakshield_count: 0,
        xp_booster_until: null,
        updated_at: '2024-01-01T00:00:00Z'
      })

      const mutations = createStoreMutations(mockRepo)
      const { result } = renderHook(() => mutations.useRefreshWallet(), { wrapper })

      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      await act(async () => {
        await result.current.mutateAsync()
      })

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['wallet'] })
      expect(mockRepo.getWallet).toHaveBeenCalled()
    })
  })
})