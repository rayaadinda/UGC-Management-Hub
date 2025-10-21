import { supabase } from '@/lib/supabase'
import { ContentPerformanceMetrics, ContentMetricsFilters } from '@/types'

/**
 * Performance Analytics Service
 * Handles complex metric calculations and performance analysis
 */

export class PerformanceAnalyticsService {
  /**
   * Get content performance metrics with filtering
   */
  async getContentMetrics(filters?: ContentMetricsFilters): Promise<ContentPerformanceMetrics[]> {
    try {
      let query = supabase
        .from('content_performance_metrics')
        .select(`
          *,
          ugc_content:content_id (
            id,
            platform,
            author_username,
            caption,
            media_type,
            media_url,
            hashtags,
            status,
            created_at
          )
        `)
        .order('performance_score', { ascending: false })

      if (filters?.period_start) {
        query = query.gte('period_start', filters.period_start)
      }

      if (filters?.period_end) {
        query = query.lte('period_end', filters.period_end)
      }

      if (filters?.content_id) {
        query = query.eq('content_id', filters.content_id)
      }

      if (filters?.min_performance_score) {
        query = query.gte('performance_score', filters.min_performance_score)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching content metrics:', error)
      throw error
    }
  }

  /**
   * Get top performing content
   */
  async getTopPerformingContent(
    periodStart: string,
    periodEnd: string,
    limit: number = 10
  ): Promise<ContentPerformanceMetrics[]> {
    try {
      const { data, error } = await supabase
        .from('content_performance_metrics')
        .select(`
          *,
          ugc_content:content_id (
            id,
            platform,
            author_username,
            caption,
            media_type,
            media_url,
            hashtags,
            status,
            created_at
          )
        `)
        .gte('period_start', periodStart)
        .lte('period_end', periodEnd)
        .order('performance_score', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching top performing content:', error)
      throw error
    }
  }

  /**
   * Get performance trends over time
   */
  async getPerformanceTrends(
    periodStart: string,
    periodEnd: string,
    granularity: 'daily' | 'weekly' = 'daily'
  ): Promise<any[]> {
    try {
      let dateTrunc = granularity === 'daily' ? 'day' : 'week'

      const { data, error } = await supabase
        .rpc('get_performance_trends', {
          start_date: periodStart,
          end_date: periodEnd,
          date_granularity: dateTrunc
        })

      if (error) {
        // Fallback to basic query if RPC doesn't exist
        return this.getFallbackPerformanceTrends(periodStart, periodEnd, granularity)
      }

      return data || []
    } catch (error) {
      console.error('Error fetching performance trends:', error)
      return this.getFallbackPerformanceTrends(periodStart, periodEnd, granularity)
    }
  }

  /**
   * Fallback method for performance trends
   */
  private async getFallbackPerformanceTrends(
    periodStart: string,
    periodEnd: string,
    granularity: 'daily' | 'weekly'
  ): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('content_performance_metrics')
        .select('calculated_at, performance_score, engagement_rate, total_likes, total_comments')
        .gte('period_start', periodStart)
        .lte('period_end', periodEnd)
        .order('calculated_at', { ascending: true })

      if (error) throw error

      // Group by time period
      const groupedData = data?.reduce((acc, metric) => {
        const date = new Date(metric.calculated_at)
        const key = granularity === 'daily'
          ? date.toISOString().split('T')[0]
          : this.getWeekKey(date)

        if (!acc[key]) {
          acc[key] = {
            period: key,
            total_performance: 0,
            total_engagement_rate: 0,
            total_likes: 0,
            total_comments: 0,
            count: 0
          }
        }

        acc[key].total_performance += metric.performance_score
        acc[key].total_engagement_rate += metric.engagement_rate
        acc[key].total_likes += metric.total_likes
        acc[key].total_comments += metric.total_comments
        acc[key].count += 1

        return acc
      }, {} as Record<string, any>)

      // Calculate averages
      return Object.entries(groupedData || {}).map(([period, data]: [string, any]) => ({
        period,
        average_performance_score: data.total_performance / data.count,
        average_engagement_rate: data.total_engagement_rate / data.count,
        total_likes: data.total_likes,
        total_comments: data.total_comments,
        content_count: data.count
      }))
    } catch (error) {
      console.error('Error in fallback performance trends:', error)
      return []
    }
  }

  /**
   * Get hashtag performance analysis
   */
  async getHashtagPerformance(
    periodStart: string,
    periodEnd: string
  ): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('content_performance_metrics')
        .select('top_hashtags, performance_score, engagement_rate, total_likes, total_comments')
        .gte('period_start', periodStart)
        .lte('period_end', periodEnd)

      if (error) throw error

      // Aggregate hashtag performance
      const hashtagStats = data?.reduce((acc, metric) => {
        metric.top_hashtags.forEach((hashtag: string) => {
          if (!acc[hashtag]) {
            acc[hashtag] = {
              hashtag,
              usage_count: 0,
              total_performance: 0,
              total_engagement_rate: 0,
              total_likes: 0,
              total_comments: 0,
              content_list: []
            }
          }

          acc[hashtag].usage_count += 1
          acc[hashtag].total_performance += metric.performance_score
          acc[hashtag].total_engagement_rate += metric.engagement_rate
          acc[hashtag].total_likes += metric.total_likes
          acc[hashtag].total_comments += metric.total_comments
        })
        return acc
      }, {} as Record<string, any>)

      // Calculate averages and sort
      return Object.values(hashtagStats || {})
        .map((stats: any) => ({
          ...stats,
          average_performance: stats.total_performance / stats.usage_count,
          average_engagement_rate: stats.total_engagement_rate / stats.usage_count,
          engagement_per_post: (stats.total_likes + stats.total_comments) / stats.usage_count
        }))
        .sort((a, b) => b.average_engagement_rate - a.average_engagement_rate)
        .slice(0, 20) // Top 20 hashtags
    } catch (error) {
      console.error('Error fetching hashtag performance:', error)
      return []
    }
  }

  /**
   * Get platform comparison metrics
   */
  async getPlatformComparison(
    periodStart: string,
    periodEnd: string
  ): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('content_performance_metrics')
        .select(`
          performance_score,
          engagement_rate,
          total_likes,
          total_comments,
          ugc_content:content_id (
            platform
          )
        `)
        .gte('period_start', periodStart)
        .lte('period_end', periodEnd)

      if (error) throw error

      // Aggregate by platform
      const platformStats = data?.reduce((acc, metric) => {
        const platform = metric.ugc_content?.platform || 'unknown'
        if (!acc[platform]) {
          acc[platform] = {
            platform,
            content_count: 0,
            total_performance: 0,
            total_engagement_rate: 0,
            total_likes: 0,
            total_comments: 0
          }
        }

        acc[platform].content_count += 1
        acc[platform].total_performance += metric.performance_score
        acc[platform].total_engagement_rate += metric.engagement_rate
        acc[platform].total_likes += metric.total_likes
        acc[platform].total_comments += metric.total_comments

        return acc
      }, {} as Record<string, any>)

      // Calculate averages
      return Object.values(platformStats || {}).map((stats: any) => ({
        ...stats,
        average_performance: stats.content_count > 0 ? stats.total_performance / stats.content_count : 0,
        average_engagement_rate: stats.content_count > 0 ? stats.total_engagement_rate / stats.content_count : 0,
        engagement_per_post: stats.content_count > 0 ? (stats.total_likes + stats.total_comments) / stats.content_count : 0
      }))
    } catch (error) {
      console.error('Error fetching platform comparison:', error)
      return []
    }
  }

  /**
   * Get creator performance rankings
   */
  async getCreatorRankings(
    periodStart: string,
    periodEnd: string,
    limit: number = 20
  ): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('content_performance_metrics')
        .select(`
          performance_score,
          engagement_rate,
          total_likes,
          total_comments,
          ugc_content:content_id (
            author_username,
            platform
          )
        `)
        .gte('period_start', periodStart)
        .lte('period_end', periodEnd)

      if (error) throw error

      // Aggregate by creator
      const creatorStats = data?.reduce((acc, metric) => {
        const creator = metric.ugc_content?.author_username
        const platform = metric.ugc_content?.platform

        if (!creator) return acc

        const key = `${creator}-${platform}`
        if (!acc[key]) {
          acc[key] = {
            author_username: creator,
            platform,
            content_count: 0,
            total_performance: 0,
            total_engagement_rate: 0,
            total_likes: 0,
            total_comments: 0
          }
        }

        acc[key].content_count += 1
        acc[key].total_performance += metric.performance_score
        acc[key].total_engagement_rate += metric.engagement_rate
        acc[key].total_likes += metric.total_likes
        acc[key].total_comments += metric.total_comments

        return acc
      }, {} as Record<string, any>)

      // Calculate averages and sort
      return Object.values(creatorStats || {})
        .map((stats: any) => ({
          ...stats,
          average_performance: stats.total_performance / stats.content_count,
          average_engagement_rate: stats.total_engagement_rate / stats.content_count,
          total_engagement: stats.total_likes + stats.total_comments,
          engagement_per_post: (stats.total_likes + stats.total_comments) / stats.content_count
        }))
        .sort((a, b) => b.average_performance - a.average_performance)
        .slice(0, limit)
    } catch (error) {
      console.error('Error fetching creator rankings:', error)
      return []
    }
  }

  /**
   * Calculate content velocity metrics
   */
  async getContentVelocityMetrics(
    periodStart: string,
    periodEnd: string
  ): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('content_performance_metrics')
        .select('engagement_velocity, performance_score, calculated_at')
        .gte('period_start', periodStart)
        .lte('period_end', periodEnd)
        .order('calculated_at', { ascending: true })

      if (error) throw error

      if (!data || data.length === 0) {
        return {
          average_velocity: 0,
          peak_velocity: 0,
          velocity_trend: 'stable',
          fastest_growing_content: null
        }
      }

      const velocities = data.map(d => d.engagement_velocity).filter(v => v > 0)
      const averageVelocity = velocities.length > 0
        ? velocities.reduce((sum, v) => sum + v, 0) / velocities.length
        : 0

      const peakVelocity = Math.max(...velocities)

      // Calculate trend (simplified)
      const midpoint = Math.floor(data.length / 2)
      const firstHalf = data.slice(0, midpoint).map(d => d.engagement_velocity)
      const secondHalf = data.slice(midpoint).map(d => d.engagement_velocity)

      const firstHalfAvg = firstHalf.length > 0 ? firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length : 0
      const secondHalfAvg = secondHalf.length > 0 ? secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length : 0

      let velocityTrend = 'stable'
      if (secondHalfAvg > firstHalfAvg * 1.2) velocityTrend = 'increasing'
      else if (secondHalfAvg < firstHalfAvg * 0.8) velocityTrend = 'decreasing'

      const fastestGrowingContent = data
        .sort((a, b) => b.engagement_velocity - a.engagement_velocity)[0]

      return {
        average_velocity: averageVelocity,
        peak_velocity: peakVelocity,
        velocity_trend: velocityTrend,
        fastest_growing_content: fastestGrowingContent
      }
    } catch (error) {
      console.error('Error calculating content velocity metrics:', error)
      return {
        average_velocity: 0,
        peak_velocity: 0,
        velocity_trend: 'stable',
        fastest_growing_content: null
      }
    }
  }

  /**
   * Get week key for weekly grouping
   */
  private getWeekKey(date: Date): string {
    const startOfWeek = new Date(date)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day
    startOfWeek.setDate(diff)

    return startOfWeek.toISOString().split('T')[0]
  }

  /**
   * Export metrics data
   */
  async exportMetrics(
    format: 'json' | 'csv',
    filters?: ContentMetricsFilters
  ): Promise<any> {
    try {
      const data = await this.getContentMetrics(filters)

      if (format === 'csv') {
        // Convert to CSV format
        const headers = [
          'Content ID', 'Platform', 'Author', 'Performance Score',
          'Engagement Rate', 'Total Likes', 'Total Comments', 'Period Start',
          'Period End', 'Top Hashtags'
        ]

        const csvData = data.map(metric => [
          metric.content_id,
          metric.ugc_content?.platform || '',
          metric.ugc_content?.author_username || '',
          metric.performance_score,
          metric.engagement_rate,
          metric.total_likes,
          metric.total_comments,
          metric.period_start,
          metric.period_end,
          metric.top_hashtags.join('; ')
        ])

        return [headers, ...csvData]
      }

      return data
    } catch (error) {
      console.error('Error exporting metrics:', error)
      throw error
    }
  }
}

export const performanceAnalyticsService = new PerformanceAnalyticsService()