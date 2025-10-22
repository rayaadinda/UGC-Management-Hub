import { WeeklyReport, ReportGenerationConfig, PerformanceMetricsSummary, AIRecommendation } from '@/types'

// Mock data generation utilities
const generateId = () => Math.random().toString(36).substr(2, 9)
const randomFloat = (min: number, max: number) => Math.random() * (max - min) + min
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min

// Sample report titles
const reportTitles = [
  'Weekly Performance Analysis',
  'Content Engagement Report',
]

/**
 * Mock Report Generation Service
 * Generates reports without database dependency to bypass RLS issues
 */
export class MockReportGenerationService {
  private mockReports: WeeklyReport[] = []

  constructor() {
    this.initializeMockReports()
  }

  /**
   * Initialize with some mock reports
   */
  private initializeMockReports() {
    const now = new Date()
    for (let i = 0; i < 5; i++) {
      const reportDate = new Date(now.getTime() - (i * 7 * 24 * 60 * 60 * 1000))
      this.mockReports.push(this.generateMockReport(reportDate))
    }
  }

  /**
   * Generate a single mock report
   */
  private generateMockReport(date: Date): WeeklyReport {
    const reportId = `report_${generateId()}`
    const startDate = new Date(date.getTime() - (7 * 24 * 60 * 60 * 1000))
    const endDate = date

    const report: WeeklyReport = {
      id: reportId,
      title: reportTitles[randomInt(0, reportTitles.length - 1)],
      description: 'Comprehensive analysis of content performance and engagement metrics for the specified period.',
      report_period_start: startDate.toISOString(),
      report_period_end: endDate.toISOString(),
      status: 'completed',
      generated_at: date.toISOString(),
      generated_by: 'system',
      template_id: undefined,
      file_url: `https://example.com/reports/${reportId}.pdf`,
      metrics_summary: this.generateMockMetricsSummary(),
      ai_recommendations: this.generateMockAIRecommendations(reportId),
      created_at: startDate.toISOString(),
      updated_at: date.toISOString()
    }

    return report
  }

  /**
   * Generate mock metrics summary
   */
  private generateMockMetricsSummary(): PerformanceMetricsSummary {
    const totalContent = randomInt(20, 100)
    const avgEngagementRate = randomFloat(2.0, 8.0)

    const hashtagPerformance = [
      { hashtag: 'motorcycle', usage_count: randomInt(10, 50), avg_engagement_rate: randomFloat(3, 7) },
      { hashtag: 'riding', usage_count: randomInt(8, 40), avg_engagement_rate: randomFloat(2.5, 6) },
      { hashtag: 'bikerlife', usage_count: randomInt(5, 30), avg_engagement_rate: randomFloat(4, 8) },
      { hashtag: 'sportbike', usage_count: randomInt(3, 25), avg_engagement_rate: randomFloat(2, 5) },
      { hashtag: 'racing', usage_count: randomInt(5, 35), avg_engagement_rate: randomFloat(3, 6) }
    ].sort((a, b) => b.avg_engagement_rate - a.avg_engagement_rate)

    const platformComparison = [
      { platform: 'instagram', content_count: Math.floor(totalContent * 0.6), avg_performance: randomFloat(3, 7) },
      { platform: 'tiktok', content_count: Math.floor(totalContent * 0.4), avg_performance: randomFloat(4, 8) }
    ]

    const bestPostingTimes = [randomInt(18, 22), randomInt(12, 15), randomInt(8, 10)]
    const peakEngagementDays = ['Monday', 'Wednesday', 'Friday']

    return {
      total_content: totalContent,
      average_engagement_rate: avgEngagementRate,
      top_performing_content: [],
      hashtag_performance: hashtagPerformance,
      platform_comparison: platformComparison,
      time_based_insights: {
        best_posting_times: bestPostingTimes,
        peak_engagement_days: peakEngagementDays
      }
    }
  }

  /**
   * Generate mock AI recommendations
   */
  private generateMockAIRecommendations(reportId: string): AIRecommendation[] {
    const recommendations: AIRecommendation[] = [
      {
        id: `rec_${generateId()}`,
        report_id: reportId,
        category: 'content_strategy',
        title: 'Optimize Content Timing',
        description: 'Your content performs best during evening hours. Schedule more posts between 6-9 PM.',
        actionable_steps: [
          'Schedule posts between 6-9 PM for maximum engagement',
          'Test different content formats during peak hours',
          'Maintain consistency in posting schedule',
          'Monitor engagement patterns after timing changes'
        ],
        priority_level: 'high',
        estimated_impact: 0.8,
        confidence_score: 0.85,
        supporting_data: {
          current_avg_engagement: 3.2,
          projected_engagement: 4.5,
          best_posting_times: [18, 19, 20]
        },
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: `rec_${generateId()}`,
        report_id: reportId,
        category: 'hashtag_strategy',
        title: 'Leverage High-Performing Hashtags',
        description: 'The hashtag "bikerlife" is significantly outperforming others with 40% higher engagement.',
        actionable_steps: [
          'Use "bikerlife" more frequently in posts',
          'Create content specifically around biker lifestyle themes',
          'Research related trending hashtags in the motorcycle niche',
          'Engage with bikerlife community posts'
        ],
        priority_level: 'medium',
        estimated_impact: 0.6,
        confidence_score: 0.75,
        supporting_data: {
          top_hashtag: 'bikerlife',
          performance_improvement: 1.4,
          current_usage: 15,
          recommended_usage: 25
        },
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: `rec_${generateId()}`,
        report_id: reportId,
        category: 'engagement_optimization',
        title: 'Improve Visual Content Quality',
        description: 'Posts with high-quality images receive 2.3x more engagement than average posts.',
        actionable_steps: [
          'Invest in better photography equipment',
          'Use professional editing tools',
          'Ensure proper lighting in all content',
          'Create consistent visual branding'
        ],
        priority_level: 'medium',
        estimated_impact: 0.7,
        confidence_score: 0.8,
        supporting_data: {
          current_quality_score: 6.5,
          target_quality_score: 8.5,
          engagement_improvement: 2.3
        },
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]

    return recommendations
  }

  /**
   * Create a new report (mock implementation)
   */
  async createReport(config: ReportGenerationConfig): Promise<WeeklyReport> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000))

    const newReport = this.generateMockReport(new Date())
    newReport.title = config.title || 'Custom Performance Report'
    newReport.description = config.description
    newReport.report_period_start = config.period_start
    newReport.report_period_end = config.period_end

    if (config.include_ai_recommendations) {
      newReport.ai_recommendations = this.generateMockAIRecommendations(newReport.id)
    } else {
      newReport.ai_recommendations = []
    }

    this.mockReports.unshift(newReport)
    return newReport
  }

  /**
   * Get all reports (mock implementation)
   */
  async getReports(filters?: any): Promise<WeeklyReport[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))

    let filteredReports = [...this.mockReports]

    if (filters?.status && filters.status !== 'all') {
      filteredReports = filteredReports.filter(report => report.status === filters.status)
    }

    if (filters?.date_range) {
      const startDate = new Date(filters.date_range.start)
      const endDate = new Date(filters.date_range.end)
      filteredReports = filteredReports.filter(report => {
        const reportDate = new Date(report.generated_at)
        return reportDate >= startDate && reportDate <= endDate
      })
    }

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase()
      filteredReports = filteredReports.filter(report =>
        report.title.toLowerCase().includes(searchLower) ||
        report.description?.toLowerCase().includes(searchLower)
      )
    }

    return filteredReports
  }

  /**
   * Get a single report by ID (mock implementation)
   */
  async getReport(id: string): Promise<WeeklyReport | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300))

    const report = this.mockReports.find(r => r.id === id)
    return report || null
  }

  /**
   * Delete a report (mock implementation)
   */
  async deleteReport(id: string): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200))

    const index = this.mockReports.findIndex(r => r.id === id)
    if (index !== -1) {
      this.mockReports.splice(index, 1)
    }
  }

  /**
   * Update report status (mock implementation)
   */
  async updateReportStatus(id: string, status: WeeklyReport['status']): Promise<WeeklyReport> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300))

    const report = this.mockReports.find(r => r.id === id)
    if (!report) {
      throw new Error('Report not found')
    }

    report.status = status
    report.updated_at = new Date().toISOString()

    return report
  }
}

export const mockReportGenerationService = new MockReportGenerationService()