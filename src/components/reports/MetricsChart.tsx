import React from 'react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, BarChart3, PieChart as PieChartIcon, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MetricsChartProps {
  type: 'line' | 'area' | 'bar' | 'pie'
  data: any[]
  title: string
  description?: string
  dataKey?: string
  xAxisKey?: string
  className?: string
  height?: number
  colors?: string[]
}

const CHART_COLORS = [
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#14b8a6', // teal-500
  '#f97316', // orange-500,
]

export function MetricsChart({
  type,
  data,
  title,
  description,
  dataKey = 'value',
  xAxisKey = 'name',
  className,
  height = 300,
  colors = CHART_COLORS
}: MetricsChartProps) {
  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey={xAxisKey} stroke="#888" fontSize={12} />
            <YAxis stroke="#888" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={colors[0]}
              strokeWidth={2}
              dot={{ fill: colors[0], strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        )

      case 'area':
        return (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey={xAxisKey} stroke="#888" fontSize={12} />
            <YAxis stroke="#888" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={colors[0]}
              fill={colors[0]}
              fillOpacity={0.3}
            />
          </AreaChart>
        )

      case 'bar':
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey={xAxisKey} stroke="#888" fontSize={12} />
            <YAxis stroke="#888" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
            />
            <Legend />
            <Bar dataKey={dataKey} fill={colors[0]} radius={[4, 4, 0, 0]} />
          </BarChart>
        )

      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey={dataKey}
            >
              {data.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
            />
          </PieChart>
        )

      default:
        return null
    }
  }

  const getChartIcon = () => {
    switch (type) {
      case 'line':
      case 'area':
        return <Activity className="h-4 w-4" />
      case 'bar':
        return <BarChart3 className="h-4 w-4" />
      case 'pie':
        return <PieChartIcon className="h-4 w-4" />
      default:
        return <BarChart3 className="h-4 w-4" />
    }
  }

  const calculateTrend = () => {
    if (data.length < 2) return null

    const firstValue = data[0][dataKey]
    const lastValue = data[data.length - 1][dataKey]
    const change = ((lastValue - firstValue) / firstValue) * 100

    return {
      isPositive: change >= 0,
      value: Math.abs(change).toFixed(1)
    }
  }

  const trend = calculateTrend()

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getChartIcon()}
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              {description && (
                <CardDescription className="text-sm">{description}</CardDescription>
              )}
            </div>
          </div>
          {trend && (
            <Badge
              variant={trend.isPositive ? 'default' : 'secondary'}
              className={cn(
                'gap-1',
                trend.isPositive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              )}
            >
              {trend.isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {trend.value}%
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          {renderChart() || <div>No data available</div>}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// Simplified specialized chart components
export function EngagementRateChart({ data, className }: { data: any[]; className?: string }) {
  const processedData = data.map(item => ({
    date: new Date(item.period).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    engagement: item.average_engagement_rate || 0
  }))

  return (
    <MetricsChart
      type="area"
      data={processedData}
      title="Engagement Rate Trends"
      description="Average engagement rate over time"
      dataKey="engagement"
      xAxisKey="date"
      className={className}
      colors={['#3b82f6']}
    />
  )
}

export function HashtagPerformanceChart({ data, className }: { data: any[]; className?: string }) {
  const processedData = data.slice(0, 10).map(item => ({
    hashtag: item.hashtag,
    usage: item.usage_count,
    engagement: item.avg_engagement_rate || 0
  }))

  return (
    <MetricsChart
      type="bar"
      data={processedData}
      title="Top Hashtag Performance"
      description="Usage count and average engagement by hashtag"
      dataKey="usage"
      xAxisKey="hashtag"
      className={className}
      height={350}
      colors={['#f59e0b']}
    />
  )
}

export function PlatformComparisonChart({ data, className }: { data: any[]; className?: string }) {
  const processedData = data.map(item => ({
    platform: item.platform.charAt(0).toUpperCase() + item.platform.slice(1),
    content: item.content_count,
    performance: item.avg_performance || 0
  }))

  return (
    <MetricsChart
      type="pie"
      data={processedData}
      title="Content Distribution by Platform"
      description="Number of content pieces per platform"
      dataKey="content"
      xAxisKey="platform"
      className={className}
      colors={['#3b82f6', '#10b981', '#ef4444']}
    />
  )
}