import { describe, it, expect } from 'vitest'
import { achievementRules } from '../achievements'

describe('achievementRules', () => {
  it('evaluates first completion achievement', () => {
    const state = [{ id: 'h1', title: 'Read', __optimistic_marked: true, total_completions: 0 }]
    const event = { habit_id: 'h1', occurred_at: '2024-01-01T12:00:00Z', event_type: 'mark_done' as const }
    
    const result = achievementRules.evaluate(state, event)
    
    expect(result.new).toHaveLength(1)
    expect(result.new[0].type).toBe('first_complete')
    expect(result.new[0].title).toBe('First Step')
  })

  it('evaluates streak achievements', () => {
    const state = [{ 
      id: 'h1', 
      title: 'Read', 
      __optimistic_marked: true, 
      current_streak: 2, 
      total_completions: 3,
      last_completed_at: '2024-01-01T12:00:00Z'
    }]
    const event = { habit_id: 'h1', occurred_at: '2024-01-02T12:00:00Z', event_type: 'mark_done' as const }
    
    const result = achievementRules.evaluate(state, event)
    
    const streak3Achievement = result.new.find(a => a.type === 'streak_3')
    expect(streak3Achievement).toBeDefined()
    expect(streak3Achievement?.title).toBe('3-Day Streak')
  })

  it('evaluates perfect week achievement', () => {
    const state = [
      { id: 'h1', title: 'Read', __optimistic_marked: true },
      { id: 'h2', title: 'Exercise', __optimistic_marked: true }
    ]
    const event = { habit_id: 'h1', occurred_at: '2024-01-01T12:00:00Z', event_type: 'mark_done' as const }
    
    const result = achievementRules.evaluate(state, event)
    
    const perfectWeekAchievement = result.new.find(a => a.type === 'perfect_week')
    expect(perfectWeekAchievement).toBeDefined()
    expect(perfectWeekAchievement?.title).toBe('Perfect Week')
  })

  it('evaluates comeback achievement', () => {
    const eightDaysAgo = new Date()
    eightDaysAgo.setDate(eightDaysAgo.getDate() - 8)
    
    const state = [{ 
      id: 'h1', 
      title: 'Read', 
      __optimistic_marked: true,
      last_completed_at: eightDaysAgo.toISOString()
    }]
    const event = { habit_id: 'h1', occurred_at: new Date().toISOString(), event_type: 'mark_done' as const }
    
    const result = achievementRules.evaluate(state, event)
    
    const comebackAchievement = result.new.find(a => a.type === 'comeback')
    expect(comebackAchievement).toBeDefined()
    expect(comebackAchievement?.title).toBe('Comeback Kid')
  })

  it('returns empty array for invalid state', () => {
    const result = achievementRules.evaluate(null)
    expect(result.new).toEqual([])
    expect(result.existing).toEqual([])
  })

  it('returns empty array for undo events', () => {
    const state = [{ id: 'h1', title: 'Read' }]
    const event = { habit_id: 'h1', occurred_at: '2024-01-01T12:00:00Z', event_type: 'undo' as const }
    
    const result = achievementRules.evaluate(state, event)
    expect(result.new).toEqual([])
  })
})