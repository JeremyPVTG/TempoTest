import { http, HttpResponse } from 'msw'

export const handlers = [
  // Mock API endpoints
  http.get('/api/habits', () => {
    return HttpResponse.json([
      {
        id: 'habit-1',
        name: 'Morning Exercise',
        currentStreak: 5,
        longestStreak: 10,
        icon: '🏃',
        color: 'blue'
      },
      {
        id: 'habit-2',
        name: 'Read Daily',
        currentStreak: 3,
        longestStreak: 15,
        icon: '📚',
        color: 'green'
      }
    ])
  }),

  http.get('/api/tasks/today', () => {
    return HttpResponse.json([
      {
        id: 'task-1',
        title: 'Complete workout',
        completed: false,
        xpReward: 50,
        category: 'fitness'
      },
      {
        id: 'task-2',
        title: 'Read for 30 minutes',
        completed: true,
        xpReward: 30,
        category: 'learning'
      }
    ])
  }),

  http.get('/api/achievements', () => {
    return HttpResponse.json([
      {
        id: 'achievement-1',
        title: 'First Steps',
        description: 'Complete your first habit',
        icon: '🏆',
        unlocked: true,
        progress: 100
      },
      {
        id: 'achievement-2',
        title: 'Week Warrior',
        description: 'Maintain a 7-day streak',
        icon: '⚡',
        unlocked: false,
        progress: 71
      }
    ])
  }),

  http.post('/api/tasks/:id/complete', ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      completed: true,
      xpEarned: 50
    })
  }),

  http.get('/api/user/stats', () => {
    return HttpResponse.json({
      totalXP: 1250,
      level: 5,
      weeklyGoal: 1000,
      weeklyProgress: 750
    })
  })
]