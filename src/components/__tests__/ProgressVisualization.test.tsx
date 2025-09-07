import { render, screen } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import ProgressVisualization from '@/components/ProgressVisualization'

describe('ProgressVisualization', () => {
  it('renders Streaks tab by default with habit cards', () => {
    render(<ProgressVisualization />)
    expect(screen.getByText(/your progress journey/i)).toBeInTheDocument()
    // Habit cards visible
    expect(screen.getByText(/morning meditation/i)).toBeInTheDocument()
    expect(screen.getByText(/reading/i)).toBeInTheDocument()
  })

  it('switches to Milestones and shows completed state', async () => {
    render(<ProgressVisualization />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('tab', { name: /milestones/i }))
    // Completed milestone messaging visible in that tab
    expect(screen.getByText(/congratulations on completing this milestone/i)).toBeInTheDocument()
  })

  it('switches to Achievements and shows stats block', async () => {
    render(<ProgressVisualization />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('tab', { name: /achievements/i }))
    // Use heading present in achievements content and one label
    expect(screen.getByText(/your achievement progress/i)).toBeInTheDocument()
    expect(screen.getByText(/remaining/i)).toBeInTheDocument()
  })
})
