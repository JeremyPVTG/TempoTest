export interface Achievement {
  id: string
  title: string
  description: string
  type: 'first_complete' | 'streak_3' | 'streak_7' | 'streak_30' | 'weekly_goal' | 'monthly_goal' | 'perfect_week' | 'comeback'
}

export interface AchievementEvent {
  habit_id: string
  occurred_at: string
  event_type: 'mark_done' | 'undo'
}

export interface EvaluationResult {
  new: Achievement[]
  existing: Achievement[]
}

const ACHIEVEMENT_DEFINITIONS: Record<string, Omit<Achievement, 'id'>> = {
  first_complete: {
    title: 'First Step',
    description: 'Completed your first habit!',
    type: 'first_complete'
  },
  streak_3: {
    title: '3-Day Streak',
    description: 'Keep the momentum going!',
    type: 'streak_3'
  },
  streak_7: {
    title: 'Week Warrior',
    description: '7 days in a row - impressive!',
    type: 'streak_7'
  },
  streak_30: {
    title: 'Month Master',
    description: '30 days straight - legendary!',
    type: 'streak_30'
  },
  weekly_goal: {
    title: 'Weekly Champion',
    description: 'Hit your weekly target!',
    type: 'weekly_goal'
  },
  monthly_goal: {
    title: 'Monthly Hero',
    description: 'Crushed your monthly goal!',
    type: 'monthly_goal'
  },
  perfect_week: {
    title: 'Perfect Week',
    description: 'All habits completed this week!',
    type: 'perfect_week'
  },
  comeback: {
    title: 'Comeback Kid',
    description: 'Back on track after a break!',
    type: 'comeback'
  }
}

function getCurrentStreak(habit: any): number {
  return habit.current_streak || habit.__optimistic_marked ? (habit.current_streak || 0) + 1 : 0
}

function hasCompletedToday(habit: any): boolean {
  if (habit.__optimistic_marked) return true
  
  if (!habit.last_completed_at) return false
  
  const today = new Date().toISOString().split('T')[0]
  const lastCompleted = new Date(habit.last_completed_at).toISOString().split('T')[0]
  return today === lastCompleted
}

export const achievementRules = {
  evaluate(state: any, event?: AchievementEvent): EvaluationResult {
    const new_achievements: Achievement[] = []
    
    if (!state || !Array.isArray(state)) {
      return { new: new_achievements, existing: [] }
    }
    
    const habits = state as any[]
    
    // Find the habit that was just completed
    const targetHabit = event ? habits.find(h => h.id === event.habit_id) : null
    
    if (targetHabit && event?.event_type === 'mark_done') {
      const streak = getCurrentStreak(targetHabit)
      const isFirstEver = !targetHabit.total_completions || targetHabit.total_completions === 0
      
      // First completion achievement
      if (isFirstEver || (targetHabit.__optimistic_marked && !targetHabit.last_completed_at)) {
        new_achievements.push({
          id: `first_${targetHabit.id}`,
          ...ACHIEVEMENT_DEFINITIONS.first_complete
        })
      }
      
      // Streak achievements
      if (streak === 3) {
        new_achievements.push({
          id: `streak3_${targetHabit.id}_${Date.now()}`,
          ...ACHIEVEMENT_DEFINITIONS.streak_3
        })
      } else if (streak === 7) {
        new_achievements.push({
          id: `streak7_${targetHabit.id}_${Date.now()}`,
          ...ACHIEVEMENT_DEFINITIONS.streak_7
        })
      } else if (streak === 30) {
        new_achievements.push({
          id: `streak30_${targetHabit.id}_${Date.now()}`,
          ...ACHIEVEMENT_DEFINITIONS.streak_30
        })
      }
      
      // Perfect week check - all habits completed today
      const allHabitsCompletedToday = habits.every(hasCompletedToday)
      if (allHabitsCompletedToday && habits.length > 1) {
        new_achievements.push({
          id: `perfect_week_${Date.now()}`,
          ...ACHIEVEMENT_DEFINITIONS.perfect_week
        })
      }
      
      // Comeback achievement - returning after 7+ days gap
      if (targetHabit.last_completed_at) {
        const daysSinceLastCompletion = Math.floor(
          (new Date().getTime() - new Date(targetHabit.last_completed_at).getTime()) / (1000 * 60 * 60 * 24)
        )
        if (daysSinceLastCompletion >= 7) {
          new_achievements.push({
            id: `comeback_${targetHabit.id}_${Date.now()}`,
            ...ACHIEVEMENT_DEFINITIONS.comeback
          })
        }
      }
    }
    
    return { new: new_achievements, existing: [] }
  }
}

export function makeIdempotencyKey(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}