import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/utils'
import Home from '../home'

describe('Home Component', () => {
  it('renders without crashing', () => {
    render(<Home />)
    expect(screen.getByText('HabitQuest')).toBeInTheDocument()
  })
  
  it('confirms testing infrastructure is working', () => {
    render(<Home />)
    expect(screen.getByText('HabitQuest')).toBeInTheDocument()
  })

  it('displays the main header', () => {
    render(<Home />)
    
    expect(screen.getByText('HabitQuest')).toBeInTheDocument()
    expect(screen.getByText('Level 7')).toBeInTheDocument()
  })

  it('renders navigation buttons', () => {
    render(<Home />)
    
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('displays daily progress section', () => {
    render(<Home />)
    
    expect(screen.getByText('Daily Progress')).toBeInTheDocument()
  })

  it('renders main navigation tabs', () => {
    render(<Home />)
    
    expect(screen.getByRole('tablist')).toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('AI Coach')).toBeInTheDocument()
    expect(screen.getByText('Progress')).toBeInTheDocument()
  })
})