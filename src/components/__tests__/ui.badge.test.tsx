import { render } from '@testing-library/react'
import { Badge } from '@/components/ui/badge'

function hasClass(el: HTMLElement, className: string) {
  return el.className.split(' ').includes(className)
}

describe('UI Badge', () => {
  it('applies default variant classes', () => {
    const { container } = render(<Badge>Default</Badge>)
    const el = container.firstChild as HTMLElement
    expect(el.className).toMatch(/bg-primary/)
  })

  it('applies secondary variant classes', () => {
    const { container } = render(<Badge variant="secondary">Sec</Badge>)
    const el = container.firstChild as HTMLElement
    expect(el.className).toMatch(/bg-secondary/)
  })

  it('applies outline variant classes', () => {
    const { container } = render(<Badge variant="outline">Outline</Badge>)
    const el = container.firstChild as HTMLElement
    expect(hasClass(el, 'text-foreground')).toBeTruthy()
  })
})
