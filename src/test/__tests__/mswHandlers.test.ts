import { server } from '@/test/setup'
import { handlers } from '@/test/mocks/handlers'

beforeAll(() => {
  server.use(...handlers)
})

afterAll(() => {
  // nothing
})

describe('MSW handlers', () => {
  it('lists habits', async () => {
    const res = await fetch('/api/habits')
    const data = await res.json()
    expect(Array.isArray(data)).toBe(true)
    expect(data.length).toBeGreaterThan(0)
    expect(data[0]).toHaveProperty('name')
  })

  it('marks task as complete', async () => {
    const res = await fetch('/api/tasks/task-99/complete', { method: 'POST' })
    const data = await res.json()
    expect(data).toMatchObject({ id: 'task-99', completed: true, xpEarned: 50 })
  })

  it('gets user stats', async () => {
    const res = await fetch('/api/user/stats')
    const data = await res.json()
    expect(data).toMatchObject({ totalXP: 1250, level: 5 })
  })
})
