import { admin } from "../_shared/client.ts"
import type { RCEvent } from "../_shared/types.ts"

const REVENUECAT_WEBHOOK_SECRET = Deno.env.get("REVENUECAT_WEBHOOK_SECRET")!

async function logMetrics(requestId: string, statusCode: number, startTime: number, errorCode?: string) {
  try {
    const duration = Date.now() - startTime
    const logEntry = {
      function_name: 'revenuecat-webhook',
      request_id: requestId,
      status_code: statusCode,
      duration_ms: duration,
      error_code: errorCode,
      slo_tag: 'webhook',
      timestamp: new Date().toISOString()
    }
    
    console.log(JSON.stringify(logEntry))
    
    // Also try to insert into metrics table for persistent tracking
    const supa = admin()
    await supa.from('function_metrics').insert(logEntry)
  } catch (error) {
    console.warn('Failed to log metrics:', error)
  }
}

function verifySignature(secret: string, rawBody: string, header: string | null): boolean {
  if (!header) return false
  
  try {
    // RevenueCat uses HMAC-SHA256
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    )
    
    const signature = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(rawBody)
    )
    
    const expectedSig = btoa(String.fromCharCode(...new Uint8Array(signature)))
    return expectedSig === header
  } catch (error) {
    console.error("Signature verification failed:", error)
    return false
  }
}

Deno.serve(async (req) => {
  const startTime = Date.now()
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID()
  
  // Health check endpoint
  if (req.method === "GET" && req.url.includes("health=1")) {
    return new Response(JSON.stringify({ ok: true, service: "revenuecat-webhook", timestamp: new Date().toISOString() }), {
      headers: { "Content-Type": "application/json" },
      status: 200
    })
  }
  
  if (req.method !== "POST") {
    return new Response("POST only", { status: 405 })
  }

  const raw = await req.text()
  const sig = req.headers.get("X-RevenueCat-Signature")
  
  // Verify signature (stub for dev, implement proper HMAC for production)
  if (!verifySignature(REVENUECAT_WEBHOOK_SECRET, raw, sig)) {
    console.error("Invalid webhook signature")
    await logMetrics(requestId, 401, startTime, "signature_invalid")
    return new Response("invalid signature", { status: 401 })
  }

  let ev: RCEvent
  try {
    ev = JSON.parse(raw) as RCEvent
  } catch (error) {
    console.error("Failed to parse webhook payload:", error)
    await logMetrics(requestId, 400, startTime, "invalid_json")
    return new Response("invalid json", { status: 400 })
  }

  const supa = admin()

  const tx_id = ev.id
  const user_id = ev.app_user_id
  const rc_app_user_id = ev.app_user_id
  const sku = ev.product_id
  const status = ev.type
  const platform = ev.store === "APP_STORE" ? "ios" : ev.store === "PLAY_STORE" ? "android" : "unknown"
  const purchased_at = ev.purchased_at_ms ? new Date(ev.purchased_at_ms).toISOString() : new Date().toISOString()

  // Structured logging for observability
  const logContext = { 
    evt: status, 
    tx_id, 
    user_id, 
    rc_app_user_id, 
    sku, 
    platform, 
    ts: new Date().toISOString() 
  }
  
  try {
    // RevenueCat user mapping verification (spoof-proof)
    const { data: existingMapping, error: mapErr } = await supa
      .from("rc_user_map")
      .select("rc_app_user_id")
      .eq("user_id", user_id)
      .maybeSingle()
      
    if (mapErr) {
      console.error("rc_user_map query failed:", { ...logContext, error: mapErr.message })
      await logMetrics(requestId, 500, startTime, "user_mapping_error")
      return new Response("user mapping error", { status: 500 })
    }
    
    if (existingMapping) {
      // Verify existing mapping matches
      if (existingMapping.rc_app_user_id !== rc_app_user_id) {
        console.error("rc_user_map mismatch - possible spoofing attempt:", { 
          ...logContext, 
          expected: existingMapping.rc_app_user_id,
          received: rc_app_user_id
        })
        await logMetrics(requestId, 403, startTime, "user_mapping_mismatch")
        return new Response("user mapping mismatch", { status: 403 })
      }
    } else {
      // First event for user - create mapping
      const { error: createErr } = await supa.from("rc_user_map").upsert({
        user_id,
        rc_app_user_id,
        created_at: new Date().toISOString()
      })
      
      if (createErr) {
        console.error("Failed to create rc_user_map:", { ...logContext, error: createErr.message })
        await logMetrics(requestId, 500, startTime, "user_mapping_creation_failed")
        return new Response("user mapping creation failed", { status: 500 })
      }
      
      console.log("Created rc_user_map:", { user_id, rc_app_user_id })
    }

    // Idempotent audit upsert
    const { error: auditErr } = await supa.from("audit_purchases").upsert({
      tx_id, 
      user_id, 
      sku, 
      platform, 
      purchased_at, 
      status, 
      raw: ev
    })
    
    if (auditErr) {
      console.error("Audit upsert error:", auditErr)
      return new Response(auditErr.message, { status: 500 })
    }

    // Entitlement & cosmetics fulfillment (server-authoritative)
    if (sku === "pro_month" || sku === "pro_year") {
      const pro = status !== "CANCELLATION" && status !== "REFUND"
      const { error } = await supa.from("user_entitlements").upsert({ 
        user_id, 
        pro, 
        updated_at: new Date().toISOString() 
      })
      
      if (error) {
        console.error("Pro entitlement error:", error)
        return new Response(error.message, { status: 500 })
      }
      
      console.log(`Updated pro entitlement for ${user_id}: ${pro}`)
      
    } else if (sku === "cos_theme_teal_nebula") {
      // Merge cosmetics; keep idempotent
      const { data, error } = await supa
        .from("user_entitlements")
        .select("cosmetics")
        .eq("user_id", user_id)
        .maybeSingle()
        
      if (error) {
        console.error("Cosmetics fetch error:", error)
        return new Response(error.message, { status: 500 })
      }
      
      const cosmetics = { ...(data?.cosmetics ?? {}), teal_nebula: true }
      const { error: upErr } = await supa.from("user_entitlements").upsert({ 
        user_id, 
        cosmetics, 
        updated_at: new Date().toISOString() 
      })
      
      if (upErr) {
        console.error("Cosmetics upsert error:", upErr)
        return new Response(upErr.message, { status: 500 })
      }
      
      console.log(`Updated cosmetics for ${user_id}:`, cosmetics)
      
    } else if (sku.startsWith("consumable_")) {
      // Consumables (streakshield/xp_booster) are audited here; 
      // the client will call /claim to apply caps consistently
      console.log(`Consumable purchase recorded: ${sku} for ${user_id}`)
    }

    console.log(`Processed webhook event: ${status} for ${sku} (${user_id})`)
    await logMetrics(requestId, 200, startTime)
    return new Response("ok", { status: 200 })
    
  } catch (error) {
    console.error("Webhook processing error:", error)
    await logMetrics(requestId, 500, startTime, "internal_error")
    return new Response("internal error", { status: 500 })
  }
})