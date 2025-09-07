import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('UI Button', () => {
  it('blocks clicks when disabled', () => {
    const onClick = vi.fn()
    render(<Button disabled onClick={onClick}>Submit</Button>)
    const btn = screen.getByRole('button', { name: /submit/i })
    expect(btn).toBeDisabled()
    fireEvent.click(btn)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('invokes onClick when enabled', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Go</Button>)
    fireEvent.click(screen.getByRole('button', { name: /go/i }))
    expect(onClick).toHaveBeenCalled()
  })
})
