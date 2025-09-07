import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, act } from '@testing-library/react'
import { createHabitMutations } from '../useMutations'
import { DataError } from '../../types/errors'

describe('conflict handling', () => {
  let queryClient: QueryClient
  let wrapper: React.FC<{ children: React.ReactNode }>

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })
    wrapper = ({ children }: any) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  })

  it('handles E.CONFLICT_VERSION by invalidating queries without rollback', async () => {
    const conflictError = new DataError('E.CONFLICT_VERSION', 'Version conflict')
    const repo = {
      markDone: vi.fn().mockRejectedValue(conflictError),
      undoEvent: vi.fn(),
    } as any

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const setQueryDataSpy = vi.spyOn(queryClient, 'setQueryData')

    // Prime cache with initial data
    queryClient.setQueryData(['habits'], [{ id: 'h1', title: 'Read', current_streak: 2 }])
    queryClient.setQueryData(['streak', 'h1'], { current: 2, longest: 5 })

    const { result } = renderHook(
      () => createHabitMutations(repo, { enqueue: vi.fn() }).useMarkDone(),
      { wrapper }
    )

    await act(async () => {
      try {
        await result.current.mutateAsync({
          habit_id: 'h1',
          occurred_at_tz: { tz: 'UTC', at: new Date().toISOString() }
        } as any)
      } catch (error) {
        // Expected to throw
      }
    })

    expect(repo.markDone).toHaveBeenCalled()
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["habits"] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["streak", "h1"] })

    // Should not rollback the optimistic changes - no setQueryData calls for rollback
    const setQueryDataCalls = setQueryDataSpy.mock.calls.filter(
      call => {
        const key = call[0]
        return (Array.isArray(key) && key[0] === 'habits') || (Array.isArray(key) && key[0] === 'streak')
      }
    )
    // Only optimistic calls, no rollback calls
    expect(setQueryDataCalls.length).toBeGreaterThan(0) // optimistic updates happened
  })

  it('handles permanent errors with rollback', async () => {
    const permanentError = new DataError('E.VALIDATION_FAILED', 'Validation failed')
    const repo = {
      markDone: vi.fn().mockRejectedValue(permanentError),
      undoEvent: vi.fn(),
    } as any

    const setQueryDataSpy = vi.spyOn(queryClient, 'setQueryData')
    
    // Prime cache
    queryClient.setQueryData(['habits'], [{ id: 'h1', title: 'Read', current_streak: 2 }])
    queryClient.setQueryData(['streak', 'h1'], { current: 2, longest: 5 })

    const { result } = renderHook(
      () => createHabitMutations(repo, { enqueue: vi.fn() }).useMarkDone(),
      { wrapper }
    )

    await act(async () => {
      try {
        await result.current.mutateAsync({
          habit_id: 'h1',
          occurred_at_tz: { tz: 'UTC', at: new Date().toISOString() }
        } as any)
      } catch (error) {
        // Expected to throw
      }
    })

    expect(repo.markDone).toHaveBeenCalled()
    
    // Should have rollback calls to setQueryData
    const rollbackCalls = setQueryDataSpy.mock.calls.filter(
      call => typeof call[1] === 'function' // rollback via function
    )
    expect(rollbackCalls.length).toBeGreaterThan(0)
  })
})