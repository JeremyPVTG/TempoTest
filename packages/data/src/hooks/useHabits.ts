import { useQuery } from '@tanstack/react-query'
import type { HabitsRepo } from '../repositories/habitsRepo'

export function createHabitsQueries(repo: HabitsRepo) {
  return {
    useHabits: () =>
      useQuery({ queryKey: ['habits'], queryFn: repo.listHabits, staleTime: 15_000 }),
    useStreak: (habitId: string | null | undefined) =>
      useQuery({
        queryKey: ['streak', habitId],
        queryFn: () => repo.getStreak(String(habitId)),
        enabled: !!habitId,
      }),
  }
}


