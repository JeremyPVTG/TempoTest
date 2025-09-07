import { describe, it, expect } from 'vitest'
import { createQueue } from '../queue'

class MemDriver {
  snap = { ops: [] as any[] }
  async read() { return this.snap }
  async write(s: any) { this.snap = s }
  async clear() { this.snap = { ops: [] } }
}

function fakeRepo({ failTimes = 0, code = 'E.UNKNOWN' } = {}) {
  let calls = 0
  return {
    calls: () => calls,
    async createHabit() { calls++; return { ok: true } },
    async updateHabit() { calls++; return { ok: true } },
    async deleteHabit() { calls++; return { ok: true } },
    async markDone() { calls++; if (calls <= failTimes) { const e: any = new Error('x'); e.code = code; throw e } return { ok: true } },
    async undoEvent() { calls++; return { ok: true } },
  } as any
}

describe('offline queue', () => {
  it('de-dupes by idempotencyKey', async () => {
    const q = createQueue(new MemDriver() as any, fakeRepo())
    await q.enqueue({ kind: 'markDone', input: {}, idempotencyKey: 'same' })
    await q.enqueue({ kind: 'markDone', input: {}, idempotencyKey: 'same' })
    const snap = await q.read()
    expect(snap.ops.length).toBe(1)
  })

  it('retries transient errors then succeeds', async () => {
    const repo = fakeRepo({ failTimes: 1, code: 'E.NETWORK_OFFLINE' })
    const q = createQueue(new MemDriver() as any, repo)
    await q.enqueue({ kind: 'markDone', input: {}, idempotencyKey: 'a' })
    await q.drain()
    expect(repo.calls()).toBeGreaterThan(1)
    const snap = await q.read()
    expect(snap.ops.length).toBe(0)
  })

  it('drops permanent errors', async () => {
    const repo = fakeRepo({ failTimes: 2, code: 'E.VALIDATION_FAILED' })
    const q = createQueue(new MemDriver() as any, repo)
    await q.enqueue({ kind: 'markDone', input: {}, idempotencyKey: 'b' })
    await q.drain()
    const snap = await q.read()
    expect(snap.ops.length).toBe(0)
  })
})


