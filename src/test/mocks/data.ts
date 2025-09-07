import { HabitStreak, DailyTask, Achievement } from '@/types/dashboard'

export const mockHabitStreaks: HabitStreak[] = [
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
  },
  {
    id: 'habit-3',
    name: 'Meditation',
    currentStreak: 12,
    longestStreak: 20,
    icon: '🧘',
    color: 'purple'
  }
]

export const mockDailyTasks: DailyTask[] = [
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
  },
  {
    id: 'task-3',
    title: 'Practice meditation',
    completed: false,
    xpReward: 25,
    category: 'mindfulness'
  }
]

export const mockAchievements: Achievement[] = [
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
  },
  {
    id: 'achievement-3',
    title: 'Consistency King',
    description: 'Complete 100 tasks',
    icon: '👑',
    unlocked: false,
    progress: 45
  }
]

export const mockUserStats = {
  totalXP: 1250,
  level: 5,
  weeklyGoal: 1000,
  weeklyProgress: 750,
  tasksCompleted: 45,
  habitsActive: 3
}