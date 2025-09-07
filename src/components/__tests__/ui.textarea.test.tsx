import { render, screen, fireEvent } from '@testing-library/react'
import { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'

function ControlledTextarea() {
  const [value, setValue] = useState('')
  return (
    <Textarea aria-label="message" value={value} onChange={(e) => setValue(e.target.value)} />
  )
}

describe('UI Textarea', () => {
  it('is controllable', () => {
    render(<ControlledTextarea />)
    const el = screen.getByLabelText('message') as HTMLTextAreaElement
    expect(el.value).toBe('')
    fireEvent.change(el, { target: { value: 'hello' } })
    expect(el.value).toBe('hello')
  })

  it('supports disabled state', () => {
    render(<Textarea aria-label="desc" disabled defaultValue="x" />)
    const el = screen.getByLabelText('desc') as HTMLTextAreaElement
    expect(el).toBeDisabled()
  })
})
