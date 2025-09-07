import { admin } from "../_shared/client.ts"
import type { ClaimBody } from "../_shared/types.ts"

async function logMetrics(requestId: string, statusCode: number, startTime: number, errorCode?: string) {
  try {
    const duration = Date.now() - startTime
    const logEntry = {
      function_name: 'claim',
      request_id: requestId,
      status_code: statusCode,
      duration_ms: duration,
      error_code: errorCode,
      slo_tag: 'claim',
      timestamp: new Date().toISOString()
    }
    
    console.log(JSON.stringify(logEntry))
    
    const supa = admin()
    await supa.from('function_metrics').insert(logEntry)
  } catch (error) {
    console.warn('Failed to log metrics:', error)
  }
}

Deno.serve(async (req) => {
  const startTime = Date.now()
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID()
  
  // Health check endpoint
  if (req.method === "GET" && req.url.includes("health=1")) {
    return new Response(JSON.stringify({ ok: true, service: "claim", timestamp: new Date().toISOString() }), {
      headers: { "Content-Type": "application/json" },
      status: 200
    })
  }
  
  if (req.method !== "POST") {
    await logMetrics(requestId, 405, startTime, "method_not_allowed")
    return new Response("POST only", { status: 405 })
  }

  let body: ClaimBody
  try {
    body = await req.json() as ClaimBody
  } catch (error) {
    await logMetrics(requestId, 400, startTime, "invalid_json")
    return new Response("invalid json", { status: 400 })
  }

  const { sku, tx_id } = body
  if (!sku || !tx_id) {
    await logMetrics(requestId, 400, startTime, "missing_parameters")
    return new Response("missing sku or tx_id", { status: 400 })
  }

  const supa = admin()

  try {
    // Lookup purchase
    const { data: audit, error: auditErr } = await supa
      .from("audit_purchases")
      .select("tx_id,user_id,sku,status,purchased_at")
      .eq("tx_id", tx_id)
      .maybeSingle()
      
    if (auditErr) {
      console.error("Audit lookup error:", auditErr)
      await logMetrics(requestId, 500, startTime, "audit_lookup_error")
      return new Response(auditErr.message, { status: 500 })
    }
    
    if (!audit || audit.sku !== sku) {
      await logMetrics(requestId, 404, startTime, "purchase_not_found")
      return new Response("purchase not found", { status: 404 })
    }

    // Idempotency: if already claimed, return current wallet
    const { data: already, error: claimErr } = await supa
      .from("purchase_claims")
      .select("tx_id")
      .eq("tx_id", tx_id)
      .maybeSingle()
      
    if (claimErr) {
      console.error("Claim lookup error:", claimErr)
      await logMetrics(requestId, 500, startTime, "claim_lookup_error")
      return new Response(claimErr.message, { status: 500 })
    }
    
    if (already) {
      console.log(`Purchase ${tx_id} already claimed, returning wallet`)
      const { data: wallet } = await supa
        .from("user_wallet_balances")
        .select("*")
        .eq("user_id", audit.user_id)
        .maybeSingle()
        
      await logMetrics(requestId, 200, startTime, "already_claimed")
      return Response.json(wallet ?? { 
        user_id: audit.user_id, 
        streakshield_count: 0, 
        xp_booster_until: null 
      })
    }

    // Enforce caps
    const nowIso = new Date().toISOString()
    const weekStart = new Date()
    weekStart.setUTCHours(0, 0, 0, 0)
    weekStart.setUTCDate(weekStart.getUTCDate() - weekStart.getUTCDay())
    
    const monthStart = new Date(Date.UTC(
      new Date().getUTCFullYear(), 
      new Date().getUTCMonth(), 
      1
    )).toISOString()

    // Apply effects based on SKU
    if (sku === "consumable_streakshield_1") {
      // Check caps
      const { count: weekCount } = await supa
        .from("purchase_claims")
        .select("*", { count: "exact", head: true })
        .eq("user_id", audit.user_id)
        .eq("sku", "consumable_streakshield_1")
        .gte("claimed_at", weekStart.toISOString())

      const { count: monthCount } = await supa
        .from("purchase_claims")
        .select("*", { count: "exact", head: true })
        .eq("user_id", audit.user_id)
        .eq("sku", "consumable_streakshield_1")
        .gte("claimed_at", monthStart)

      if ((weekCount || 0) >= 1 || (monthCount || 0) >= 3) {
        console.log(`Cap exceeded for ${audit.user_id}: week=${weekCount}, month=${monthCount}`)
        await logMetrics(requestId, 409, startTime, "cap_exceeded")
        return new Response("cap exceeded", { status: 409 })
      }

      // Get current wallet
      const { data: wal0 } = await supa
        .from("user_wallet_balances")
        .select("streakshield_count")
        .eq("user_id", audit.user_id)
        .maybeSingle()
        
      const count = (wal0?.streakshield_count ?? 0) + 1
      
      // Update wallet
      const { error: upErr } = await supa
        .from("user_wallet_balances")
        .upsert({ 
          user_id: audit.user_id, 
          streakshield_count: count, 
          updated_at: nowIso 
        })
        
      if (upErr) {
        console.error("Streakshield wallet update error:", upErr)
        await logMetrics(requestId, 500, startTime, "wallet_update_error")
        return new Response(upErr.message, { status: 500 })
      }
      
      console.log(`Added streakshield for ${audit.user_id}, count now: ${count}`)
      
    } else if (sku === "consumable_xp_booster_7d") {
      const until = new Date()
      until.setUTCDate(until.getUTCDate() + 7)
      
      const { data: wal0 } = await supa
        .from("user_wallet_balances")
        .select("xp_booster_until")
        .eq("user_id", audit.user_id)
        .maybeSingle()
        
      const current = wal0?.xp_booster_until ? new Date(wal0.xp_booster_until) : null
      const newUntil = current && current > new Date() 
        ? new Date(Math.max(current.getTime(), until.getTime())) 
        : until
        
      const { error: upErr } = await supa
        .from("user_wallet_balances")
        .upsert({ 
          user_id: audit.user_id, 
          xp_booster_until: newUntil.toISOString(), 
          updated_at: nowIso 
        })
        
      if (upErr) {
        console.error("XP Booster wallet update error:", upErr)
        await logMetrics(requestId, 500, startTime, "xp_booster_update_error")
        return new Response(upErr.message, { status: 500 })
      }
      
      console.log(`Added XP booster for ${audit.user_id}, until: ${newUntil.toISOString()}`)
      
    } else {
      await logMetrics(requestId, 400, startTime, "sku_not_claimable")
      return new Response("sku not claimable", { status: 400 })
    }

    // Mark claimed
    const { error: markErr } = await supa
      .from("purchase_claims")
      .insert({ 
        tx_id, 
        user_id: audit.user_id, 
        sku 
      })
      
    if (markErr) {
      console.error("Claim marking error:", markErr)
      await logMetrics(requestId, 500, startTime, "claim_marking_error")
      return new Response(markErr.message, { status: 500 })
    }

    // Return updated wallet
    const { data: wallet } = await supa
      .from("user_wallet_balances")
      .select("*")
      .eq("user_id", audit.user_id)
      .maybeSingle()
      
    console.log(`Successfully claimed ${sku} for ${audit.user_id}`)
    await logMetrics(requestId, 200, startTime)
    return Response.json(wallet ?? { 
      user_id: audit.user_id, 
      streakshield_count: sku === "consumable_streakshield_1" ? 1 : 0, 
      xp_booster_until: null 
    })
    
  } catch (error) {
    console.error("Claim processing error:", error)
    await logMetrics(requestId, 500, startTime, "internal_error")
    return new Response("internal error", { status: 500 })
  }
})