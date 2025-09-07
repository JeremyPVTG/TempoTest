import { type ReactElement, useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'

interface HealthStatus {
  service: string
  status: 'healthy' | 'degraded' | 'down'
  latency?: number
  lastCheck: string
  error?: string
}

interface SLOMetrics {
  service: string
  timeWindow: string
  errorRate: number
  p95Latency: number
  sloViolation: boolean
  requests: number
}

interface RolloutStatus {
  feature: string
  stage: 'canary' | '1%' | '10%' | '25%' | '100%'
  enabled: boolean
  userCount?: number
  errorRate?: number
  startTime: string
}

// Mock data - in real implementation, these would come from actual APIs
const mockHealthData: HealthStatus[] = [
  {
    service: 'revenuecat-webhook',
    status: 'healthy',
    latency: 245,
    lastCheck: new Date().toISOString()
  },
  {
    service: 'claim',
    status: 'healthy', 
    latency: 180,
    lastCheck: new Date().toISOString()
  },
  {
    service: 'database',
    status: 'healthy',
    latency: 45,
    lastCheck: new Date().toISOString()
  },
  {
    service: 'app-store-connect',
    status: 'healthy',
    lastCheck: new Date().toISOString()
  }
]

const mockSLOData: SLOMetrics[] = [
  {
    service: 'revenuecat-webhook',
    timeWindow: '15min',
    errorRate: 0.2,
    p95Latency: 680,
    sloViolation: false,
    requests: 1247
  },
  {
    service: 'claim', 
    timeWindow: '15min',
    errorRate: 1.2,
    p95Latency: 420,
    sloViolation: true,
    requests: 856
  }
]

const mockRolloutData: RolloutStatus[] = [
  {
    feature: 'New Onboarding Flow',
    stage: '10%',
    enabled: true,
    userCount: 1250,
    errorRate: 0.1,
    startTime: '2025-01-15T10:00:00Z'
  },
  {
    feature: 'Enhanced Analytics',
    stage: 'canary',
    enabled: true, 
    userCount: 25,
    errorRate: 0.0,
    startTime: '2025-01-15T14:30:00Z'
  }
]

async function fetchHealthStatus(): Promise<HealthStatus[]> {
  // In real implementation, check actual health endpoints
  // const webhookHealth = await fetch('/functions/v1/revenuecat-webhook?health=1')
  // const claimHealth = await fetch('/functions/v1/claim?health=1')
  return mockHealthData
}

async function fetchSLOMetrics(): Promise<SLOMetrics[]> {
  // In real implementation, query v_slo_violations_15min view
  return mockSLOData
}

async function fetchRolloutStatus(): Promise<RolloutStatus[]> {
  // In real implementation, query rollout configuration
  return mockRolloutData
}

function StatusIndicator({ status }: { status: 'healthy' | 'degraded' | 'down' }) {
  const colors = {
    healthy: 'bg-green-500',
    degraded: 'bg-yellow-500', 
    down: 'bg-red-500'
  }
  
  return <div className={`w-3 h-3 rounded-full ${colors[status]}`} />
}

function SLOStatus({ violation }: { violation: boolean }) {
  return (
    <div className={`px-2 py-1 rounded text-sm font-medium ${
      violation 
        ? 'bg-red-100 text-red-800' 
        : 'bg-green-100 text-green-800'
    }`}>
      {violation ? 'VIOLATION' : 'OK'}
    </div>
  )
}

function RolloutStage({ stage }: { stage: RolloutStatus['stage'] }) {
  const colors = {
    canary: 'bg-blue-100 text-blue-800',
    '1%': 'bg-purple-100 text-purple-800',
    '10%': 'bg-orange-100 text-orange-800', 
    '25%': 'bg-yellow-100 text-yellow-800',
    '100%': 'bg-green-100 text-green-800'
  }
  
  return (
    <div className={`px-2 py-1 rounded text-sm font-medium ${colors[stage]}`}>
      {stage === 'canary' ? 'CANARY' : stage}
    </div>
  )
}

export function StatusPage(): ReactElement {
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(30000) // 30 seconds

  const { data: healthData, isLoading: healthLoading, refetch: refetchHealth } = useQuery({
    queryKey: ['health-status'],
    queryFn: fetchHealthStatus,
    refetchInterval: autoRefresh ? refreshInterval : false,
    staleTime: 0
  })

  const { data: sloData, isLoading: sloLoading, refetch: refetchSLO } = useQuery({
    queryKey: ['slo-metrics'], 
    queryFn: fetchSLOMetrics,
    refetchInterval: autoRefresh ? refreshInterval : false,
    staleTime: 0
  })

  const { data: rolloutData, isLoading: rolloutLoading, refetch: refetchRollout } = useQuery({
    queryKey: ['rollout-status'],
    queryFn: fetchRolloutStatus,
    refetchInterval: autoRefresh ? refreshInterval : false,
    staleTime: 0
  })

  const [lastUpdated, setLastUpdated] = useState(new Date())

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        setLastUpdated(new Date())
      }, refreshInterval)
      
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval])

  const handleManualRefresh = () => {
    refetchHealth()
    refetchSLO() 
    refetchRollout()
    setLastUpdated(new Date())
  }

  const overallStatus = healthData?.every(h => h.status === 'healthy') ? 'healthy' : 
                      healthData?.some(h => h.status === 'down') ? 'down' : 'degraded'

  const activeSLOViolations = sloData?.filter(s => s.sloViolation).length || 0

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Habituals Status Dashboard</h1>
              <StatusIndicator status={overallStatus} />
              <span className="text-sm text-gray-600">
                {overallStatus === 'healthy' ? 'All Systems Operational' :
                 overallStatus === 'degraded' ? 'Some Issues Detected' :
                 'Service Disruption'}
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label className="text-sm text-gray-600">Auto-refresh</label>
              </div>
              
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="text-sm border border-gray-300 rounded px-2 py-1"
                disabled={!autoRefresh}
              >
                <option value={15000}>15s</option>
                <option value={30000}>30s</option>
                <option value={60000}>1m</option>
                <option value={300000}>5m</option>
              </select>
              
              <button
                onClick={handleManualRefresh}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Refresh
              </button>
              
              <span className="text-xs text-gray-500">
                Last updated: {format(lastUpdated, 'HH:mm:ss')}
              </span>
            </div>
          </div>
          
          {activeSLOViolations > 0 && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                <span className="text-sm font-medium text-red-800">
                  {activeSLOViolations} SLO violation{activeSLOViolations > 1 ? 's' : ''} active
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Service Health */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Service Health</h2>
            </div>
            <div className="p-4">
              {healthLoading ? (
                <div className="animate-pulse space-y-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-12 bg-gray-100 rounded"></div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {healthData?.map(service => (
                    <div key={service.service} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <StatusIndicator status={service.status} />
                        <span className="font-medium text-gray-900">{service.service}</span>
                      </div>
                      <div className="text-right">
                        {service.latency && (
                          <div className="text-sm text-gray-600">{service.latency}ms</div>
                        )}
                        <div className="text-xs text-gray-400">
                          {format(new Date(service.lastCheck), 'HH:mm:ss')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* SLO Monitoring */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">SLO Monitoring</h2>
            </div>
            <div className="p-4">
              {sloLoading ? (
                <div className="animate-pulse space-y-3">
                  {[1, 2].map(i => (
                    <div key={i} className="h-20 bg-gray-100 rounded"></div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {sloData?.map(slo => (
                    <div key={slo.service} className="p-3 border border-gray-100 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{slo.service}</span>
                        <SLOStatus violation={slo.sloViolation} />
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-gray-500">Error Rate</div>
                          <div className={`font-medium ${slo.errorRate > 1 ? 'text-red-600' : 'text-green-600'}`}>
                            {slo.errorRate.toFixed(1)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500">p95 Latency</div>
                          <div className={`font-medium ${
                            (slo.service === 'revenuecat-webhook' && slo.p95Latency > 750) ||
                            (slo.service === 'claim' && slo.p95Latency > 500)
                              ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {slo.p95Latency}ms
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500">Requests</div>
                          <div className="font-medium text-gray-900">{slo.requests.toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Feature Rollouts */}
          <div className="bg-white rounded-lg shadow-sm lg:col-span-2">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Active Rollouts</h2>
            </div>
            <div className="p-4">
              {rolloutLoading ? (
                <div className="animate-pulse space-y-3">
                  {[1, 2].map(i => (
                    <div key={i} className="h-16 bg-gray-100 rounded"></div>
                  ))}
                </div>
              ) : rolloutData && rolloutData.length > 0 ? (
                <div className="space-y-4">
                  {rolloutData.map(rollout => (
                    <div key={rollout.feature} className="p-4 border border-gray-100 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <span className="font-medium text-gray-900">{rollout.feature}</span>
                          <RolloutStage stage={rollout.stage} />
                          <div className={`w-2 h-2 rounded-full ${rollout.enabled ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        </div>
                        <span className="text-sm text-gray-500">
                          Started {format(new Date(rollout.startTime), 'MMM d, HH:mm')}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-gray-500">Users</div>
                          <div className="font-medium text-gray-900">
                            {rollout.userCount?.toLocaleString() || 'N/A'}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500">Error Rate</div>
                          <div className={`font-medium ${
                            rollout.errorRate && rollout.errorRate > 1 
                              ? 'text-red-600' 
                              : 'text-green-600'
                          }`}>
                            {rollout.errorRate?.toFixed(1) || '0.0'}%
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500">Status</div>
                          <div className="font-medium text-gray-900">
                            {rollout.enabled ? 'Active' : 'Paused'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No active rollouts
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 bg-white rounded-lg shadow-sm p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-2">
            <button className="px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700">
              🚨 Emergency Kill Switch
            </button>
            <button className="px-3 py-2 bg-orange-600 text-white text-sm rounded hover:bg-orange-700">
              ⏸️ Pause New Rollouts
            </button>
            <button className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
              📊 Full System Report
            </button>
            <button className="px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700">
              ✅ Mark Incident Resolved
            </button>
            <button className="px-3 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700">
              🔄 Trigger Health Check
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StatusPage