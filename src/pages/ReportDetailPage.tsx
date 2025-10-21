import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Download, Share2, Calendar, FileText, Brain, BarChart3, TrendingUp } from 'lucide-react'
import { WeeklyReport } from '@/types'
import { reportGenerationService } from '@/services/reportGeneration'
import { AIInsights } from '@/components/reports/AIInsights'
import { MetricsChart, EngagementRateChart, HashtagPerformanceChart, PlatformComparisonChart } from '@/components/reports/MetricsChart'
import { PDFExport } from '@/components/reports/PDFExport'
import { format } from 'date-fns'

export default function ReportDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [report, setReport] = useState<WeeklyReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showExport, setShowExport] = useState(false)

  useEffect(() => {
    if (id) {
      fetchReport(id)
    }
  }, [id])

  const fetchReport = async (reportId: string) => {
    try {
      setLoading(true)
      const data = await reportGenerationService.getReport(reportId)
      setReport(data)
    } catch (error) {
      console.error('Error fetching report:', error)
      setError(error instanceof Error ? error.message : 'Failed to load report')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: WeeklyReport['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'generating':
        return 'bg-blue-100 text-blue-800'
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleExportComplete = (url: string) => {
    console.log('Export completed:', url)
    // Could show a success notification
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading report...</p>
        </div>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertDescription>{error || 'Report not found'}</AlertDescription>
        </Alert>
        <Button onClick={() => navigate('/reports')} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Reports
        </Button>
      </div>
    )
  }

  const metricsSummary = report.metrics_summary

  // Mock data for charts (in real implementation, this would come from the performance analytics service)
  const mockChartData = [
    { period: '2024-01-15', average_engagement_rate: 2.5, total_likes: 150, total_comments: 45 },
    { period: '2024-01-16', average_engagement_rate: 3.1, total_likes: 180, total_comments: 52 },
    { period: '2024-01-17', average_engagement_rate: 2.8, total_likes: 165, total_comments: 48 },
    { period: '2024-01-18', average_engagement_rate: 3.5, total_likes: 210, total_comments: 61 },
    { period: '2024-01-19', average_engagement_rate: 3.2, total_likes: 195, total_comments: 56 },
    { period: '2024-01-20', average_engagement_rate: 3.8, total_likes: 225, total_comments: 68 },
    { period: '2024-01-21', average_engagement_rate: 3.6, total_likes: 215, total_comments: 63 }
  ]

  const mockHashtagData = [
    { hashtag: 'motorcycle', usage_count: 45, avg_engagement_rate: 3.8 },
    { hashtag: 'riding', usage_count: 38, avg_engagement_rate: 3.2 },
    { hashtag: 'bikerlife', usage_count: 32, avg_engagement_rate: 4.1 },
    { hashtag: 'sportbike', usage_count: 28, avg_engagement_rate: 2.9 },
    { hashtag: 'racing', usage_count: 25, avg_engagement_rate: 3.5 }
  ]

  const mockPlatformData = [
    { platform: 'instagram', content_count: 120, avg_performance: 3.4 },
    { platform: 'tiktok', content_count: 85, avg_performance: 3.8 }
  ]

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/reports')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{report.title}</h1>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {format(new Date(report.report_period_start), 'MMM d, yyyy')} - {format(new Date(report.report_period_end), 'MMM d, yyyy')}
              </div>
              <Badge className={getStatusColor(report.status)}>
                {report.status}
              </Badge>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                Generated {format(new Date(report.generated_at), 'MMM d, yyyy h:mm a')}
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowExport(!showExport)}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Export Panel */}
      {showExport && (
        <PDFExport
          report={report}
          onExportComplete={handleExportComplete}
        />
      )}

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Content</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metricsSummary.total_content || 0}</div>
            <p className="text-xs text-muted-foreground">
              Pieces analyzed in this period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Engagement Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(metricsSummary.average_engagement_rate || 0).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Average across all platforms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Hashtag</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metricsSummary.hashtag_performance?.[0]?.hashtag || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              Best performing hashtag
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Insights</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.ai_recommendations?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Actionable recommendations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="data">Raw Data</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-6 lg:grid-cols-2">
            <EngagementRateChart data={mockChartData} />
            <MetricsChart
              type="line"
              data={mockChartData}
              title="Performance Over Time"
              description="Content performance trends"
              dataKey="total_likes"
              xAxisKey="period"
              colors={['#8b5cf6']}
            />
          </div>

          {/* Description */}
          {report.description && (
            <Card>
              <CardHeader>
                <CardTitle>Executive Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{report.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Performance Highlights */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Highlights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-700">+15%</div>
                  <div className="text-sm text-green-600">Engagement Growth</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-700">4.2</div>
                  <div className="text-sm text-blue-600">Peak Engagement Rate</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-700">8PM</div>
                  <div className="text-sm text-orange-600">Best Posting Time</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <HashtagPerformanceChart data={mockHashtagData} />
            <PlatformComparisonChart data={mockPlatformData} />
          </div>

          {/* Additional Analytics */}
          <Card>
            <CardHeader>
              <CardTitle>Advanced Analytics</CardTitle>
              <CardDescription>
                Deep dive into your content performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Advanced Analytics</h3>
                <p className="text-muted-foreground">
                  Additional analytics features are being processed.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights">
          <AIInsights reportId={report.id} />
        </TabsContent>

        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle>Raw Data</CardTitle>
              <CardDescription>
                Detailed metrics and underlying data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Raw Data Export</h3>
                <p className="text-muted-foreground mb-4">
                  Export the complete dataset used in this report.
                </p>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline">Export as CSV</Button>
                  <Button variant="outline">Export as JSON</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}