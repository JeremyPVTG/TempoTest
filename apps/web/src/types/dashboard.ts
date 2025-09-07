import React from 'react'

export interface HabitStreak {
  id: string
  name: string
  currentStreak: number
  longestStreak: number
  icon: React.ReactNode | string
  color: string
}

export interface DailyTask {
  id: string
  title: string
  completed: boolean
  xpReward: number
  category: string
}

export interface Achievement {
  id: string
  title: string
  description: string
  icon: React.ReactNode | string
  unlocked: boolean
  progress: number
}

export interface UserStats {
  totalXP: number
  level: number
  weeklyGoal: number
  weeklyProgress: number
  tasksCompleted?: number
  habitsActive?: number
}