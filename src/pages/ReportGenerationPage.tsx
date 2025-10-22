import { ReportGenerator } from '@/components/reports/ReportGenerator'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Brain, TrendingUp, Download } from 'lucide-react'

export default function ReportGenerationPage() {
  const handleReportGenerated = (reportId: string) => {
    // Navigate to the report or show success message
    console.log('Report generated:', reportId)
    // Could redirect to /reports/{reportId} or show a success notification
  }

  return (
    <div className="container mx-auto py-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">Generate Performance Report</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Create comprehensive reports that analyze your content performance,
            identify trends, and provide AI-powered recommendations for improvement.
          </p>
        </div>

        {/* Features Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="text-center">
              <FileText className="h-8 w-8 mx-auto text-blue-500" />
              <CardTitle className="text-lg">Comprehensive Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center">
                Deep dive into your content metrics, engagement rates, and performance trends
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Brain className="h-8 w-8 mx-auto text-green-500" />
              <CardTitle className="text-lg">AI Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center">
                Get actionable recommendations powered by AI to improve your content strategy
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <TrendingUp className="h-8 w-8 mx-auto text-orange-500" />
              <CardTitle className="text-lg">Trend Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center">
                Identify patterns and track performance changes over time
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Download className="h-8 w-8 mx-auto text-purple-500" />
              <CardTitle className="text-lg">Easy Export</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center">
                Download professional PDF reports or view interactive dashboards
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Report Generator */}
        <ReportGenerator onReportGenerated={handleReportGenerated} />

        {/* Help Section */}
        <Card>
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
            <CardDescription>
              Tips for generating effective reports
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-2">📅 Choose the Right Time Period</h4>
                <p className="text-sm text-muted-foreground">
                  Weekly reports are great for tracking short-term progress, while monthly reports
                  provide broader strategic insights.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">🎯 Select Relevant Metrics</h4>
                <p className="text-sm text-muted-foreground">
                  Choose metrics that align with your goals. Focus on engagement for community
                  building or reach for brand awareness.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">🤖 Enable AI Recommendations</h4>
                <p className="text-sm text-muted-foreground">
                  AI insights provide personalized recommendations based on your specific
                  content performance and industry benchmarks.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">📊 Export Multiple Formats</h4>
                <p className="text-sm text-muted-foreground">
                  Use interactive dashboards for exploration and PDFs for sharing with
                  stakeholders and team members.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}