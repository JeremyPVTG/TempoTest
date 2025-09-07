import { describe, it, expect } from 'vitest'
import { applyOptimisticMarkDone, applyOptimisticUndo } from '../optimistic-updates'

describe('optimistic updates', () => {
  describe('applyOptimisticMarkDone', () => {
    it('marks habit as completed in habits array', () => {
      const state = [
        { id: 'h1', title: 'Read', current_streak: 2 },
        { id: 'h2', title: 'Exercise', current_streak: 1 }
      ]
      const input = { habit_id: 'h1', occurred_at_tz: { tz: 'UTC', at: '2024-01-01T12:00:00Z' } }
      
      const result = applyOptimisticMarkDone(state, input) as any[]
      
      expect(result[0]).toEqual({
        id: 'h1',
        title: 'Read',
        current_streak: 2,
        __optimistic_marked: true,
        last_completed_at: '2024-01-01T12:00:00Z'
      })
      expect(result[1]).toEqual(state[1]) // Other habits unchanged
    })

    it('increments streak data', () => {
      const state = { current: 2, longest: 5 }
      const input = { habit_id: 'h1', occurred_at_tz: { tz: 'UTC', at: '2024-01-01T12:00:00Z' } }
      
      const result = applyOptimisticMarkDone(state, input) as any
      
      expect(result).toEqual({
        current: 3,
        longest: 5,
        __optimistic_marked: true
      })
    })

    it('updates longest streak when current exceeds it', () => {
      const state = { current: 4, longest: 4 }
      const input = { habit_id: 'h1' }
      
      const result = applyOptimisticMarkDone(state, input) as any
      
      expect(result.current).toBe(5)
      expect(result.longest).toBe(5)
    })

    it('handles invalid state gracefully', () => {
      expect(applyOptimisticMarkDone(null, {})).toBe(null)
      expect(applyOptimisticMarkDone(undefined, {})).toBe(undefined)
      expect(applyOptimisticMarkDone('string', {})).toBe('string')
    })
  })

  describe('applyOptimisticUndo', () => {
    it('removes optimistic marking from habits array by habit_id', () => {
      const state = [
        { id: 'h1', title: 'Read', __optimistic_marked: true },
        { id: 'h2', title: 'Exercise', current_streak: 1 }
      ]
      const input = { habit_id: 'h1' }
      
      const result = applyOptimisticUndo(state, input) as any[]
      
      expect(result[0]).toEqual({ id: 'h1', title: 'Read' })
      expect(result[1]).toEqual(state[1])
    })

    it('removes optimistic marking from habits array by event_id', () => {
      const state = [
        { id: 'h1', title: 'Read', __optimistic_marked: true },
        { id: 'h2', title: 'Exercise', current_streak: 1 }
      ]
      const input = { event_id: 'e1' }
      
      const result = applyOptimisticUndo(state, input) as any[]
      
      expect(result[0]).toEqual({ id: 'h1', title: 'Read' })
    })

    it('decrements streak data', () => {
      const state = { current: 3, longest: 5, __optimistic_marked: true }
      const input = { habit_id: 'h1' }
      
      const result = applyOptimisticUndo(state, input) as any
      
      expect(result).toEqual({ current: 2, longest: 5 })
    })

    it('does not decrement if not optimistically marked', () => {
      const state = { current: 3, longest: 5 }
      const input = { habit_id: 'h1' }
      
      const result = applyOptimisticUndo(state, input) as any
      
      expect(result).toEqual({ current: 3, longest: 5 })
    })

    it('handles minimum streak of 0', () => {
      const state = { current: 0, longest: 5, __optimistic_marked: true }
      const input = { habit_id: 'h1' }
      
      const result = applyOptimisticUndo(state, input) as any
      
      expect(result.current).toBe(0)
    })
  })
})