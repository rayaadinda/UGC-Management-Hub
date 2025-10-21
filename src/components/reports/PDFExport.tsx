import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Download, FileText, Settings, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { WeeklyReport } from '@/types'
import { cn } from '@/lib/utils'

interface PDFExportProps {
  report: WeeklyReport
  onExportComplete?: (url: string) => void
  className?: string
}

interface ExportOptions {
  includeCharts: boolean
  includeRecommendations: boolean
  includeRawData: boolean
  includeSummary: boolean
  colorMode: 'color' | 'grayscale'
  pageSize: 'a4' | 'letter'
}

export function PDFExport({ report, onExportComplete, className }: PDFExportProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [exportStatus, setExportStatus] = useState<'idle' | 'generating' | 'completed' | 'error'>('idle')
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includeCharts: true,
    includeRecommendations: true,
    includeRawData: false,
    includeSummary: true,
    colorMode: 'color',
    pageSize: 'a4'
  })

  const handleExport = async () => {
    try {
      setIsExporting(true)
      setExportStatus('generating')
      setExportProgress(0)

      // Simulate PDF generation progress
      const progressSteps = [
        { step: 'Collecting data', progress: 20 },
        { step: 'Generating charts', progress: 40 },
        { step: 'Processing recommendations', progress: 60 },
        { step: 'Formatting report', progress: 80 },
        { step: 'Creating PDF', progress: 100 }
      ]

      for (const { progress } of progressSteps) {
        await new Promise(resolve => setTimeout(resolve, 500))
        setExportProgress(progress)
      }

      // Generate PDF URL (in real implementation, this would be a real URL)
      const pdfUrl = `https://example.com/reports/${report.id}.pdf`

      setExportStatus('completed')
      if (onExportComplete) {
        onExportComplete(pdfUrl)
      }

      // Trigger download
      const link = document.createElement('a')
      link.href = pdfUrl
      link.download = `${report.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

    } catch (error) {
      console.error('Error exporting PDF:', error)
      setExportStatus('error')
    } finally {
      setIsExporting(false)
    }
  }

  const getStatusIcon = () => {
    switch (exportStatus) {
      case 'generating':
        return <Loader2 className="h-4 w-4 animate-spin" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Download className="h-4 w-4" />
    }
  }

  const getExportSizeEstimate = () => {
    let sections = 0

    if (exportOptions.includeSummary) sections += 1
    if (exportOptions.includeCharts) sections += 4
    if (exportOptions.includeRecommendations) sections += 1
    if (exportOptions.includeRawData) sections += 3

    // Rough estimate: ~200KB per section
    const estimatedKB = sections * 200
    return estimatedKB > 1024 ? `${(estimatedKB / 1024).toFixed(1)}MB` : `${estimatedKB}KB`
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Export Report as PDF
          </CardTitle>
          <CardDescription>
            Download a professional PDF version of your report with customizable options
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <h3 className="font-semibold">{report.title}</h3>
              <p className="text-sm text-muted-foreground">
                {new Date(report.report_period_start).toLocaleDateString()} - {new Date(report.report_period_end).toLocaleDateString()}
              </p>
            </div>
            <Badge variant={report.status === 'completed' ? 'default' : 'secondary'}>
              {report.status}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Export Options
          </CardTitle>
          <CardDescription>
            Customize what to include in your PDF export
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Content Options */}
          <div className="space-y-4">
            <h4 className="font-medium">Content Sections</h4>
            <div className="grid gap-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-summary"
                  checked={exportOptions.includeSummary}
                  onCheckedChange={(checked) =>
                    setExportOptions(prev => ({ ...prev, includeSummary: checked as boolean }))
                  }
                  disabled={isExporting}
                />
                <Label htmlFor="include-summary" className="flex items-center justify-between w-full">
                  <span>Executive Summary</span>
                  <span className="text-sm text-muted-foreground">Overview and key insights</span>
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-charts"
                  checked={exportOptions.includeCharts}
                  onCheckedChange={(checked) =>
                    setExportOptions(prev => ({ ...prev, includeCharts: checked as boolean }))
                  }
                  disabled={isExporting}
                />
                <Label htmlFor="include-charts" className="flex items-center justify-between w-full">
                  <span>Charts & Graphs</span>
                  <span className="text-sm text-muted-foreground">Visual analytics and trends</span>
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-recommendations"
                  checked={exportOptions.includeRecommendations}
                  onCheckedChange={(checked) =>
                    setExportOptions(prev => ({ ...prev, includeRecommendations: checked as boolean }))
                  }
                  disabled={isExporting}
                />
                <Label htmlFor="include-recommendations" className="flex items-center justify-between w-full">
                  <span>AI Recommendations</span>
                  <span className="text-sm text-muted-foreground">Actionable insights ({report.ai_recommendations?.length || 0})</span>
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-raw-data"
                  checked={exportOptions.includeRawData}
                  onCheckedChange={(checked) =>
                    setExportOptions(prev => ({ ...prev, includeRawData: checked as boolean }))
                  }
                  disabled={isExporting}
                />
                <Label htmlFor="include-raw-data" className="flex items-center justify-between w-full">
                  <span>Raw Data Tables</span>
                  <span className="text-sm text-muted-foreground">Detailed metrics and data</span>
                </Label>
              </div>
            </div>
          </div>

          {/* Format Options */}
          <div className="space-y-4">
            <h4 className="font-medium">Format Options</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Color Mode</Label>
                <div className="flex gap-2">
                  {(['color', 'grayscale'] as const).map((mode) => (
                    <Button
                      key={mode}
                      variant={exportOptions.colorMode === mode ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setExportOptions(prev => ({ ...prev, colorMode: mode }))}
                      disabled={isExporting}
                    >
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Page Size</Label>
                <div className="flex gap-2">
                  {(['a4', 'letter'] as const).map((size) => (
                    <Button
                      key={size}
                      variant={exportOptions.pageSize === size ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setExportOptions(prev => ({ ...prev, pageSize: size }))}
                      disabled={isExporting}
                    >
                      {size.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Export Info */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900">Estimated file size</p>
                <p className="text-xs text-blue-700">
                  {getExportSizeEstimate()} • {exportOptions.colorMode === 'color' ? 'Color' : 'Grayscale'} • {exportOptions.pageSize.toUpperCase()}
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-blue-800">
                <FileText className="h-4 w-4" />
                PDF Format
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Progress */}
      {isExporting && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Generating PDF</CardTitle>
            <CardDescription>
              Please wait while we create your PDF report...
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={exportProgress} className="w-full" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                {exportProgress < 20 && 'Initializing...'}
                {exportProgress >= 20 && exportProgress < 40 && 'Collecting data...'}
                {exportProgress >= 40 && exportProgress < 60 && 'Generating charts...'}
                {exportProgress >= 60 && exportProgress < 80 && 'Processing content...'}
                {exportProgress >= 80 && exportProgress < 100 && 'Creating PDF...'}
                {exportProgress === 100 && 'Finalizing...'}
              </span>
              <span>{exportProgress}%</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success/Error Messages */}
      {exportStatus === 'completed' && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            PDF generated successfully! Your download should start automatically.
          </AlertDescription>
        </Alert>
      )}

      {exportStatus === 'error' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to generate PDF. Please try again or contact support if the issue persists.
          </AlertDescription>
        </Alert>
      )}

      {/* Export Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleExport}
          disabled={isExporting}
          size="lg"
          className="min-w-32"
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              {getStatusIcon()}
              <span className="ml-2">Export PDF</span>
            </>
          )}
        </Button>
      </div>
    </div>
  )
}