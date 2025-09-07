import { useState, useEffect } from 'react'
import NetInfo from '@react-native-community/netinfo'

export function useNetworkSafety() {
  const [isConnected, setIsConnected] = useState(true)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check initial connection state
    NetInfo.fetch().then(state => {
      setIsConnected(state.isConnected ?? false)
      setIsLoading(false)
    })

    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected ?? false)
      setIsLoading(false)
    })

    return unsubscribe
  }, [])

  return {
    isConnected,
    isLoading,
    isOffline: !isConnected && !isLoading,
  }
}

export function useOfflineProtection() {
  const { isOffline } = useNetworkSafety()
  
  return {
    isOffline,
    shouldBlockPurchases: isOffline,
    getOfflineMessage: () => 
      'You appear to be offline. Please check your internet connection and try again.',
  }
}