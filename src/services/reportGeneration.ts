import { supabase } from '@/lib/supabase'
import { WeeklyReport, ReportGenerationConfig, PerformanceMetricsSummary } from '@/types'

/**
 * Report Generation Service
 * Handles the creation and management of weekly reports
 */

export class ReportGenerationService {
  /**
   * Create a new weekly report
   */
  async createReport(config: ReportGenerationConfig): Promise<WeeklyReport> {
    try {
      // First, create the report record
      const { data: report, error: reportError } = await supabase
        .from('weekly_reports')
        .insert({
          title: config.title || 'Weekly Performance Report',
          description: config.description,
          report_period_start: config.period_start,
          report_period_end: config.period_end,
          status: 'draft',
          template_id: config.template_id,
          generated_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single()

      if (reportError) throw reportError

      // Update status to generating
      await supabase
        .from('weekly_reports')
        .update({ status: 'generating' })
        .eq('id', report.id)

      // Generate metrics summary
      const metricsSummary = await this.generateMetricsSummary(
        config.period_start,
        config.period_end,
        report.id
      )

      // Generate AI recommendations if enabled
      let aiRecommendations = []
      if (config.include_ai_recommendations) {
        aiRecommendations = await this.generateAIRecommendations(
          report.id,
          metricsSummary
        )
      }

      // Update report with generated data
      const { data: updatedReport, error: updateError } = await supabase
        .from('weekly_reports')
        .update({
          status: 'completed',
          metrics_summary: metricsSummary,
          ai_recommendations: aiRecommendations,
          updated_at: new Date().toISOString()
        })
        .eq('id', report.id)
        .select()
        .single()

      if (updateError) throw updateError

      return updatedReport
    } catch (error) {
      console.error('Error creating report:', error)
      throw error
    }
  }

  /**
   * Generate comprehensive metrics summary
   */
  private async generateMetricsSummary(
    periodStart: string,
    periodEnd: string,
    reportId: string
  ): Promise<PerformanceMetricsSummary> {
    try {
      // Fetch UGC content within the period
      const { data: ugcContent, error: contentError } = await supabase
        .from('ugc_content')
        .select('*')
        .gte('created_at', periodStart)
        .lte('created_at', periodEnd)
        .in('status', ['new', 'approved_for_repost', 'weekly_winner'])

      if (contentError) throw contentError

      // Calculate basic metrics
      const totalContent = ugcContent?.length || 0
      const totalLikes = ugcContent?.reduce((sum, content) => sum + content.likes_count, 0) || 0
      const totalComments = ugcContent?.reduce((sum, content) => sum + content.comments_count, 0) || 0
      const totalEngagement = totalLikes + totalComments

      // Calculate engagement rate (average engagement per content)
      const averageEngagementRate = totalContent > 0
        ? (totalEngagement / totalContent) / 100 // Simplified engagement rate
        : 0

      // Analyze hashtag performance
      const hashtagMap = new Map<string, { count: number; engagement: number }>()

      ugcContent?.forEach(content => {
        content.hashtags.forEach(hashtag => {
          const current = hashtagMap.get(hashtag) || { count: 0, engagement: 0 }
          hashtagMap.set(hashtag, {
            count: current.count + 1,
            engagement: current.engagement + content.likes_count + content.comments_count
          })
        })
      })

      const hashtagPerformance = Array.from(hashtagMap.entries())
        .map(([hashtag, data]) => ({
          hashtag,
          usage_count: data.count,
          avg_engagement_rate: data.count > 0 ? data.engagement / data.count : 0
        }))
        .sort((a, b) => b.avg_engagement_rate - a.avg_engagement_rate)
        .slice(0, 10) // Top 10 hashtags

      // Platform comparison
      const platformStats = ugcContent?.reduce((acc, content) => {
        const platform = content.platform
        if (!acc[platform]) {
          acc[platform] = { count: 0, engagement: 0 }
        }
        acc[platform].count += 1
        acc[platform].engagement += content.likes_count + content.comments_count
        return acc
      }, {} as Record<string, { count: number; engagement: number }>)

      const platformComparison = Object.entries(platformStats).map(([platform, stats]) => ({
        platform,
        content_count: stats.count,
        avg_performance: stats.count > 0 ? stats.engagement / stats.count : 0
      }))

      // Calculate best posting times (simplified - based on content creation time)
      const postingTimes = ugcContent?.map(content => {
        const date = new Date(content.created_at)
        return date.getHours()
      }) || []

      const hourCounts = postingTimes.reduce((acc, hour) => {
        acc[hour] = (acc[hour] || 0) + 1
        return acc
      }, {} as Record<number, number>)

      const bestPostingTimes = Object.entries(hourCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([hour]) => parseInt(hour))

      // Calculate peak engagement days
      const dayStats = ugcContent?.reduce((acc, content) => {
        const day = new Date(content.created_at).toLocaleDateString()
        if (!acc[day]) {
          acc[day] = { count: 0, engagement: 0 }
        }
        acc[day].count += 1
        acc[day].engagement += content.likes_count + content.comments_count
        return acc
      }, {} as Record<string, { count: number; engagement: number }>)

      const peakEngagementDays = Object.entries(dayStats)
        .sort((a, b) => b[1].engagement - a[1].engagement)
        .slice(0, 3)
        .map(([day]) => day)

      // Store content performance metrics
      if (ugcContent && ugcContent.length > 0) {
        const performanceMetrics = ugcContent.map(content => ({
          content_id: content.id,
          report_id: reportId,
          total_likes: content.likes_count,
          total_comments: content.comments_count,
          total_shares: 0, // Not tracked in current schema
          reach_estimate: content.likes_count * 5, // Simplified reach estimation
          engagement_rate: (content.likes_count + content.comments_count) / 100,
          performance_score: this.calculatePerformanceScore(content),
          viral_coefficient: this.calculateViralCoefficient(content),
          top_hashtags: content.hashtags.slice(0, 5),
          hashtag_effectiveness_score: this.calculateHashtagEffectiveness(content),
          peak_engagement_hour: new Date(content.created_at).getHours(),
          engagement_velocity: this.calculateEngagementVelocity(content),
          media_quality_score: 0.8, // Placeholder
          caption_sentiment: 'neutral' as const,
          period_start: periodStart,
          period_end: periodEnd,
          calculated_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }))

        await supabase
          .from('content_performance_metrics')
          .insert(performanceMetrics)
      }

      return {
        total_content: totalContent,
        average_engagement_rate: averageEngagementRate,
        top_performing_content: [], // Will be populated from metrics table
        hashtag_performance: hashtagPerformance,
        platform_comparison: platformComparison,
        time_based_insights: {
          best_posting_times: bestPostingTimes,
          peak_engagement_days: peakEngagementDays
        }
      }
    } catch (error) {
      console.error('Error generating metrics summary:', error)
      throw error
    }
  }

  /**
   * Generate AI-powered recommendations
   */
  private async generateAIRecommendations(
    reportId: string,
    metricsSummary: PerformanceMetricsSummary
  ): Promise<any[]> {
    try {
      const recommendations = []

      // Content strategy recommendations
      if (metricsSummary.average_engagement_rate < 2.0) {
        recommendations.push({
          report_id: reportId,
          category: 'content_strategy',
          title: 'Improve Content Quality',
          description: 'Your average engagement rate is below optimal levels. Focus on creating higher quality content.',
          actionable_steps: [
            'Analyze top performing content patterns',
            'Invest in better media quality',
            'Improve caption writing',
            'Test different content formats'
          ],
          priority_level: 'high',
          estimated_impact: 0.8,
          confidence_score: 0.85,
          supporting_data: {
            current_engagement_rate: metricsSummary.average_engagement_rate,
            recommended_target: 3.5
          },
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        })
      }

      // Hashtag strategy recommendations
      if (metricsSummary.hashtag_performance.length > 0) {
        const topHashtag = metricsSummary.hashtag_performance[0]
        if (topHashtag.avg_engagement_rate > metricsSummary.average_engagement_rate * 1.5) {
          recommendations.push({
            report_id: reportId,
            category: 'hashtag_strategy',
            title: 'Leverage High-Performing Hashtags',
            description: `The hashtag "${topHashtag.hashtag}" is significantly outperforming others.`,
            actionable_steps: [
              `Use "${topHashtag.hashtag}" more frequently`,
              'Analyze why this hashtag performs well',
              'Find similar trending hashtags',
              'Create content around this hashtag theme'
            ],
            priority_level: 'medium',
            estimated_impact: 0.6,
            confidence_score: 0.75,
            supporting_data: {
              top_hashtag: topHashtag,
              performance_improvement: topHashtag.avg_engagement_rate / metricsSummary.average_engagement_rate
            },
            status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          })
        }
      }

      // Timing strategy recommendations
      if (metricsSummary.time_based_insights.best_posting_times.length > 0) {
        const bestTime = metricsSummary.time_based_insights.best_posting_times[0]
        recommendations.push({
          report_id: reportId,
          category: 'timing_strategy',
          title: 'Optimize Posting Schedule',
          description: `Your content performs best around ${bestTime}:00. Schedule more posts during this time.`,
          actionable_steps: [
            `Schedule posts between ${bestTime-1}:00 and ${bestTime+1}:00`,
            'Test posting at the identified optimal time',
            'Maintain consistency in posting schedule',
            'Monitor engagement patterns after schedule change'
          ],
          priority_level: 'medium',
          estimated_impact: 0.5,
          confidence_score: 0.7,
          supporting_data: {
            best_posting_time: bestTime,
            recommended_time_window: `${bestTime-1}:00 - ${bestTime+1}:00`
          },
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
      }

      // Insert recommendations into database
      if (recommendations.length > 0) {
        await supabase
          .from('ai_recommendations')
          .insert(recommendations)
      }

      return recommendations
    } catch (error) {
      console.error('Error generating AI recommendations:', error)
      return []
    }
  }

  /**
   * Calculate performance score for content
   */
  private calculatePerformanceScore(content: any): number {
    const engagement = content.likes_count + content.comments_count
    const hashtagCount = content.hashtags.length
    const hasMedia = content.media_url ? 1 : 0

    // Simplified performance score calculation
    let score = (engagement * 0.6) + (hashtagCount * 5) + (hasMedia * 20)

    // Normalize to 0-100 scale
    return Math.min(Math.max(score / 10, 0), 100)
  }

  /**
   * Calculate viral coefficient
   */
  private calculateViralCoefficient(content: any): number {
    const engagement = content.likes_count + content.comments_count
    const followers = 1000 // Placeholder - would need actual follower data

    return followers > 0 ? engagement / followers : 0
  }

  /**
   * Calculate hashtag effectiveness
   */
  private calculateHashtagEffectiveness(content: any): number {
    const hashtagCount = content.hashtags.length
    const engagement = content.likes_count + content.comments_count

    return hashtagCount > 0 ? engagement / hashtagCount : 0
  }

  /**
   * Calculate engagement velocity
   */
  private calculateEngagementVelocity(content: any): number {
    const engagement = content.likes_count + content.comments_count
    const contentAge = Date.now() - new Date(content.created_at).getTime()
    const hoursOld = contentAge / (1000 * 60 * 60)

    return hoursOld > 0 ? engagement / hoursOld : 0
  }

  /**
   * Get all reports
   */
  async getReports(filters?: any): Promise<WeeklyReport[]> {
    try {
      let query = supabase
        .from('weekly_reports')
        .select('*')
        .order('generated_at', { ascending: false })

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }

      if (filters?.template_id && filters.template_id !== 'all') {
        query = query.eq('template_id', filters.template_id)
      }

      if (filters?.date_range) {
        query = query
          .gte('report_period_start', filters.date_range.start)
          .lte('report_period_end', filters.date_range.end)
      }

      if (filters?.search) {
        query = query.ilike('title', `%${filters.search}%`)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching reports:', error)
      throw error
    }
  }

  /**
   * Get a single report by ID
   */
  async getReport(id: string): Promise<WeeklyReport | null> {
    try {
      const { data, error } = await supabase
        .from('weekly_reports')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null // Not found
        throw error
      }

      return data
    } catch (error) {
      console.error('Error fetching report:', error)
      throw error
    }
  }

  /**
   * Delete a report
   */
  async deleteReport(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('weekly_reports')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting report:', error)
      throw error
    }
  }
}

export const reportGenerationService = new ReportGenerationService()