import React from 'react'
import { Q, M } from '../lib/data'
import { QueueDebug } from "../debug/QueueDebug"

export default function HabitsDemo() {
  const { data: habits } = Q.useHabits()
  const markDone = M.useMarkDone()

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
  const at = new Date().toISOString()

  return (
    <div className="p-4 space-y-2">
      <h2 className="text-lg font-semibold">Habits</h2>
      <ul className="space-y-1">
        {(habits ?? []).map((h: any) => (
          <li key={h.id} className="flex items-center gap-2">
            <span>{h.title ?? h.id}</span>
            <button
              className="px-2 py-1 border rounded"
              onClick={() => markDone.mutate({ habit_id: h.id, occurred_at_tz: { tz, at }, idempotency_key: (crypto as any).randomUUID?.() ?? String(Date.now()) } as any)}
            >
              Mark done
            </button>
          </li>
        ))}
      </ul>
      <QueueDebug />
    </div>
  )
}


