import { useSyncExternalStore } from 'react'

export function useConnectivity() {
  const subscribe = (cb: () => void) => {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', cb)
      window.addEventListener('offline', cb)
      return () => {
        window.removeEventListener('online', cb)
        window.removeEventListener('offline', cb)
      }
    }
    return () => {}
  }
  const get = () => (typeof navigator !== 'undefined' ? navigator.onLine : true)
  return useSyncExternalStore(subscribe, get, () => true)
}


