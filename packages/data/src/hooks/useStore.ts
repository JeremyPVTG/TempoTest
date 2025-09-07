import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { StoreRepo, ClaimInput, UserEntitlement, UserWallet } from '../repositories/storeRepo'
import { toStoreError } from '../repositories/storeRepo'

export function createStoreQueries(repo: StoreRepo) {
  return {
    useEntitlements: () => useQuery({
      queryKey: ['entitlements'],
      queryFn: repo.getEntitlements,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }),

    useWallet: () => useQuery({
      queryKey: ['wallet'],
      queryFn: repo.getWallet,
      staleTime: 60 * 1000, // 1 minute
    }),

    useCapsRemaining: () => useQuery({
      queryKey: ['caps', 'streakshield'],
      queryFn: repo.getCapsRemaining,
      staleTime: 30 * 1000, // 30 seconds
    }),
  }
}

export function createStoreMutations(repo: StoreRepo) {
  return {
    useClaimPurchase: () => {
      const qc = useQueryClient()
      return useMutation({
        mutationFn: async (input: ClaimInput) => {
          try {
            return await repo.claimPurchase(input)
          } catch (error) {
            throw toStoreError(error)
          }
        },
        onSuccess: (data: UserWallet) => {
          // Update both wallet and caps queries
          qc.setQueryData(['wallet'], data)
          qc.invalidateQueries({ queryKey: ['caps'] })
        },
        onError: (error) => {
          console.error('Failed to claim purchase:', error)
        },
      })
    },

    useRefreshEntitlements: () => {
      const qc = useQueryClient()
      return useMutation({
        mutationFn: async () => {
          // Force refresh of entitlements from server
          qc.invalidateQueries({ queryKey: ['entitlements'] })
          return repo.getEntitlements()
        },
        onSuccess: () => {
          console.log('Entitlements refreshed')
        },
      })
    },

    useRefreshWallet: () => {
      const qc = useQueryClient()
      return useMutation({
        mutationFn: async () => {
          // Force refresh of wallet from server
          qc.invalidateQueries({ queryKey: ['wallet'] })
          return repo.getWallet()
        },
        onSuccess: () => {
          console.log('Wallet refreshed')
        },
      })
    },
  }
}

// Convenience hooks that combine repo creation with queries/mutations
export function useEntitlementsData(): {
  data: UserEntitlement | null | undefined
  isLoading: boolean
  error: any
  isPro: boolean
  hasCosmetic: (key: string) => boolean
} {
  const query = useQuery<UserEntitlement | null>({
    queryKey: ['entitlements'],
    queryFn: async () => {
      // This will be injected by the provider
      throw new Error('Store repo not available')
    },
  })

  return {
    ...query,
    isPro: query.data?.pro || false,
    hasCosmetic: (key: string) => query.data?.cosmetics?.[key] || false,
  }
}

export function useWalletData(): {
  data: UserWallet | null | undefined
  isLoading: boolean
  error: any
  streakshields: number
  hasActiveXpBooster: boolean
  xpBoosterUntil: Date | null
} {
  const query = useQuery<UserWallet | null>({
    queryKey: ['wallet'],
    queryFn: async () => {
      // This will be injected by the provider
      throw new Error('Store repo not available')
    },
  })

  const xpBoosterUntil = query.data?.xp_booster_until 
    ? new Date(query.data.xp_booster_until) 
    : null

  const hasActiveXpBooster = xpBoosterUntil ? xpBoosterUntil > new Date() : false

  return {
    ...query,
    streakshields: query.data?.streakshield_count || 0,
    hasActiveXpBooster,
    xpBoosterUntil,
  }
}