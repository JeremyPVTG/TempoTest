import { createMockHabitStreak, createMockDailyTask, createMockAchievement } from '@/test/utils'

describe('test utils factories', () => {
  it('creates a mock habit streak with overrides', () => {
    const item = createMockHabitStreak({ id: 'h1', currentStreak: 9 })
    expect(item).toMatchObject({ id: 'h1', currentStreak: 9, name: expect.any(String) })
  })

  it('creates a mock daily task with overrides', () => {
    const task = createMockDailyTask({ id: 't2', completed: true })
    expect(task).toMatchObject({ id: 't2', completed: true, title: expect.any(String) })
  })

  it('creates a mock achievement with overrides', () => {
    const a = createMockAchievement({ id: 'a9', unlocked: true })
    expect(a).toMatchObject({ id: 'a9', unlocked: true, title: expect.any(String) })
  })
})
