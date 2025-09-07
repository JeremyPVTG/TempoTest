import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import type { RequestFn } from '../client'

// Schema for store config values
const StoreConfigSchema = z.object({
  storefront_enabled: z.object({ on: z.boolean() }).optional(),
  paywall_enabled: z.object({ on: z.boolean() }).optional(),
  sku_enabled: z.record(z.boolean()).optional(),
  min_supported_app_version: z.object({ version: z.string() }).optional()
})

export type StoreConfig = z.infer<typeof StoreConfigSchema>

// Safe fallbacks for when flags are unavailable
const DEFAULT_CONFIG: Required<StoreConfig> = {
  storefront_enabled: { on: false }, // Conservative default
  paywall_enabled: { on: true },
  sku_enabled: {
    pro_month: true,
    pro_year: true,
    consumable_streakshield_1: true,
    consumable_xp_booster_7d: true,
    cos_theme_teal_nebula: true,
    bundle_starter_pack: true
  },
  min_supported_app_version: { version: "1.0.0" }
}

async function fetchStoreConfig(request: RequestFn): Promise<StoreConfig> {
  const configRows = await request(
    async (client) => {
      const result = await client.from('store_config').select('key, value')
      return { data: result.data, error: result.error }
    },
    z.array(z.object({ key: z.string(), value: z.unknown() }))
  )
  
  const config: Partial<StoreConfig> = {}
  for (const row of configRows) {
    if (row.key === 'storefront_enabled') {
      config.storefront_enabled = z.object({ on: z.boolean() }).parse(row.value)
    } else if (row.key === 'paywall_enabled') {
      config.paywall_enabled = z.object({ on: z.boolean() }).parse(row.value)  
    } else if (row.key === 'sku_enabled') {
      config.sku_enabled = z.record(z.boolean()).parse(row.value)
    } else if (row.key === 'min_supported_app_version') {
      config.min_supported_app_version = z.object({ version: z.string() }).parse(row.value)
    }
  }
  
  return config
}

export function createStoreConfigHooks(request: RequestFn) {
  return {
    useStoreConfig: () => {
      return useQuery({
        queryKey: ['store-config'],
        queryFn: () => fetchStoreConfig(request),
        staleTime: 60_000, // 60s stale time for remote flags
        gcTime: 300_000,   // 5min cache time
        retry: 2,
        retryDelay: 1000
      })
    }
  }
}

// Utility functions for checking flags
export function isStorefrontEnabled(config?: StoreConfig): boolean {
  return config?.storefront_enabled?.on ?? DEFAULT_CONFIG.storefront_enabled.on
}

export function isPaywallEnabled(config?: StoreConfig): boolean {
  return config?.paywall_enabled?.on ?? DEFAULT_CONFIG.paywall_enabled.on
}

export function isSkuEnabled(sku: string, config?: StoreConfig): boolean {
  const skuConfig = config?.sku_enabled ?? DEFAULT_CONFIG.sku_enabled
  return skuConfig[sku] ?? false
}

export function getMinSupportedVersion(config?: StoreConfig): string {
  return config?.min_supported_app_version?.version ?? DEFAULT_CONFIG.min_supported_app_version.version
}

// Simple semver comparison - returns true if appVersion >= minVersion
export function isVersionSupported(appVersion: string, minVersion: string): boolean {
  if (!appVersion || !minVersion) return true // Default to supported if versions missing
  
  try {
    const parseVersion = (v: string) => {
      const parts = v.replace(/[^0-9.]/g, '').split('.').map(n => parseInt(n, 10) || 0)
      return { major: parts[0] || 0, minor: parts[1] || 0, patch: parts[2] || 0 }
    }
    
    const app = parseVersion(appVersion)
    const min = parseVersion(minVersion)
    
    if (app.major !== min.major) return app.major > min.major
    if (app.minor !== min.minor) return app.minor > min.minor
    return app.patch >= min.patch
  } catch (error) {
    console.warn('Version comparison failed:', error)
    return true // Default to supported on parse errors
  }
}

export function shouldShowUpgradeGate(appVersion: string, config?: StoreConfig): boolean {
  const minVersion = getMinSupportedVersion(config)
  return !isVersionSupported(appVersion, minVersion)
}

// Development override for testing
export function isDevelopment(): boolean {
  return typeof process !== 'undefined' && process.env?.NODE_ENV === 'development'
}

export function getEffectiveConfig(config?: StoreConfig): Required<StoreConfig> {
  // In development, enable all features for testing
  if (isDevelopment()) {
    return {
      storefront_enabled: { on: true },
      paywall_enabled: { on: true },
      sku_enabled: { ...DEFAULT_CONFIG.sku_enabled }
    }
  }
  
  return {
    storefront_enabled: config?.storefront_enabled ?? DEFAULT_CONFIG.storefront_enabled,
    paywall_enabled: config?.paywall_enabled ?? DEFAULT_CONFIG.paywall_enabled,
    sku_enabled: config?.sku_enabled ?? DEFAULT_CONFIG.sku_enabled,
    min_supported_app_version: config?.min_supported_app_version ?? DEFAULT_CONFIG.min_supported_app_version
  }
}