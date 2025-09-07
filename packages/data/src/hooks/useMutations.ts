import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { HabitsRepo, MarkDoneInput, UpdateHabitInput } from '../repositories/habitsRepo'
import type { EnqueueFn } from '../types/queue'
import { isPermanent } from '../offlineQueue/queue'
import { applyOptimisticMarkDone, applyOptimisticUndo, achievementRules } from '@habituals/domain'
import type { DataError } from '../types/errors'
import { toastEmit } from '../events/toastBus'

export function createHabitMutations(repo: HabitsRepo, opts?: { enqueue?: EnqueueFn }) {
  const enqueue: EnqueueFn = opts?.enqueue ?? (() => {})
  return {
    useCreateHabit: () => {
      const qc = useQueryClient()
      return useMutation({
        mutationFn: repo.createHabit,
        onSuccess: () => qc.invalidateQueries({ queryKey: ['habits'] }),
      })
    },
    useUpdateHabit: () => {
      const qc = useQueryClient()
      return useMutation({
        mutationFn: ({ id, patch }: { id: string; patch: UpdateHabitInput }) => repo.updateHabit(id, patch),
        onSuccess: (_d, { id }: { id: string; patch: UpdateHabitInput }) => {
          qc.invalidateQueries({ queryKey: ['habits'] })
          qc.invalidateQueries({ queryKey: ['streak', id] })
        },
      })
    },
    useDeleteHabit: () => {
      const qc = useQueryClient()
      return useMutation({
        mutationFn: repo.deleteHabit,
        onSuccess: () => qc.invalidateQueries({ queryKey: ['habits'] }),
      })
    },
    useMarkDone: () => {
      const qc = useQueryClient()
      return useMutation({
        mutationFn: async (payload: MarkDoneInput) => {
          const input = payload // idempotency key expected upstream
          const habitsKey = ['habits'] as const
          const prevHabits = qc.getQueryData(habitsKey)
          qc.setQueryData(habitsKey, (old: unknown) => applyOptimisticMarkDone(old, input))

          const streakKey = ['streak', payload.habit_id] as const
          const prevStreak = qc.getQueryData(streakKey)
          qc.setQueryData(streakKey, (old: unknown) => applyOptimisticMarkDone(old, input))

          await Promise.resolve(enqueue({ kind: 'markDone', input, idempotencyKey: (input as any).idempotency_key }))
          const event = await repo.markDone(input)
          return { event, ctx: { habitsKey, prevHabits, streakKey, prevStreak, payload: input } }
        },
        onSuccess: async (res, variables) => {
          await qc.invalidateQueries({ queryKey: ['habits'] })
          await qc.invalidateQueries({ queryKey: ['streak', variables.habit_id] })
          
          // Evaluate achievements and emit toasts
          const habits = qc.getQueryData<any>(['habits'])
          if (habits && res?.event) {
            const achievementResult = achievementRules.evaluate(habits, {
              habit_id: variables.habit_id,
              occurred_at: variables.occurred_at_tz?.at || new Date().toISOString(),
              event_type: 'mark_done'
            })
            
            for (const achievement of achievementResult.new) {
              toastEmit({ 
                kind: 'achievement', 
                title: achievement.title, 
                subtitle: achievement.description 
              })
            }
          }
        },
        onError: async (err: any, variables, context: any) => {
          const dataError = err as DataError
          
          // Handle 409 conflict by invalidating caches (no rollback)
          if (dataError?.code === "E.CONFLICT_VERSION") {
            await qc.invalidateQueries({ queryKey: ["habits"] })
            await qc.invalidateQueries({ queryKey: ["streak", variables.habit_id] })
            return
          }
          
          // Handle permanent errors with rollback
          if (isPermanent(dataError?.code)) {
            if (context?.habitsKey) qc.setQueryData(context.habitsKey, context.prevHabits)
            if (context?.streakKey) qc.setQueryData(context.streakKey, context.prevStreak)
            qc.setQueryData(['habits'], (old: unknown) => applyOptimisticUndo(old, { habit_id: variables.habit_id }))
            qc.setQueryData(['streak', variables.habit_id], (old: unknown) => applyOptimisticUndo(old, { habit_id: variables.habit_id }))
          }
        },
      })
    },
    useUndoEvent: () => {
      const qc = useQueryClient()
      return useMutation({
        mutationFn: async (eventId: string & {}) => {
          const habitsKey = ['habits'] as const
          const prevHabits = qc.getQueryData(habitsKey)
          qc.setQueryData(habitsKey, (old: unknown) => applyOptimisticUndo(old, { event_id: eventId }))
          await Promise.resolve(enqueue({ kind: 'undoEvent', input: eventId, idempotencyKey: String(Date.now()) }))
          const event = await repo.undoEvent(eventId)
          return { event, ctx: { habitsKey, prevHabits } }
        },
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: ['habits'] })
        },
        onError: (err: any, _variables, context: any) => {
          if (isPermanent(err?.code)) {
            if (context?.habitsKey) qc.setQueryData(context.habitsKey, context.prevHabits)
          }
        },
      })
    },
  }
}


