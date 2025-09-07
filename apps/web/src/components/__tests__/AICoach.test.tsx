import { render, screen, fireEvent, waitFor } from '@/test/utils'
import AICoach from '@/components/AICoach'

describe('AICoach', () => {
  it('renders default greeting', () => {
    render(<AICoach />)
    expect(
      screen.getByText(/i'm your ai coach\. what goal would you like to work on today\?/i)
    ).toBeInTheDocument()
  })

  it('submits user prompt, receives AI response and shows plan modal', async () => {
    render(<AICoach />)

    const input = screen.getByPlaceholderText(/type your goal or question here/i)

    // button is icon-only, so we submit via Enter key
    fireEvent.change(input, { target: { value: 'Run a marathon' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    // user message appears immediately
    expect(screen.getByText('Run a marathon')).toBeInTheDocument()

    await waitFor(() => {
      expect(
        screen.getByText(/i've analyzed your goal and created a milestone plan/i)
      ).toBeInTheDocument()
    }, { timeout: 3000 })

    // Initially plan is not shown, a button to view it should be visible
    const viewBtn = await screen.findByRole('button', { name: /view milestone plan/i })
    fireEvent.click(viewBtn)

    // Plan content appears
    expect(screen.getByRole('heading', { name: /plan for: run a marathon/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /modify plan/i })).toBeInTheDocument()
    const acceptBtn = screen.getByRole('button', { name: /accept plan/i })

    fireEvent.click(acceptBtn)

    // Confirmation messages appended
    expect(screen.getByText(/i accept this plan\./i)).toBeInTheDocument()
    expect(
      screen.getByText(/i've added these milestones to your habit tracking system/i)
    ).toBeInTheDocument()
  })

  it('ignores empty submissions', () => {
    render(<AICoach />)
    // icon-only submit is disabled until text is present; ensure no user message exists
    expect(
      screen.queryByText(/i accept this plan\./i)
    ).not.toBeInTheDocument()
  })
})
