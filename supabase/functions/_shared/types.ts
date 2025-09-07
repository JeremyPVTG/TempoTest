export type RCEvent = {
  type: string                // 'INITIAL_PURCHASE' | 'RENEWAL' | 'CANCELLATION' | 'REFUND' | ...
  app_user_id: string         // your stable user id
  product_id: string          // sku
  store: "APP_STORE"|"PLAY_STORE"|"STRIPE"|"UNKNOWN"
  id: string                  // transaction id / rc event id
  purchased_at_ms?: number
  [k: string]: unknown
}

export type ClaimBody = { sku: string; tx_id: string }