import type { MutOp } from './types'
import type { HabitsRepo } from '../repositories/habitsRepo'

export type Repo = HabitsRepo

export async function runOp(repo: Repo, op: MutOp) {
  switch (op.kind) {
    case 'createHabit':
      return repo.createHabit(op.input as any)
    case 'updateHabit': {
      const { id, patch } = op.input as any
      return repo.updateHabit(id, patch)
    }
    case 'deleteHabit':
      return repo.deleteHabit(op.input as string)
    case 'markDone':
      return repo.markDone(op.input as any)
    case 'undoEvent':
      return repo.undoEvent(op.input as string)
  }
}


