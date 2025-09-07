import { z } from 'zod'
// Placeholder imports; replace with real api-contracts module when available
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import type { ZodTypeAny } from 'zod'

type AnyZ<T> = ZodTypeAny & { _output: T }

// Minimal local Zod placeholders for scaffolding only
const HabitZ = z.object({ id: z.string(), title: z.string().optional() })
export type Habit = z.infer<typeof HabitZ>
const NewHabitInputZ = z.object({ title: z.string() })
export type NewHabitInput = z.infer<typeof NewHabitInputZ>
const UpdateHabitInputZ = z.object({ title: z.string().optional() })
export type UpdateHabitInput = z.infer<typeof UpdateHabitInputZ>
const HabitEventZ = z.object({ id: z.string(), habit_id: z.string() })
export type HabitEvent = z.infer<typeof HabitEventZ>
const MarkDoneInputZ = z.object({
  habit_id: z.string(),
  idempotency_key: z.string().uuid(),
  occurred_at_tz: z.object({ tz: z.string(), at: z.string() }),
})
export type MarkDoneInput = z.infer<typeof MarkDoneInputZ>
const StreakSummaryZ = z.object({ habit_id: z.string(), current: z.number(), longest: z.number() })
export type StreakSummary = z.infer<typeof StreakSummaryZ>
const AchievementZ = z.object({ id: z.string(), title: z.string() })
export type Achievement = z.infer<typeof AchievementZ>

export type HabitsRepo = ReturnType<typeof makeHabitsRepo>

export function makeHabitsRepo(client: { request: <T>(op: (c: any) => Promise<{ data: unknown; error: unknown }>, parse: AnyZ<T>) => Promise<T> }) {
  return {
    listHabits: () => client.request((c) => c.from('habits').select('*'), z.array(HabitZ)),
    createHabit: (input: NewHabitInput) =>
      client.request((c) => c.from('habits').insert(input).select().single(), HabitZ),
    updateHabit: (id: string, patch: UpdateHabitInput) =>
      client.request((c) => c.from('habits').update(patch).eq('id', id).select().single(), HabitZ),
    deleteHabit: (id: string) =>
      client.request((c) => c.from('habits').delete().eq('id', id).select().single(), HabitZ),
    markDone: (input: MarkDoneInput) =>
      client.request((c) => c.rpc('mark_habit_done', input), HabitEventZ),
    undoEvent: (eventId: string) =>
      client.request((c) => c.rpc('undo_habit_event', { event_id: eventId }), HabitEventZ),
    getStreak: (habitId: string) =>
      client.request((c) => c.rpc('get_streak_summary', { habit_id: habitId }), StreakSummaryZ),
    getAchievementsFeed: (cursor?: string) =>
      client.request((c) => c.rpc('get_achievements_feed', { cursor }), z.array(AchievementZ)),
  }
}


