/* eslint-disable react-refresh/only-export-components */
import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {}

// Custom render function with providers
function customRender(
  ui: ReactElement,
  renderOptions: CustomRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <BrowserRouter>
        {children}
      </BrowserRouter>
    )
  }
  
  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }

// Helper functions for common test scenarios
export const createMockHabitStreak = (overrides = {}) => ({
  id: 'habit-1',
  name: 'Morning Exercise',
  currentStreak: 5,
  longestStreak: 10,
  icon: '🏃',
  color: 'blue',
  ...overrides
})

export const createMockDailyTask = (overrides = {}) => ({
  id: 'task-1',
  title: 'Complete workout',
  completed: false,
  xpReward: 50,
  category: 'fitness',
  ...overrides
})

export const createMockAchievement = (overrides = {}) => ({
  id: 'achievement-1',
  title: 'First Steps',
  description: 'Complete your first habit',
  icon: '🏆',
  unlocked: false,
  progress: 0,
  ...overrides
})