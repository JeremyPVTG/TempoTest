import { describe, it, expect, vi } from 'vitest'
import { toastEmit, toastSubscribe } from '../toastBus'

describe('toastBus', () => {
  it('subscribes to toast events and calls listener', () => {
    const listener = vi.fn()
    const unsubscribe = toastSubscribe(listener)

    const payload = { kind: 'achievement' as const, title: 'Test Achievement', subtitle: 'Test Description' }
    toastEmit(payload)

    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledWith(payload)

    unsubscribe()
  })

  it('unsubscribes correctly', () => {
    const listener = vi.fn()
    const unsubscribe = toastSubscribe(listener)

    toastEmit({ kind: 'achievement', title: 'Before unsubscribe' })
    expect(listener).toHaveBeenCalledTimes(1)

    unsubscribe()
    
    toastEmit({ kind: 'achievement', title: 'After unsubscribe' })
    expect(listener).toHaveBeenCalledTimes(1) // Should not be called again
  })

  it('supports multiple listeners', () => {
    const listener1 = vi.fn()
    const listener2 = vi.fn()
    
    toastSubscribe(listener1)
    toastSubscribe(listener2)

    const payload = { kind: 'achievement' as const, title: 'Multi-listener test' }
    toastEmit(payload)

    expect(listener1).toHaveBeenCalledWith(payload)
    expect(listener2).toHaveBeenCalledWith(payload)
  })
})