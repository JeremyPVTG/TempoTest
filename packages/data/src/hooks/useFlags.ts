import { useQuery } from '@tanstack/react-query'
import type { FeatureFlags, FlagName } from '../types/flags'
import { DEFAULT_FLAGS } from '../types/flags'

export function createFlagsQueries(client?: any) {
  return {
    useFlags: () => useQuery({
      queryKey: ['flags'],
      queryFn: async (): Promise<FeatureFlags> => {
        // In a real implementation, this would fetch from your config service
        // For now, return defaults that can be overridden by environment
        const flags = { ...DEFAULT_FLAGS }
        
        // Allow environment overrides for development
        if (typeof window !== 'undefined') {
          // Web environment
          if (window.location.hostname === 'localhost' || window.location.hostname.includes('dev')) {
            flags.storefront_enabled = true
            flags.paywall_enabled = true
            flags.consumables_enabled = true
            flags.cosmetics_enabled = true
          }
        } else {
          // React Native environment
          const isDev = process.env.NODE_ENV === 'development'
          if (isDev) {
            flags.storefront_enabled = true
            flags.paywall_enabled = true
            flags.consumables_enabled = true
            flags.cosmetics_enabled = true
          }
        }
        
        return flags
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchInterval: 10 * 60 * 1000, // Check every 10 minutes
    }),

    useFlag: (flagName: FlagName) => {
      const { data: flags } = useQuery({
        queryKey: ['flags'],
        queryFn: async () => DEFAULT_FLAGS,
      })
      
      return flags?.[flagName] || DEFAULT_FLAGS[flagName]
    }
  }
}

// Convenience hooks
export function useStorefrontEnabled(): boolean {
  const queries = createFlagsQueries()
  return queries.useFlag('storefront_enabled')
}

export function usePaywallEnabled(): boolean {
  const queries = createFlagsQueries()
  return queries.useFlag('paywall_enabled')
}