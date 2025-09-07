import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { UpgradeGate, withVersionGate } from '../UpgradeGate'
import { isVersionSupported } from '../../hooks/useStoreConfig'

// Mock navigator
Object.defineProperty(window, 'navigator', {
  writable: true,
  value: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
})

// Mock window.location
const mockLocation = {
  href: '',
  reload: vi.fn()
}
Object.defineProperty(window, 'location', {
  writable: true,
  value: mockLocation
})

describe('UpgradeGate', () => {
  beforeEach(() => {
    mockLocation.href = ''
    ;(mockLocation.reload as Mock).mockClear()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders upgrade gate with current and required versions', () => {
    render(<UpgradeGate currentVersion="1.0.0" minVersion="1.2.0" />)
    
    expect(screen.getByText('Update Required')).toBeInTheDocument()
    expect(screen.getByText(/You're using version 1.0.0/)).toBeInTheDocument()
    expect(screen.getByText(/version 1.2.0 or newer is required/)).toBeInTheDocument()
    expect(screen.getByText('1.0.0')).toBeInTheDocument()
    expect(screen.getByText('1.2.0+')).toBeInTheDocument()
  })

  it('calls custom onUpgrade when provided', () => {
    const onUpgrade = vi.fn()
    render(<UpgradeGate currentVersion="1.0.0" minVersion="1.2.0" onUpgrade={onUpgrade} />)
    
    fireEvent.click(screen.getByText('Update App'))
    expect(onUpgrade).toHaveBeenCalledOnce()
  })

  it('redirects to iOS app store on iOS devices', () => {
    Object.defineProperty(window.navigator, 'userAgent', {
      writable: true,
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)'
    })

    render(<UpgradeGate currentVersion="1.0.0" minVersion="1.2.0" />)
    
    fireEvent.click(screen.getByText('Update App'))
    expect(mockLocation.href).toBe('https://apps.apple.com/app/habituals')
  })

  it('redirects to Android play store on Android devices', () => {
    Object.defineProperty(window.navigator, 'userAgent', {
      writable: true,
      value: 'Mozilla/5.0 (Linux; Android 11; SM-G973F)'
    })

    render(<UpgradeGate currentVersion="1.0.0" minVersion="1.2.0" />)
    
    fireEvent.click(screen.getByText('Update App'))
    expect(mockLocation.href).toBe('https://play.google.com/store/apps/details?id=com.habituals.app')
  })

  it('reloads page on non-mobile devices', () => {
    render(<UpgradeGate currentVersion="1.0.0" minVersion="1.2.0" />)
    
    fireEvent.click(screen.getByText('Update App'))
    expect(mockLocation.reload).toHaveBeenCalledOnce()
  })
})

describe('withVersionGate', () => {
  const MockComponent = ({ title }: { title: string }) => <div>{title}</div>

  it('renders wrapped component when version is supported', () => {
    const WrappedComponent = withVersionGate(MockComponent, {
      getAppVersion: () => '1.2.0'
    })

    render(<WrappedComponent title="Test Component" />)
    
    expect(screen.getByText('Test Component')).toBeInTheDocument()
    expect(screen.queryByText('Update Required')).not.toBeInTheDocument()
  })

  it('renders upgrade gate when version is not supported', () => {
    const WrappedComponent = withVersionGate(MockComponent, {
      getAppVersion: () => '0.9.0'
    })

    render(<WrappedComponent title="Test Component" />)
    
    expect(screen.getByText('Update Required')).toBeInTheDocument()
    expect(screen.queryByText('Test Component')).not.toBeInTheDocument()
  })

  it('uses default version when getAppVersion not provided', () => {
    const WrappedComponent = withVersionGate(MockComponent)

    render(<WrappedComponent title="Test Component" />)
    
    // With default versions (1.0.0 app vs 1.0.0 min), component should render normally
    expect(screen.getByText('Test Component')).toBeInTheDocument()
    expect(screen.queryByText('Update Required')).not.toBeInTheDocument()
  })

  it('sets correct display name', () => {
    const TestComponent = () => <div>Test</div>
    TestComponent.displayName = 'TestComponent'
    
    const WrappedComponent = withVersionGate(TestComponent)
    
    expect(WrappedComponent.displayName).toBe('withVersionGate(TestComponent)')
  })

  it('uses component name when displayName not available', () => {
    function TestComponent() {
      return <div>Test</div>
    }
    
    const WrappedComponent = withVersionGate(TestComponent)
    
    expect(WrappedComponent.displayName).toBe('withVersionGate(TestComponent)')
  })
})

describe('isVersionSupported utility (integration)', () => {
  it('correctly identifies supported versions', () => {
    expect(isVersionSupported('1.2.0', '1.0.0')).toBe(true)
    expect(isVersionSupported('1.0.0', '1.0.0')).toBe(true)
    expect(isVersionSupported('1.0.1', '1.0.0')).toBe(true)
    expect(isVersionSupported('2.0.0', '1.9.9')).toBe(true)
  })

  it('correctly identifies unsupported versions', () => {
    expect(isVersionSupported('0.9.0', '1.0.0')).toBe(false)
    expect(isVersionSupported('1.0.0', '1.0.1')).toBe(false)
    expect(isVersionSupported('1.0.0', '1.1.0')).toBe(false)
    expect(isVersionSupported('1.0.0', '2.0.0')).toBe(false)
  })

  it('handles edge cases gracefully', () => {
    expect(isVersionSupported('', '1.0.0')).toBe(true)
    expect(isVersionSupported('1.0.0', '')).toBe(true)
    expect(isVersionSupported('', '')).toBe(true)
  })
})