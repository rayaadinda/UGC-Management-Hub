import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CalendarIcon, FileText, Settings, Download, Brain, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { ReportGenerationConfig, ReportTemplate } from '@/types'
import { reportGenerationService } from '@/services/reportGeneration'
import { templateManagementService } from '@/services/templateManagement'
import { cn } from '@/lib/utils'

interface ReportGeneratorProps {
  onReportGenerated?: (reportId: string) => void
  className?: string
}

export function ReportGenerator({ onReportGenerated, className }: ReportGeneratorProps) {
  const [config, setConfig] = useState<ReportGenerationConfig>({
    period_start: format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    period_end: format(new Date(), 'yyyy-MM-dd'),
    include_ai_recommendations: true,
    export_formats: ['interactive']
  })

  const [templates, setTemplates] = useState<ReportTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generationStatus, setGenerationStatus] = useState<'idle' | 'generating' | 'completed' | 'error'>('idle')
  const [generatedReportId, setGeneratedReportId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const data = await templateManagementService.getTemplates()
      setTemplates(data)

      // Auto-select default template
      const defaultTemplate = data.find(t => t.is_default)
      if (defaultTemplate) {
        setSelectedTemplate(defaultTemplate)
        setConfig(prev => ({ ...prev, template_id: defaultTemplate.id }))
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    }
  }

  const handleGenerateReport = async () => {
    if (!config.period_start || !config.period_end) {
      setError('Please select both start and end dates')
      return
    }

    if (new Date(config.period_start) >= new Date(config.period_end)) {
      setError('End date must be after start date')
      return
    }

    try {
      setIsGenerating(true)
      setGenerationStatus('generating')
      setGenerationProgress(0)
      setError(null)

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 500)

      const report = await reportGenerationService.createReport(config)

      clearInterval(progressInterval)
      setGenerationProgress(100)
      setGenerationStatus('completed')
      setGeneratedReportId(report.id)

      if (onReportGenerated) {
        onReportGenerated(report.id)
      }
    } catch (error) {
      console.error('Error generating report:', error)
      setError(error instanceof Error ? error.message : 'Failed to generate report')
      setGenerationStatus('error')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleExport = (format: 'pdf') => {
    if (generatedReportId) {
      console.log(`Exporting report ${generatedReportId} as ${format}`)
    }
  }

  const getStatusIcon = () => {
    switch (generationStatus) {
      case 'generating':
        return <Clock className="h-5 w-5 text-blue-500 animate-spin" />
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <FileText className="h-5 w-5 text-gray-500" />
    }
  }

  const getPeriodLabel = () => {
    if (!config.period_start || !config.period_end) return 'Select period'

    const start = new Date(config.period_start)
    const end = new Date(config.period_end)
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

    return `${days} day period`
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Generate Report</h2>
          <p className="text-muted-foreground">
            Create comprehensive performance reports with AI-powered insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="text-sm font-medium capitalize">{generationStatus}</span>
        </div>
      </div>

      {/* Configuration */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Basic Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Basic Settings
            </CardTitle>
            <CardDescription>
              Configure your report parameters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Report Title</Label>
              <Input
                id="title"
                placeholder="Weekly Performance Report"
                value={config.title || ''}
                onChange={(e) => setConfig(prev => ({ ...prev, title: e.target.value }))}
                disabled={isGenerating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Optional description for this report..."
                value={config.description || ''}
                onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
                disabled={isGenerating}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Report Template</Label>
              <Select
                value={config.template_id || ''}
                onValueChange={(value) => {
                  setConfig(prev => ({ ...prev, template_id: value }))
                  const template = templates.find(t => t.id === value)
                  setSelectedTemplate(template || null)
                }}
                disabled={isGenerating}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      <div className="flex items-center gap-2">
                        <span>{template.name}</span>
                        {template.is_default && (
                          <Badge variant="secondary" className="text-xs">Default</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedTemplate && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">{selectedTemplate.description}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedTemplate.included_metrics.map((metric) => (
                    <Badge key={metric} variant="outline" className="text-xs">
                      {metric.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Date Range */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Date Range
            </CardTitle>
            <CardDescription>
              Select the period for your report
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={config.period_start}
                  onChange={(e) => setConfig(prev => ({ ...prev, period_start: e.target.value }))}
                  disabled={isGenerating}
                />
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={config.period_end}
                  onChange={(e) => setConfig(prev => ({ ...prev, period_end: e.target.value }))}
                  disabled={isGenerating}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const today = new Date()
                    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
                    setConfig(prev => ({
                      ...prev,
                      period_start: format(lastWeek, 'yyyy-MM-dd'),
                      period_end: format(today, 'yyyy-MM-dd')
                    }))
                  }}
                  disabled={isGenerating}
                >
                  Last 7 Days
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const today = new Date()
                    const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
                    setConfig(prev => ({
                      ...prev,
                      period_start: format(lastMonth, 'yyyy-MM-dd'),
                      period_end: format(today, 'yyyy-MM-dd')
                    }))
                  }}
                  disabled={isGenerating}
                >
                  Last 30 Days
                </Button>
              </div>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-900">
                {getPeriodLabel()}
              </p>
              <p className="text-xs text-blue-700">
                {config.period_start && config.period_end &&
                  `${format(new Date(config.period_start), 'MMM d, yyyy')} - ${format(new Date(config.period_end), 'MMM d, yyyy')}`
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI & Export Settings
          </CardTitle>
          <CardDescription>
            Configure AI recommendations and export options
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="ai-recommendations"
              checked={config.include_ai_recommendations}
              onCheckedChange={(checked) =>
                setConfig(prev => ({ ...prev, include_ai_recommendations: checked as boolean }))
              }
              disabled={isGenerating}
            />
            <Label htmlFor="ai-recommendations">
              Include AI-powered recommendations
            </Label>
          </div>

          {config.include_ai_recommendations && selectedTemplate?.ai_recommendations_enabled && (
            <div className="ml-6 p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800">
                AI will analyze your content and provide actionable insights for improvement.
              </p>
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedTemplate.recommendation_categories.map((category) => (
                  <Badge key={category} variant="outline" className="text-xs">
                    {category.replace('_', ' ')}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Export Formats</Label>
            <div className="flex flex-wrap gap-3">
              {['interactive', 'pdf'].map((format) => (
                <div key={format} className="flex items-center space-x-2">
                  <Checkbox
                    id={format}
                    checked={config.export_formats.includes(format)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setConfig(prev => ({
                          ...prev,
                          export_formats: [...prev.export_formats, format]
                        }))
                      } else {
                        setConfig(prev => ({
                          ...prev,
                          export_formats: prev.export_formats.filter(f => f !== format)
                        }))
                      }
                    }}
                    disabled={isGenerating}
                  />
                  <Label htmlFor={format} className="capitalize">
                    {format === 'pdf' ? 'PDF Download' : 'Interactive Dashboard'}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Progress Display */}
      {isGenerating && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Generating Report</CardTitle>
            <CardDescription>
              Please wait while we analyze your data and generate insights...
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={generationProgress} className="w-full" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Processing data...</span>
              <span>{generationProgress}%</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success Display */}
      {generationStatus === 'completed' && generatedReportId && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-lg text-green-800 flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Report Generated Successfully
            </CardTitle>
            <CardDescription className="text-green-700">
              Your report has been generated and is ready for review.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={() => console.log('View report', generatedReportId)}>
                <FileText className="h-4 w-4 mr-2" />
                View Report
              </Button>
              <Button variant="outline" onClick={() => handleExport('pdf')}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generate Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleGenerateReport}
          disabled={isGenerating || !config.period_start || !config.period_end}
          size="lg"
          className="min-w-32"
        >
          {isGenerating ? (
            <>
              <Clock className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4 mr-2" />
              Generate Report
            </>
          )}
        </Button>
      </div>
    </div>
  )
}