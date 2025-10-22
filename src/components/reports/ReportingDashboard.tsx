import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { FileText, Download, Plus, TrendingUp, BarChart3, Brain, Filter } from 'lucide-react'
import { WeeklyReport, WeeklyReportFilters } from '@/types'
import { reportGenerationService } from '@/services/reportGeneration'
import { pdfExportService } from '@/services/pdfExportService'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ReportingDashboardProps {
  className?: string
}

export function ReportingDashboard({ className }: ReportingDashboardProps) {
  const [reports, setReports] = useState<WeeklyReport[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<WeeklyReportFilters>({
    status: 'all',
    template_id: 'all',
    search: ''
  })

  useEffect(() => {
    fetchReports()
  }, [filters])

  const fetchReports = async () => {
    try {
      setLoading(true)
      const data = await reportGenerationService.getReports(filters)
      setReports(data)
    } catch (error) {
      console.error('Error fetching reports:', error)
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

  const getStatusIcon = (status: WeeklyReport['status']) => {
    switch (status) {
      case 'completed':
        return <FileText className="h-4 w-4" />
      case 'generating':
        return <TrendingUp className="h-4 w-4" />
      case 'draft':
        return <FileText className="h-4 w-4" />
      case 'failed':
        return <FileText className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleExportReport = async (reportId: string, format: 'pdf' | 'json') => {
    try {
      // Get the report data
      const report = await reportGenerationService.getReport(reportId)
      if (!report) {
        toast.error('Report not found')
        return
      }

      toast.loading(`Generating ${format.toUpperCase()} export...`, { id: 'export-report' })

      if (format === 'pdf') {
        // Generate PDF
        await pdfExportService.generateReportPDF(report)
        toast.success('Report PDF downloaded successfully!', { id: 'export-report' })
      } else if (format === 'json') {
        // Generate JSON export
        const jsonData = JSON.stringify(report, null, 2)
        const blob = new Blob([jsonData], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${report.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        toast.success('Report JSON downloaded successfully!', { id: 'export-report' })
      }
    } catch (error) {
      console.error('Error exporting report:', error)
      toast.error('Failed to export report', { id: 'export-report' })
    }
  }

  const handleDeleteReport = async (reportId: string) => {
    try {
      await reportGenerationService.deleteReport(reportId)
      fetchReports()
    } catch (error) {
      console.error('Error deleting report:', error)
    }
  }

  const stats = {
    totalReports: reports.length,
    completedReports: reports.filter(r => r.status === 'completed').length,
    highEngagementReports: reports.filter(r =>
      r.metrics_summary.average_engagement_rate > 3.0
    ).length
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reporting Dashboard</h1>
          <p className="text-muted-foreground">
            Generate and analyze weekly performance reports with AI-powered insights
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Generate Report
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReports}</div>
            <p className="text-xs text-muted-foreground">
              All time reports generated
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Reports</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedReports}</div>
            <p className="text-xs text-muted-foreground">
              Successfully generated reports
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.highEngagementReports}</div>
            <p className="text-xs text-muted-foreground">
              Reports with strong engagement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Insights</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reports.reduce((sum, r) => sum + (r.ai_recommendations?.length || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total AI recommendations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="reports" className="space-y-4">
        <TabsList>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) => setFilters({ ...filters, status: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="generating">Generating</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Template</label>
                  <Select
                    value={filters.template_id}
                    onValueChange={(value) => setFilters({ ...filters, template_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Templates</SelectItem>
                      <SelectItem value="weekly">Weekly Report</SelectItem>
                      <SelectItem value="monthly">Monthly Report</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Search</label>
                  <Input
                    placeholder="Search reports..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  />
                </div>

                <div className="flex items-end">
                  <Button variant="outline" onClick={() => setFilters({ status: 'all', template_id: 'all', search: '' })}>
                    Reset Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reports List */}
          <div className="grid gap-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="text-muted-foreground">Loading reports...</div>
              </div>
            ) : reports.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No reports found</h3>
                  <p className="text-muted-foreground mb-4">
                    Get started by generating your first weekly report.
                  </p>
                  <Button>Generate Report</Button>
                </CardContent>
              </Card>
            ) : (
              reports.map((report) => (
                <Card key={report.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(report.status)}
                        <div>
                          <CardTitle className="text-lg">{report.title}</CardTitle>
                          <CardDescription>
                            {formatDate(report.report_period_start)} - {formatDate(report.report_period_end)}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(report.status)}>
                          {report.status}
                        </Badge>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleExportReport(report.id, 'pdf')}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteReport(report.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Content</div>
                        <div className="text-lg font-semibold">
                          {report.metrics_summary.total_content || 0}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Avg Engagement</div>
                        <div className="text-lg font-semibold">
                          {(report.metrics_summary.average_engagement_rate || 0).toFixed(2)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">AI Insights</div>
                        <div className="text-lg font-semibold">
                          {report.ai_recommendations?.length || 0}
                        </div>
                      </div>
                    </div>

                    {report.description && (
                      <p className="text-sm text-muted-foreground mt-4">
                        {report.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Performance Analytics</CardTitle>
              <CardDescription>
                Deep dive into your content performance metrics and trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Analytics Dashboard</h3>
                <p className="text-muted-foreground">
                  Advanced analytics features coming soon.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Report Templates</CardTitle>
              <CardDescription>
                Manage and customize your report templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Template Management</h3>
                <p className="text-muted-foreground">
                  Template customization features coming soon.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}