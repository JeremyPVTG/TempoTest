export type MutKind = 'createHabit' | 'updateHabit' | 'deleteHabit' | 'markDone' | 'undoEvent'

export type MutOp = {
  id: string
  kind: MutKind
  input: unknown
  idempotencyKey: string
  enqueuedAt: number
  attempt: number
}

export type QueueSnapshot = { ops: MutOp[] }


