import { z } from 'zod'
import { DataError } from '../types/errors'

// Zod schemas for store data
const UserEntitlementZ = z.object({
  user_id: z.string().uuid(),
  pro: z.boolean(),
  cosmetics: z.record(z.boolean()),
  updated_at: z.string(),
})

const UserWalletZ = z.object({
  user_id: z.string().uuid(),
  streakshield_count: z.number().int().min(0),
  xp_booster_until: z.string().nullable(),
  updated_at: z.string(),
})

const ClaimInputZ = z.object({
  sku: z.string(),
  tx_id: z.string(),
})

export type UserEntitlement = z.infer<typeof UserEntitlementZ>
export type UserWallet = z.infer<typeof UserWalletZ>
export type ClaimInput = z.infer<typeof ClaimInputZ>

export type StoreRepo = ReturnType<typeof makeStoreRepo>

export function makeStoreRepo(client: { 
  request: <T>(op: (c: any) => Promise<{ data: unknown; error: unknown }>, parse: z.ZodType<T>) => Promise<T>;
  supabase: any;
}) {
  return {
    getEntitlements: async (): Promise<UserEntitlement | null> => {
      try {
        return await client.request(
          (c: any) => c.from("user_entitlements").select("*").maybeSingle(),
          UserEntitlementZ.nullable()
        )
      } catch (error) {
        // If no entitlements exist, return default state
        return null
      }
    },

    getWallet: async (): Promise<UserWallet | null> => {
      try {
        return await client.request(
          (c: any) => c.from("user_wallet_balances").select("*").maybeSingle(),
          UserWalletZ.nullable()
        )
      } catch (error) {
        // If no wallet exists, return default state
        return null
      }
    },

    claimPurchase: async (input: ClaimInput): Promise<UserWallet> => {
      const validated = ClaimInputZ.parse(input)
      
      const response = await fetch(`${client.supabase.supabaseUrl}/functions/v1/claim`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${client.supabase.supabaseKey}`,
        },
        body: JSON.stringify(validated),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Claim failed: ${response.status} ${errorText}`)
      }

      const data = await response.json()
      return UserWalletZ.parse(data)
    },

    getCapsRemaining: async (): Promise<{ week: number; month: number }> => {
      try {
        const { data, error } = await client.supabase
          .rpc('caps_remaining_streakshield', { p_user: (await client.supabase.auth.getUser()).data.user?.id })
          
        if (error) throw error
        return data || { week: 1, month: 3 }
      } catch {
        return { week: 1, month: 3 } // Default caps
      }
    }
  }
}

// Error codes for store operations
export const StoreErrorCodes = {
  PURCHASE_NOT_FOUND: 'E.PURCHASE_NOT_FOUND',
  CAP_EXCEEDED: 'E.CAP_EXCEEDED',
  INVALID_SKU: 'E.INVALID_SKU',
  NETWORK_ERROR: 'E.NETWORK_ERROR',
} as const

export function toStoreError(error: unknown): DataError {
  const message = error instanceof Error ? error.message : String(error)
  
  if (message.includes('cap exceeded') || message.includes('409')) {
    return new DataError(StoreErrorCodes.CAP_EXCEEDED, message) as DataError
  }
  
  if (message.includes('purchase not found') || message.includes('404')) {
    return new DataError(StoreErrorCodes.PURCHASE_NOT_FOUND, message) as DataError
  }
  
  if (message.includes('sku not claimable') || message.includes('400')) {
    return new DataError(StoreErrorCodes.INVALID_SKU, message) as DataError
  }
  
  return new DataError(StoreErrorCodes.NETWORK_ERROR, message) as DataError
}