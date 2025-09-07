import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/utils'
import Dashboard from '../Dashboard'

describe('Dashboard Component - Simple Tests', () => {
  it('renders without crashing', () => {
    render(<Dashboard />)
    expect(screen.getByText('User')).toBeInTheDocument()
  })

  it('displays default user information', () => {
    render(<Dashboard />)
    
    expect(screen.getByText('User')).toBeInTheDocument()
    expect(screen.getByText('Level 5 Explorer')).toBeInTheDocument()
  })

  it('displays custom username when provided', () => {
    render(<Dashboard username="John Doe" />)
    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })

  it('displays custom level when provided', () => {
    render(<Dashboard level={10} />)
    expect(screen.getByText('Level 10 Explorer')).toBeInTheDocument()
  })

  it('renders main sections', () => {
    render(<Dashboard />)
    
    expect(screen.getByText('Level Progress')).toBeInTheDocument()
    expect(screen.getByText('Habit Streaks')).toBeInTheDocument()
    expect(screen.getByText("Today's Tasks")).toBeInTheDocument()
    expect(screen.getByText('Achievements')).toBeInTheDocument()
  })

  it('renders default habits', () => {
    render(<Dashboard />)
    
    expect(screen.getByText('Morning Meditation')).toBeInTheDocument()
    expect(screen.getByText('Daily Exercise')).toBeInTheDocument()
    expect(screen.getByText('Reading')).toBeInTheDocument()
    expect(screen.getByText('Drink Water')).toBeInTheDocument()
  })

  it('renders default tasks', () => {
    render(<Dashboard />)
    
    expect(screen.getByText('Complete 10 minutes meditation')).toBeInTheDocument()
    expect(screen.getByText('Go for a 30 minute walk')).toBeInTheDocument()
    expect(screen.getByText('Read 20 pages')).toBeInTheDocument()
  })

  it('renders default achievements', () => {
    render(<Dashboard />)
    
    expect(screen.getByText('Early Bird')).toBeInTheDocument()
    expect(screen.getByText('Fitness Fanatic')).toBeInTheDocument()
    expect(screen.getByText('Bookworm')).toBeInTheDocument()
  })

  it('has the correct number of interactive elements', () => {
    render(<Dashboard />)
    
    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes.length).toBeGreaterThan(0)
    
    const progressbars = screen.getAllByRole('progressbar')
    expect(progressbars.length).toBeGreaterThan(0)
  })

  it('renders user avatar', () => {
    render(<Dashboard username="Alice" />)
    
    const avatar = screen.getByText('A')
    expect(avatar).toBeInTheDocument()
  })
})