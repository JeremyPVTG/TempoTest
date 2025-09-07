import { type ComponentType, type ReactElement } from 'react'
import { useEntitlementsData } from '../hooks/useStore'

interface UpsellInterceptProps {
  onViewPlans: () => void
}

function UpsellIntercept({ onViewPlans }: UpsellInterceptProps): ReactElement {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200">
      <div className="text-4xl mb-4">⭐</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Pro Feature</h3>
      <p className="text-gray-600 text-center mb-6 max-w-sm">
        This feature is available to Pro subscribers. Upgrade to unlock advanced analytics, 
        unlimited habits, and exclusive themes.
      </p>
      <button 
        onClick={onViewPlans}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
      >
        See Plans
      </button>
      <p className="text-xs text-gray-500 mt-4">
        7-day free trial • Cancel anytime
      </p>
    </div>
  )
}

interface ProGateOptions {
  fallback?: ComponentType<UpsellInterceptProps>
  onViewPlans?: () => void
}

export function withProGate<P extends object>(
  Component: ComponentType<P>,
  options: ProGateOptions = {}
) {
  const ProGatedComponent = (props: P): ReactElement => {
    const { data: entitlements, isLoading } = useEntitlementsData()
    const { fallback: FallbackComponent = UpsellIntercept, onViewPlans = () => {} } = options
    
    // Show loading state while checking entitlements
    if (isLoading) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      )
    }
    
    // Show pro content if user has entitlement
    if (entitlements?.pro) {
      return <Component {...props} />
    }
    
    // Show upsell intercept for non-pro users
    return <FallbackComponent onViewPlans={onViewPlans} />
  }
  
  ProGatedComponent.displayName = `withProGate(${Component.displayName || Component.name})`
  return ProGatedComponent
}