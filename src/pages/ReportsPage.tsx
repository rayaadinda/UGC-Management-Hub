import { useState } from 'react'
import { ReportingDashboard } from '@/components/reports/ReportingDashboard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, FileText, BarChart3, Brain, Settings, Download } from 'lucide-react'
import { ReportGenerator } from '@/components/reports/ReportGenerator'
import { reportGenerationService } from '@/services/reportGeneration'
import { pdfExportService } from '@/services/pdfExportService'
import { toast } from 'sonner'

export default function ReportsPage() {
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false)
  const [generatedReportId, setGeneratedReportId] = useState<string | null>(null)

  const handleReportGenerated = (reportId: string) => {
    setGeneratedReportId(reportId)
    setIsGeneratorOpen(false)
    // Refresh the dashboard or navigate to the new report
  }

  const handleDownloadGeneratedReport = async () => {
    if (!generatedReportId) {
      toast.error('No report available to download')
      return
    }

    try {
      toast.loading('Downloading report PDF...', { id: 'download-report' })

      // Get the report data
      const report = await reportGenerationService.getReport(generatedReportId)
      if (!report) {
        toast.error('Report not found', { id: 'download-report' })
        return
      }

      // Generate PDF
      await pdfExportService.generateReportPDF(report)
      toast.success('Report downloaded successfully!', { id: 'download-report' })
    } catch (error) {
      console.error('Error downloading report:', error)
      toast.error('Failed to download report', { id: 'download-report' })
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Generate comprehensive reports with AI-powered insights to track and improve your content performance
          </p>
        </div>
        <Dialog open={isGeneratorOpen} onOpenChange={setIsGeneratorOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2">
              <Plus className="h-4 w-4" />
              Generate Report
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Generate Performance Report</DialogTitle>
              <DialogDescription>
                Create a comprehensive report with AI-powered insights and recommendations
              </DialogDescription>
            </DialogHeader>
            <ReportGenerator onReportGenerated={handleReportGenerated} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reports Generated</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              +2 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Insights</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">48</div>
            <p className="text-xs text-muted-foreground">
              Actionable recommendations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Engagement</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3.2%</div>
            <p className="text-xs text-muted-foreground">
              +0.5% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Content</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">
              Pieces analyzed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard */}
      <ReportingDashboard />

      {/* Quick Actions */}
      {generatedReportId && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">Report Generated Successfully!</CardTitle>
            <CardDescription className="text-green-700">
              Your new report is ready. You can view it in the dashboard above or export it immediately.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button variant="default" className="bg-green-600 hover:bg-green-700">
                View Report
              </Button>
              <Button variant="outline" onClick={handleDownloadGeneratedReport}>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}