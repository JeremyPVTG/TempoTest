export function applyOptimisticMarkDone(state: unknown, input: unknown): unknown {
  if (!state || typeof state !== 'object') return state
  
  const payload = input as any
  if (Array.isArray(state)) {
    // Handle habits array - mark habit as completed for today
    return (state as any[]).map(habit => {
      if (habit.id === payload.habit_id) {
        return {
          ...habit,
          __optimistic_marked: true,
          last_completed_at: payload.occurred_at_tz?.at || new Date().toISOString()
        }
      }
      return habit
    })
  }
  
  // Handle streak data - increment current streak
  if ('current' in (state as any) && 'longest' in (state as any)) {
    const streak = state as any
    const newCurrent = (streak.current || 0) + 1
    return {
      ...streak,
      __optimistic_marked: true,
      current: newCurrent,
      longest: Math.max(streak.longest || 0, newCurrent)
    }
  }
  
  return state
}

export function applyOptimisticUndo(state: unknown, input: unknown): unknown {
  if (!state || typeof state !== 'object') return state
  
  const payload = input as any
  if (Array.isArray(state)) {
    // Handle habits array - remove optimistic marking
    return (state as any[]).map(habit => {
      if (payload.habit_id && habit.id === payload.habit_id) {
        const { __optimistic_marked, ...rest } = habit
        return rest
      }
      if (payload.event_id) {
        // For event-based undo, just remove optimistic flag
        const { __optimistic_marked, ...rest } = habit
        return rest
      }
      return habit
    })
  }
  
  // Handle streak data - remove optimistic increment
  if ('current' in (state as any) && 'longest' in (state as any)) {
    const { __optimistic_marked, ...streak } = state as any
    if (__optimistic_marked) {
      return {
        ...streak,
        current: Math.max(0, (streak.current || 0) - 1)
      }
    }
  }
  
  return state
}