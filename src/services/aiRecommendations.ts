import { supabase } from '@/lib/supabase'
import { AIRecommendation } from '@/types'

/**
 * AI Recommendations Service
 * Handles AI-powered improvement suggestions and insights
 */

export class AIRecommendationsService {
  /**
   * Get recommendations for a specific report
   */
  async getRecommendations(reportId: string): Promise<AIRecommendation[]> {
    try {
      const { data, error } = await supabase
        .from('ai_recommendations')
        .select('*')
        .eq('report_id', reportId)
        .order('priority_level', { ascending: false })
        .order('estimated_impact', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching recommendations:', error)
      throw error
    }
  }

  /**
   * Get recommendations filtered by category
   */
  async getRecommendationsByCategory(
    reportId: string,
    category: AIRecommendation['category']
  ): Promise<AIRecommendation[]> {
    try {
      const { data, error } = await supabase
        .from('ai_recommendations')
        .select('*')
        .eq('report_id', reportId)
        .eq('category', category)
        .order('priority_level', { ascending: false })
        .order('estimated_impact', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching recommendations by category:', error)
      throw error
    }
  }

  /**
   * Get high-priority recommendations
   */
  async getHighPriorityRecommendations(reportId: string): Promise<AIRecommendation[]> {
    try {
      const { data, error } = await supabase
        .from('ai_recommendations')
        .select('*')
        .eq('report_id', reportId)
        .in('priority_level', ['high', 'critical'])
        .order('priority_level', { ascending: false })
        .order('estimated_impact', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching high priority recommendations:', error)
      throw error
    }
  }

  /**
   * Update recommendation status
   */
  async updateRecommendationStatus(
    id: string,
    status: AIRecommendation['status'],
    implementationNotes?: string
  ): Promise<AIRecommendation> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      }

      if (implementationNotes) {
        updateData.implementation_notes = implementationNotes
      }

      const { data, error } = await supabase
        .from('ai_recommendations')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating recommendation status:', error)
      throw error
    }
  }

  /**
   * Dismiss a recommendation
   */
  async dismissRecommendation(id: string, reason?: string): Promise<void> {
    try {
      const updateData: any = {
        status: 'dismissed',
        updated_at: new Date().toISOString()
      }

      if (reason) {
        updateData.implementation_notes = `Dismissed: ${reason}`
      }

      const { error } = await supabase
        .from('ai_recommendations')
        .update(updateData)
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Error dismissing recommendation:', error)
      throw error
    }
  }

  /**
   * Generate additional recommendations based on updated metrics
   */
  async generateAdditionalRecommendations(
    reportId: string,
    metricsData: any,
    additionalContext?: any
  ): Promise<AIRecommendation[]> {
    try {
      const recommendations = []

      // Analyze content quality patterns
      if (metricsData.average_engagement_rate < 2.5) {
        recommendations.push({
          report_id: reportId,
          category: 'content_strategy',
          title: 'Content Quality Enhancement Needed',
          description: 'Your content engagement rates are below industry standards. Focus on improving content quality.',
          actionable_steps: [
            'Invest in better equipment for media production',
            'Study top-performing content in your niche',
            'Develop consistent brand aesthetic',
            'Create more engaging captions with calls-to-action'
          ],
          priority_level: 'high',
          estimated_impact: 0.85,
          confidence_score: 0.9,
          supporting_data: {
            current_engagement_rate: metricsData.average_engagement_rate,
            industry_average: 3.5,
            improvement_potential: 0.75
          },
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
      }

      // Analyze posting frequency and timing
      if (additionalContext?.posting_frequency < 3) { // Less than 3 posts per week
        recommendations.push({
          report_id: reportId,
          category: 'timing_strategy',
          title: 'Increase Posting Frequency',
          description: 'Consistent posting frequency is crucial for algorithm visibility and audience engagement.',
          actionable_steps: [
            'Create a content calendar for consistent posting',
            'Aim for 4-5 high-quality posts per week',
            'Use scheduling tools to maintain consistency',
            'Batch create content to ensure steady supply'
          ],
          priority_level: 'medium',
          estimated_impact: 0.6,
          confidence_score: 0.8,
          supporting_data: {
            current_frequency: additionalContext.posting_frequency,
            recommended_frequency: '4-5 posts per week',
            expected_improvement: '30-40% increase in reach'
          },
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
      }

      // Analyze hashtag strategy
      if (metricsData.hashtag_performance && metricsData.hashtag_performance.length > 0) {
        const topHashtags = metricsData.hashtag_performance.slice(0, 3)
        const diverseHashtags = new Set(topHashtags.map((h: any) => h.hashtag)).size

        if (diverseHashtags < 3) {
          recommendations.push({
            report_id: reportId,
            category: 'hashtag_strategy',
            title: 'Diversify Your Hashtag Strategy',
            description: 'Using a diverse range of hashtags can significantly increase your content discoverability.',
            actionable_steps: [
              'Research trending hashtags in your niche',
              'Use a mix of high, medium, and low competition hashtags',
              'Include branded hashtags consistently',
              'Test 15-20 relevant hashtags per post'
            ],
            priority_level: 'medium',
            estimated_impact: 0.5,
            confidence_score: 0.75,
            supporting_data: {
              current_hashtag_diversity: diverseHashtags,
              recommended_diversity: '15-20 diverse hashtags',
              top_performing_hashtags: topHashtags
            },
            status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          })
        }
      }

      // Analyze platform performance
      if (metricsData.platform_comparison && metricsData.platform_comparison.length > 1) {
        const platforms = metricsData.platform_comparison
        const bestPlatform = platforms.reduce((best: any, current: any) =>
          current.avg_performance > best.avg_performance ? current : best
        )

        const worstPlatform = platforms.reduce((worst: any, current: any) =>
          current.avg_performance < worst.avg_performance ? current : worst
        )

        if (bestPlatform.avg_performance > worstPlatform.avg_performance * 1.5) {
          recommendations.push({
            report_id: reportId,
            category: 'platform_optimization',
            title: `Optimize ${worstPlatform.platform} Strategy`,
            description: `Your ${worstPlatform.platform} performance is significantly lower than ${bestPlatform.platform}.`,
            actionable_steps: [
              `Analyze successful content patterns from ${bestPlatform.platform}`,
              `Adapt content format for ${worstPlatform.platform} audience`,
              'Study top creators in your niche on the underperforming platform',
              'Consider platform-specific content optimization'
            ],
            priority_level: 'medium',
            estimated_impact: 0.65,
            confidence_score: 0.8,
            supporting_data: {
              best_platform: bestPlatform,
              worst_platform: worstPlatform,
              performance_gap: bestPlatform.avg_performance / worstPlatform.avg_performance
            },
            status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          })
        }
      }

      // Insert new recommendations
      if (recommendations.length > 0) {
        const { data, error } = await supabase
          .from('ai_recommendations')
          .insert(recommendations)
          .select()

        if (error) throw error
        return data || []
      }

      return []
    } catch (error) {
      console.error('Error generating additional recommendations:', error)
      return []
    }
  }

  /**
   * Get recommendation insights and patterns
   */
  async getRecommendationInsights(reportId: string): Promise<any> {
    try {
      const recommendations = await this.getRecommendations(reportId)

      if (recommendations.length === 0) {
        return {
          total_recommendations: 0,
          priority_breakdown: {},
          category_breakdown: {},
          average_confidence: 0,
          implementation_status: {}
        }
      }

      // Analyze priority distribution
      const priorityBreakdown = recommendations.reduce((acc, rec) => {
        acc[rec.priority_level] = (acc[rec.priority_level] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      // Analyze category distribution
      const categoryBreakdown = recommendations.reduce((acc, rec) => {
        acc[rec.category] = (acc[rec.category] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      // Calculate average confidence
      const averageConfidence = recommendations.reduce((sum, rec) => sum + rec.confidence_score, 0) / recommendations.length

      // Analyze implementation status
      const implementationStatus = recommendations.reduce((acc, rec) => {
        acc[rec.status] = (acc[rec.status] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      // Calculate potential impact
      const totalPotentialImpact = recommendations.reduce((sum, rec) => sum + rec.estimated_impact, 0)

      return {
        total_recommendations: recommendations.length,
        priority_breakdown: priorityBreakdown,
        category_breakdown: categoryBreakdown,
        average_confidence: averageConfidence,
        implementation_status: implementationStatus,
        total_potential_impact: totalPotentialImpact,
        high_priority_count: priorityBreakdown.high + priorityBreakdown.critical || 0
      }
    } catch (error) {
      console.error('Error getting recommendation insights:', error)
      throw error
    }
  }

  /**
   * Get trending topics and content opportunities
   */
  async getTrendingOpportunities(
    periodStart: string,
    periodEnd: string,
    platform?: string
  ): Promise<any[]> {
    try {
      // This would typically integrate with external APIs or more complex analysis
      // For now, we'll provide a simplified implementation based on existing data

      const { data, error } = await supabase
        .from('ugc_content')
        .select('hashtags, caption, likes_count, comments_count, platform, created_at')
        .gte('created_at', periodStart)
        .lte('created_at', periodEnd)
        .order('likes_count', { ascending: false })
        .limit(100)

      if (error) throw error

      // Analyze trending hashtags
      const hashtagTrends = data?.reduce((acc, content) => {
        if (platform && content.platform !== platform) return acc

        interface UGCContentRow {
          hashtags: string[] | null
          caption?: string | null
          likes_count?: number | null
          comments_count?: number | null
          platform?: string | null
          created_at?: string | null
        }

        interface HashtagTrend {
          hashtag: string
          total_engagement: number
          content_count: number
          recent_growth: number
        }

        const row = content as UGCContentRow
        if (Array.isArray(row.hashtags)) {
          const trends = acc as Record<string, HashtagTrend>

          row.hashtags.forEach((hashtag: string) => {
            if (!trends[hashtag]) {
              trends[hashtag] = {
                hashtag,
                total_engagement: 0,
                content_count: 0,
                recent_growth: 0
              }
            }

            const likes = typeof row.likes_count === 'number' ? row.likes_count : 0
            const comments = typeof row.comments_count === 'number' ? row.comments_count : 0

            trends[hashtag].total_engagement += likes + comments
            trends[hashtag].content_count += 1
          })
        }
        return acc
      }, {} as Record<string, any>)

      // Convert to array and calculate trends
      const opportunities = Object.values(hashtagTrends || {})
        .map((trend: any) => ({
          ...trend,
          average_engagement: trend.total_engagement / trend.content_count,
          trend_score: (trend.total_engagement * trend.content_count) / 1000
        }))
        .sort((a, b) => b.trend_score - a.trend_score)
        .slice(0, 10)

      return opportunities
    } catch (error) {
      console.error('Error getting trending opportunities:', error)
      return []
    }
  }

  /**
   * Export recommendations for external use
   */
  async exportRecommendations(
    reportId: string,
    format: 'json' | 'csv' = 'json'
  ): Promise<any> {
    try {
      const recommendations = await this.getRecommendations(reportId)

      if (format === 'csv') {
        const headers = [
          'Category', 'Title', 'Description', 'Priority Level',
          'Estimated Impact', 'Confidence Score', 'Status', 'Actionable Steps'
        ]

        const csvData = recommendations.map(rec => [
          rec.category,
          rec.title,
          rec.description,
          rec.priority_level,
          rec.estimated_impact,
          rec.confidence_score,
          rec.status,
          rec.actionable_steps.join('; ')
        ])

        return [headers, ...csvData]
      }

      return recommendations
    } catch (error) {
      console.error('Error exporting recommendations:', error)
      throw error
    }
  }
}

export const aiRecommendationsService = new AIRecommendationsService()