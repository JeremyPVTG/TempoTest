export interface FeatureFlags {
  storefront_enabled: boolean
  paywall_enabled: boolean
  consumables_enabled: boolean
  cosmetics_enabled: boolean
}

export const DEFAULT_FLAGS: FeatureFlags = {
  storefront_enabled: false, // Off by default for non-testers
  paywall_enabled: false,
  consumables_enabled: false,
  cosmetics_enabled: false,
}

export type FlagName = keyof FeatureFlags