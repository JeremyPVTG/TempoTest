import { useCallback } from 'react'
import { Alert } from 'react-native'
import { useStorefront } from './useStorefront'
import { createStoreMutations, createStoreQueries, toastEmit } from '@habituals/data'

// Mock store repo for demonstration
const mockStoreRepo = {
  getEntitlements: async () => null,
  getWallet: async () => null,
  claimPurchase: async (input: { sku: string; tx_id: string }) => {
    // This would call the real Supabase claim endpoint
    return {
      user_id: 'test-user',
      streakshield_count: 1,
      xp_booster_until: null,
      updated_at: new Date().toISOString()
    }
  },
  getCapsRemaining: async () => ({ week: 1, month: 3 }),
}

export function useClientPurchaseFlow() {
  const storefront = useStorefront()
  const storeMutations = createStoreMutations(mockStoreRepo)
  const storeQueries = createStoreQueries(mockStoreRepo)
  
  const claimPurchase = storeMutations.useClaimPurchase()
  const refreshEntitlements = storeMutations.useRefreshEntitlements()

  const handlePurchaseFlow = useCallback(async (sku: string) => {
    try {
      // Step 1: Make purchase via RevenueCat
      const purchaseResult = await storefront.purchase(sku)
      
      if (sku.startsWith('pro_') || sku.startsWith('cos_')) {
        // For entitlements and cosmetics, refresh from server
        // The webhook should have processed the purchase
        setTimeout(() => {
          refreshEntitlements.mutate()
        }, 2000) // Small delay for webhook processing
        
        // Show success toast immediately for good UX
        toastEmit({
          kind: 'achievement',
          title: sku.startsWith('pro_') ? 'Welcome to Pro!' : 'New Theme Unlocked!',
          subtitle: sku.startsWith('pro_') 
            ? 'Enjoy all premium features' 
            : 'Check out your new look'
        })
        
      } else if (sku.startsWith('consumable_')) {
        // For consumables, claim via our endpoint
        if (!purchaseResult.transactionId) {
          throw new Error('No transaction ID received')
        }

        const claimResult = await claimPurchase.mutateAsync({
          sku,
          tx_id: purchaseResult.transactionId
        })

        // Show success with wallet update
        const itemName = sku === 'consumable_streakshield_1' 
          ? 'Streak Shield' 
          : 'XP Booster'
          
        toastEmit({
          kind: 'achievement',
          title: `${itemName} Added!`,
          subtitle: `Check your wallet for the new ${itemName.toLowerCase()}`
        })
      }

    } catch (error: any) {
      console.error('Purchase flow failed:', error)
      
      // Handle different error types
      if (error?.code === 'E.CAP_EXCEEDED') {
        Alert.alert(
          'Purchase Limit Reached',
          'You\'ve reached your purchase limit for this item. Limits reset weekly/monthly.'
        )
      } else if (error?.code === 'E.PURCHASE_NOT_FOUND') {
        Alert.alert(
          'Purchase Not Found', 
          'The purchase could not be verified. Please contact support if you were charged.'
        )
      } else {
        Alert.alert(
          'Purchase Failed', 
          'Something went wrong with your purchase. Please try again.'
        )
      }
      
      throw error
    }
  }, [storefront, claimPurchase, refreshEntitlements])

  return {
    handlePurchaseFlow,
    isClaimingPurchase: claimPurchase.isPending,
    isRefreshingEntitlements: refreshEntitlements.isPending,
  }
}