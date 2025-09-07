export type EnqueueFn = (op: {
  kind: 'createHabit' | 'updateHabit' | 'deleteHabit' | 'markDone' | 'undoEvent'
  input: unknown
  idempotencyKey: string
}) => Promise<void> | void


