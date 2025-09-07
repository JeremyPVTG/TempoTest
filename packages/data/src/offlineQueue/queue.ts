import { nextDelayMs } from './backoff'
import type { MutOp, QueueSnapshot } from './types'
import type { Repo } from './runner'
import { runOp } from './runner'
import { DataError } from '../types/errors'
import type { StorageDriver } from './storage'

export const PERMANENT_CODES = new Set(['E.RLS_FORBIDDEN', 'E.VALIDATION_FAILED'])
export function isPermanent(code?: string) {
  return !!code && PERMANENT_CODES.has(code)
}

export function createQueue(storage: StorageDriver, repo: Repo, opts: { maxAttempts?: number } = {}) {
  const maxAttempts = opts.maxAttempts ?? 4
  let draining = false

  async function read(): Promise<QueueSnapshot> {
    try {
      return await storage.read()
    } catch {
      return { ops: [] }
    }
  }
  async function write(s: QueueSnapshot) {
    await storage.write(s)
  }

  async function enqueue(op: Omit<MutOp, 'id' | 'enqueuedAt' | 'attempt'>) {
    const snap = await read()
    if (snap.ops.some((o) => o.idempotencyKey === op.idempotencyKey)) return
    const id = (globalThis.crypto as any)?.randomUUID?.() ?? String(Date.now())
    snap.ops.push({ ...op, id, enqueuedAt: Date.now(), attempt: 0 })
    await write(snap)
  }

  async function drain(signal?: AbortSignal) {
    if (draining) return
    draining = true
    try {
      let snap = await read()
      while (snap.ops.length) {
        const op = snap.ops[0]
        try {
          await runOp(repo, op)
          snap.ops.shift()
          await write(snap)
        } catch (e: unknown) {
          const code = e instanceof DataError ? e.code : (e as any)?.code
          if (isPermanent(code)) {
            snap.ops.shift()
            await write(snap)
          } else {
            op.attempt += 1
            if (op.attempt >= maxAttempts) {
              snap.ops.shift()
              await write(snap)
            } else {
              const delay = nextDelayMs(op.attempt)
              await new Promise((r) => setTimeout(r, delay))
            }
          }
        }
        if (signal?.aborted) break
        snap = await read()
      }
    } finally {
      draining = false
    }
  }

  async function clear() {
    await storage.clear()
  }

  return { enqueue, drain, clear, read }
}


