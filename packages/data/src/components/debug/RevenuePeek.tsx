import { type ReactElement, useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'

interface RevenueData {
  date: string
  revenue: number
  purchases: number
  refunds: number
  newUsers: number
}

interface SKUBreakdown {
  sku: string
  name: string
  purchases: number
  revenue: number
  percentage: number
}

interface PlatformData {
  platform: 'ios' | 'android' | 'web'
  purchases: number
  revenue: number
  color: string
}

// Mock data generator for development/demo
function generateMockRevenueData(days: number): RevenueData[] {
  const data: RevenueData[] = []
  
  for (let i = days - 1; i >= 0; i--) {
    const date = format(subDays(new Date(), i), 'yyyy-MM-dd')
    const baseRevenue = 1000 + Math.random() * 2000
    const seasonalFactor = 1 + 0.3 * Math.sin((i / 30) * Math.PI * 2) // Monthly cycle
    
    data.push({
      date,
      revenue: Math.round(baseRevenue * seasonalFactor),
      purchases: Math.round((baseRevenue * seasonalFactor) / 25), // ~$25 average
      refunds: Math.round(Math.random() * 5), // 0-5 refunds per day
      newUsers: Math.round(50 + Math.random() * 100) // 50-150 new users
    })
  }
  
  return data
}

function generateMockSKUData(): SKUBreakdown[] {
  return [
    { sku: 'pro_year', name: 'Pro Yearly', purchases: 45, revenue: 1800, percentage: 42 },
    { sku: 'pro_month', name: 'Pro Monthly', purchases: 120, revenue: 1200, percentage: 28 },
    { sku: 'consumable_streakshield_1', name: 'Streak Shield', purchases: 89, revenue: 445, percentage: 15 },
    { sku: 'consumable_xp_booster_7d', name: 'XP Booster', purchases: 67, revenue: 335, percentage: 10 },
    { sku: 'cos_theme_teal_nebula', name: 'Teal Nebula Theme', purchases: 34, revenue: 170, percentage: 5 }
  ]
}

function generateMockPlatformData(): PlatformData[] {
  return [
    { platform: 'ios', purchases: 234, revenue: 2890, color: '#007AFF' },
    { platform: 'android', purchases: 156, revenue: 1456, color: '#34C759' },
    { platform: 'web', purchases: 12, revenue: 204, color: '#FF9500' }
  ]
}

async function fetchRevenueData(days: number): Promise<RevenueData[]> {
  // In real implementation, query v_revenue_daily_enhanced view
  return new Promise(resolve => {
    setTimeout(() => resolve(generateMockRevenueData(days)), 500)
  })
}

async function fetchSKUBreakdown(): Promise<SKUBreakdown[]> {
  // In real implementation, query audit_purchases with aggregation
  return new Promise(resolve => {
    setTimeout(() => resolve(generateMockSKUData()), 300)
  })
}

async function fetchPlatformData(): Promise<PlatformData[]> {
  // In real implementation, query audit_purchases grouped by platform
  return new Promise(resolve => {
    setTimeout(() => resolve(generateMockPlatformData()), 300)
  })
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

function MetricCard({ title, value, trend, color = 'blue' }: {
  title: string
  value: string | number
  trend?: number
  color?: 'blue' | 'green' | 'red' | 'yellow'
}) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200', 
    red: 'bg-red-50 border-red-200',
    yellow: 'bg-yellow-50 border-yellow-200'
  }

  const trendColor = trend && trend > 0 ? 'text-green-600' : trend && trend < 0 ? 'text-red-600' : 'text-gray-600'
  const trendIcon = trend && trend > 0 ? '↗' : trend && trend < 0 ? '↘' : '—'

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color]}`}>
      <div className="text-sm font-medium text-gray-600 mb-1">{title}</div>
      <div className="text-2xl font-bold text-gray-900 mb-2">{value}</div>
      {trend !== undefined && (
        <div className={`text-sm ${trendColor} flex items-center`}>
          <span className="mr-1">{trendIcon}</span>
          {Math.abs(trend).toFixed(1)}% vs yesterday
        </div>
      )}
    </div>
  )
}

export function RevenuePeek(): ReactElement {
  const [dateRange, setDateRange] = useState(30)
  const [viewType, setViewType] = useState<'overview' | 'breakdown' | 'platform'>('overview')

  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ['revenue-data', dateRange],
    queryFn: () => fetchRevenueData(dateRange),
    staleTime: 300000, // 5 minutes
    refetchInterval: 300000
  })

  const { data: skuData, isLoading: skuLoading } = useQuery({
    queryKey: ['sku-breakdown'],
    queryFn: fetchSKUBreakdown,
    staleTime: 300000,
    refetchInterval: 300000
  })

  const { data: platformData, isLoading: platformLoading } = useQuery({
    queryKey: ['platform-data'],
    queryFn: fetchPlatformData,
    staleTime: 300000,
    refetchInterval: 300000
  })

  // Calculate summary metrics
  const totalRevenue = revenueData?.reduce((sum, day) => sum + day.revenue, 0) || 0
  const totalPurchases = revenueData?.reduce((sum, day) => sum + day.purchases, 0) || 0
  const totalRefunds = revenueData?.reduce((sum, day) => sum + day.refunds, 0) || 0
  const avgRevenuePerDay = totalRevenue / (dateRange || 1)
  
  // Calculate trends (mock for demo)
  const revenueTrend = 5.2
  const purchaseTrend = 3.8
  const refundTrend = -12.4

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Revenue Dashboard</h1>
              <p className="text-gray-600 mt-1">Quick insights into app monetization performance</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(Number(e.target.value))}
                className="border border-gray-300 rounded px-3 py-2 text-sm"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>
              
              <div className="flex border border-gray-300 rounded">
                {(['overview', 'breakdown', 'platform'] as const).map(view => (
                  <button
                    key={view}
                    onClick={() => setViewType(view)}
                    className={`px-3 py-2 text-sm capitalize ${
                      viewType === view 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    } ${view === 'overview' ? 'rounded-l' : view === 'platform' ? 'rounded-r' : ''}`}
                  >
                    {view}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard
            title="Total Revenue"
            value={formatCurrency(totalRevenue)}
            trend={revenueTrend}
            color="green"
          />
          <MetricCard
            title="Total Purchases"
            value={totalPurchases.toLocaleString()}
            trend={purchaseTrend}
            color="blue"
          />
          <MetricCard
            title="Avg Daily Revenue"
            value={formatCurrency(avgRevenuePerDay)}
            color="blue"
          />
          <MetricCard
            title="Refunds"
            value={totalRefunds}
            trend={refundTrend}
            color={totalRefunds > 20 ? 'red' : 'yellow'}
          />
        </div>

        {/* Main Content */}
        {viewType === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend Chart */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
              {revenueLoading ? (
                <div className="h-64 bg-gray-100 rounded animate-pulse"></div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(date) => format(new Date(date), 'MMM d')}
                    />
                    <YAxis tickFormatter={(value) => `$${value}`} />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                      labelFormatter={(date) => format(new Date(date), 'MMM d, yyyy')}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Purchase Volume Chart */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Purchases</h3>
              {revenueLoading ? (
                <div className="h-64 bg-gray-100 rounded animate-pulse"></div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(date) => format(new Date(date), 'M/d')}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [value, 'Purchases']}
                      labelFormatter={(date) => format(new Date(date), 'MMM d, yyyy')}
                    />
                    <Bar dataKey="purchases" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}

        {viewType === 'breakdown' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* SKU Revenue Chart */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Product</h3>
              {skuLoading ? (
                <div className="h-80 bg-gray-100 rounded animate-pulse"></div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={skuData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(value) => `$${value}`} />
                    <YAxis type="category" dataKey="name" width={120} />
                    <Tooltip formatter={(value: number) => [formatCurrency(value), 'Revenue']} />
                    <Bar dataKey="revenue" fill="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* SKU Details Table */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Details</h3>
              {skuLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-12 bg-gray-100 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {skuData?.map(sku => (
                    <div key={sku.sku} className="p-3 border border-gray-100 rounded-lg">
                      <div className="font-medium text-gray-900 text-sm">{sku.name}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        {sku.purchases} purchases • {formatCurrency(sku.revenue)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {sku.percentage}% of total revenue
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {viewType === 'platform' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Platform Revenue Pie Chart */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Platform</h3>
              {platformLoading ? (
                <div className="h-64 bg-gray-100 rounded animate-pulse"></div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={platformData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="revenue"
                      label={({ platform, percentage }: { platform: string, percentage: number }) => 
                        `${platform.toUpperCase()} ${percentage?.toFixed(0)}%`
                      }
                    >
                      {platformData?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [formatCurrency(value), 'Revenue']} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Platform Stats */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Performance</h3>
              {platformLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {platformData?.map(platform => {
                    const avgRevenue = platform.revenue / platform.purchases
                    return (
                      <div key={platform.platform} className="p-4 border border-gray-100 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: platform.color }}
                            ></div>
                            <span className="font-medium text-gray-900 capitalize">
                              {platform.platform}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {formatCurrency(platform.revenue)}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-gray-500">Purchases</div>
                            <div className="font-medium">{platform.purchases}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">Avg Revenue</div>
                            <div className="font-medium">{formatCurrency(avgRevenue)}</div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-6 bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Last updated: {format(new Date(), 'MMM d, yyyy HH:mm')}
            </span>
            <div className="flex space-x-2">
              <button className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                📧 Email Report
              </button>
              <button className="px-3 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700">
                📊 Export Data
              </button>
              <button className="px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700">
                🔄 Refresh
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RevenuePeek