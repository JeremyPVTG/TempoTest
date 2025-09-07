import { type ReactElement } from 'react'
import { isVersionSupported } from '../hooks/useStoreConfig'

interface UpgradeGateProps {
  currentVersion: string
  minVersion: string
  onUpgrade?: () => void
}

export function UpgradeGate({ currentVersion, minVersion, onUpgrade }: UpgradeGateProps): ReactElement {
  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade()
    } else {
      // Default behavior - redirect to app store
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
      const isAndroid = /Android/.test(navigator.userAgent)
      
      if (isIOS) {
        window.location.href = 'https://apps.apple.com/app/habituals'
      } else if (isAndroid) {
        window.location.href = 'https://play.google.com/store/apps/details?id=com.habituals.app'
      } else {
        // Web fallback - refresh page
        window.location.reload()
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="text-6xl mb-6">📱</div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Update Required
        </h1>
        
        <p className="text-gray-600 mb-6 leading-relaxed">
          You're using version {currentVersion}, but version {minVersion} or newer is required 
          to continue using Habituals. Please update your app to access the latest features and improvements.
        </p>
        
        <div className="space-y-3 mb-8">
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">Current Version</span>
            <span className="text-sm font-mono text-red-600">{currentVersion}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
            <span className="text-sm text-gray-600">Required Version</span>
            <span className="text-sm font-mono text-green-600">{minVersion}+</span>
          </div>
        </div>
        
        <button
          onClick={handleUpgrade}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 px-6 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Update App
        </button>
        
        <p className="text-xs text-gray-500 mt-6">
          Updates are free and include the latest features, security improvements, and bug fixes.
        </p>
      </div>
    </div>
  )
}

// Higher-order component to wrap components that need version checking
interface WithVersionGateOptions {
  getAppVersion?: () => string
  onUpgrade?: () => void
}

export function withVersionGate<P extends object>(
  Component: React.ComponentType<P>,
  options: WithVersionGateOptions = {}
) {
  const VersionGatedComponent = (props: P): ReactElement => {
    const { getAppVersion = () => '1.0.0', onUpgrade } = options
    
    // This would be integrated with your config system
    // For now, just showing the pattern
    const currentVersion = getAppVersion()
    const minVersion = '1.0.0' // This would come from useStoreConfig
    
    const needsUpgrade = !isVersionSupported(currentVersion, minVersion)
    
    if (needsUpgrade) {
      return <UpgradeGate 
        currentVersion={currentVersion} 
        minVersion={minVersion}
        onUpgrade={onUpgrade}
      />
    }
    
    return <Component {...props} />
  }
  
  VersionGatedComponent.displayName = `withVersionGate(${Component.displayName || Component.name})`
  return VersionGatedComponent
}

