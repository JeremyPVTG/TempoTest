import { useState, useEffect } from 'react'
import { queue } from '../lib/queue'
import { useConnectivity } from '@habituals/data'
import type { QueueSnapshot, MutOp } from '@habituals/data'

export function QueueDebug() {
  const [snapshot, setSnapshot] = useState<QueueSnapshot>({ ops: [] })
  const [isDraining, setIsDraining] = useState(false)
  const isOnline = useConnectivity()

  useEffect(() => {
    const interval = setInterval(async () => {
      const snap = await queue.read()
      setSnapshot(snap)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleDrain = async () => {
    setIsDraining(true)
    try {
      await queue.drain()
    } finally {
      setIsDraining(false)
    }
  }

  const handleClear = async () => {
    await queue.clear()
    setSnapshot({ ops: [] })
  }

  return (
    <div className="fixed top-4 right-4 bg-white/90 backdrop-blur border rounded-lg p-4 max-w-sm shadow-lg">
      <div className="text-sm font-medium mb-2">Queue Debug</div>
      <div className="text-xs space-y-1 mb-3">
        <div>Online: <span className={isOnline ? 'text-green-600' : 'text-red-600'}>{isOnline ? 'Yes' : 'No'}</span></div>
        <div>Pending: <span className="font-mono">{snapshot.ops.length}</span></div>
        <div>Draining: <span className={isDraining ? 'text-yellow-600' : 'text-gray-500'}>{isDraining ? 'Yes' : 'No'}</span></div>
      </div>
      <div className="space-y-2 mb-3">
        <button 
          onClick={handleDrain}
          disabled={isDraining}
          className="w-full text-xs bg-blue-500 text-white px-2 py-1 rounded disabled:opacity-50"
        >
          Drain Queue
        </button>
        <button 
          onClick={handleClear}
          className="w-full text-xs bg-red-500 text-white px-2 py-1 rounded"
        >
          Clear Queue
        </button>
      </div>
      {snapshot.ops.length > 0 && (
        <div className="max-h-40 overflow-y-auto">
          <div className="text-xs font-medium mb-1">Pending Ops:</div>
          {snapshot.ops.map((op: MutOp) => (
            <div key={op.id} className="text-xs bg-gray-100 p-1 rounded mb-1">
              <div className="font-mono">{op.kind}</div>
              <div className="text-gray-600">Attempt: {op.attempt}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}