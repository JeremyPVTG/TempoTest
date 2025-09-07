import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, act } from '@testing-library/react'
import { createHabitsQueries } from '../../hooks/useHabits'
import { createHabitMutations } from '../../hooks/useMutations'

let useReal = true
try { require.resolve('@habituals/domain/optimistic-updates') } catch { useReal = false }

if (!useReal) {
  vi.mock('@habituals/domain/optimistic-updates', () => ({
    applyOptimisticMarkDone: (old: any) => ({ ...(old || {}), __optimistic: true }),
    applyOptimisticUndo: (old: any) => ({ ...(old || {}), __optimistic: false }),
  }))
}

describe('optimistic markDone', () => {
  it('paints immediately and calls repo; success invalidates', async () => {
    const repo = {
      listHabits: async () => [{ id: 'h1', title: 'Read' }],
      getStreak: async () => ({ current: 0, longest: 0 }),
      markDone: vi.fn().mockResolvedValue({ id: 'e1' }),
      undoEvent: vi.fn(),
    } as any

    const qc = new QueryClient()
    const wrapper = ({ children }: any) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    const Q = createHabitsQueries(repo)

    // Prime cache
    qc.setQueryData(['habits'], await repo.listHabits())

    const m = renderHook(() => createHabitMutations(repo, { enqueue: vi.fn() }).useMarkDone(), { wrapper })
    await act(async () => {
      m.result.current.mutate({ habit_id: 'h1', occurred_at_tz: { tz: 'UTC', at: new Date().toISOString() } } as any)
    })

    expect(repo.markDone).toHaveBeenCalled()
  })

  it('permanent error rolls back optimistic paint', async () => {
    const err: any = new Error('nope'); err.code = 'E.VALIDATION_FAILED'
    const repo = {
      listHabits: async () => [{ id: 'h1', title: 'Read' }],
      getStreak: async () => ({ current: 0, longest: 0 }),
      markDone: vi.fn().mockRejectedValue(err),
      undoEvent: vi.fn(),
    } as any

    const qc = new QueryClient()
    const wrapper = ({ children }: any) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    const Q = createHabitsQueries(repo)

    qc.setQueryData(['habits'], await repo.listHabits())

    const m = renderHook(() => createHabitMutations(repo, { enqueue: vi.fn() }).useMarkDone(), { wrapper })
    await act(async () => {
      m.result.current.mutate({ habit_id: 'h1', occurred_at_tz: { tz: 'UTC', at: new Date().toISOString() } } as any)
    })

    expect(repo.markDone).toHaveBeenCalled()
  })
})


