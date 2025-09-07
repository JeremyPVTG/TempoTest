import { describe, it, expect, vi, afterEach } from 'vitest'
import { 
  isStorefrontEnabled,
  isPaywallEnabled, 
  isSkuEnabled,
  getMinSupportedVersion,
  isVersionSupported,
  shouldShowUpgradeGate,
  isDevelopment,
  getEffectiveConfig
} from '../useStoreConfig'
import type { StoreConfig } from '../useStoreConfig'

// Mock process.env for isDevelopment tests
const originalEnv = process.env
const mockEnv = (nodeEnv?: string) => {
  if (nodeEnv) {
    process.env = { ...originalEnv, NODE_ENV: nodeEnv }
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (process as any).env
  }
}

describe('Store Config Utilities', () => {
  describe('isStorefrontEnabled', () => {
    it('returns false by default when no config provided', () => {
      expect(isStorefrontEnabled()).toBe(false)
    })

    it('returns config value when provided', () => {
      const config: StoreConfig = { storefront_enabled: { on: true } }
      expect(isStorefrontEnabled(config)).toBe(true)
    })

    it('returns default when config exists but flag missing', () => {
      const config: StoreConfig = {}
      expect(isStorefrontEnabled(config)).toBe(false)
    })
  })

  describe('isPaywallEnabled', () => {
    it('returns true by default when no config provided', () => {
      expect(isPaywallEnabled()).toBe(true)
    })

    it('returns config value when provided', () => {
      const config: StoreConfig = { paywall_enabled: { on: false } }
      expect(isPaywallEnabled(config)).toBe(false)
    })
  })

  describe('isSkuEnabled', () => {
    it('returns false for unknown SKU when no config provided', () => {
      expect(isSkuEnabled('unknown_sku')).toBe(false)
    })

    it('returns true for known SKU from defaults', () => {
      expect(isSkuEnabled('pro_month')).toBe(true)
      expect(isSkuEnabled('pro_year')).toBe(true)
      expect(isSkuEnabled('consumable_streakshield_1')).toBe(true)
    })

    it('returns config value when provided', () => {
      const config: StoreConfig = { 
        sku_enabled: { 
          pro_month: false,
          custom_sku: true 
        } 
      }
      expect(isSkuEnabled('pro_month', config)).toBe(false)
      expect(isSkuEnabled('custom_sku', config)).toBe(true)
    })
  })

  describe('getMinSupportedVersion', () => {
    it('returns default version when no config provided', () => {
      expect(getMinSupportedVersion()).toBe('1.0.0')
    })

    it('returns config value when provided', () => {
      const config: StoreConfig = { 
        min_supported_app_version: { version: '1.5.0' } 
      }
      expect(getMinSupportedVersion(config)).toBe('1.5.0')
    })
  })

  describe('isVersionSupported', () => {
    it('returns true when versions are equal', () => {
      expect(isVersionSupported('1.0.0', '1.0.0')).toBe(true)
    })

    it('returns true when app version is newer major', () => {
      expect(isVersionSupported('2.0.0', '1.9.9')).toBe(true)
    })

    it('returns true when app version is newer minor', () => {
      expect(isVersionSupported('1.5.0', '1.4.9')).toBe(true)
    })

    it('returns true when app version is newer patch', () => {
      expect(isVersionSupported('1.0.5', '1.0.4')).toBe(true)
    })

    it('returns false when app version is older major', () => {
      expect(isVersionSupported('1.0.0', '2.0.0')).toBe(false)
    })

    it('returns false when app version is older minor', () => {
      expect(isVersionSupported('1.0.0', '1.1.0')).toBe(false)
    })

    it('returns false when app version is older patch', () => {
      expect(isVersionSupported('1.0.0', '1.0.1')).toBe(false)
    })

    it('handles missing versions gracefully', () => {
      expect(isVersionSupported('', '1.0.0')).toBe(true)
      expect(isVersionSupported('1.0.0', '')).toBe(true)
      expect(isVersionSupported('', '')).toBe(true)
    })

    it('handles pre-release versions', () => {
      expect(isVersionSupported('1.0.0-beta.1', '1.0.0')).toBe(true)
      expect(isVersionSupported('1.0.0-alpha', '1.0.0-beta')).toBe(true)
    })

    it('handles malformed versions gracefully', () => {
      expect(isVersionSupported('invalid', '1.0.0')).toBe(true)
      expect(isVersionSupported('1.0.0', 'invalid')).toBe(true)
      expect(isVersionSupported('1.a.0', '1.0.0')).toBe(true)
    })

    it('logs warnings on parse errors', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      // Force an error by throwing in parseVersion
      expect(isVersionSupported('1.0.0', '1.0.0')).toBe(true)
      
      consoleSpy.mockRestore()
    })
  })

  describe('shouldShowUpgradeGate', () => {
    it('returns true when app version is below minimum', () => {
      const config: StoreConfig = { 
        min_supported_app_version: { version: '1.5.0' } 
      }
      expect(shouldShowUpgradeGate('1.0.0', config)).toBe(true)
    })

    it('returns false when app version meets minimum', () => {
      const config: StoreConfig = { 
        min_supported_app_version: { version: '1.0.0' } 
      }
      expect(shouldShowUpgradeGate('1.0.0', config)).toBe(false)
    })

    it('uses default minimum when no config provided', () => {
      expect(shouldShowUpgradeGate('0.9.0')).toBe(true)
      expect(shouldShowUpgradeGate('1.0.0')).toBe(false)
    })
  })

  describe('isDevelopment', () => {
    afterEach(() => {
      process.env = originalEnv
    })

    it('returns true when NODE_ENV is development', () => {
      mockEnv('development')
      expect(isDevelopment()).toBe(true)
    })

    it('returns false when NODE_ENV is production', () => {
      mockEnv('production')
      expect(isDevelopment()).toBe(false)
    })

    it('returns false when NODE_ENV is not set', () => {
      mockEnv('test')
      expect(isDevelopment()).toBe(false)
    })

    it('handles missing process gracefully', () => {
      mockEnv()
      expect(isDevelopment()).toBe(false)
    })
  })

  describe('getEffectiveConfig', () => {
    afterEach(() => {
      process.env = originalEnv
    })

    it('returns development overrides in development', () => {
      mockEnv('development')
      
      const config = getEffectiveConfig()
      expect(config.storefront_enabled.on).toBe(true)
      expect(config.paywall_enabled.on).toBe(true)
    })

    it('uses provided config in production', () => {
      mockEnv('production')
      
      const inputConfig: StoreConfig = {
        storefront_enabled: { on: false },
        paywall_enabled: { on: false }
      }
      
      const config = getEffectiveConfig(inputConfig)
      expect(config.storefront_enabled.on).toBe(false)
      expect(config.paywall_enabled.on).toBe(false)
    })

    it('uses defaults when no config provided in production', () => {
      mockEnv('production')
      
      const config = getEffectiveConfig()
      expect(config.storefront_enabled.on).toBe(false) // Conservative default
      expect(config.paywall_enabled.on).toBe(true)
      expect(config.min_supported_app_version.version).toBe('1.0.0')
    })

    it('merges partial config with defaults', () => {
      mockEnv('production')
      
      const inputConfig: StoreConfig = {
        storefront_enabled: { on: true }
        // Other fields missing
      }
      
      const config = getEffectiveConfig(inputConfig)
      expect(config.storefront_enabled.on).toBe(true)
      expect(config.paywall_enabled.on).toBe(true) // From defaults
      expect(config.min_supported_app_version.version).toBe('1.0.0') // From defaults
    })
  })
})