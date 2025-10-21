export interface UGCContent {
  id: string
  platform: 'instagram' | 'tiktok'
  author_username: string
  content_url: string
  media_type: 'image' | 'video'
  media_url: string
  thumbnail_url?: string
  caption: string
  likes_count: number
  comments_count: number
  hashtags: string[]
  status: 'new' | 'approved_for_repost' | 'weekly_winner' | 'rejected'
  created_at: string
  updated_at: string
}

export interface UGCContentFilters {
  status?: UGCContent['status'] | 'all'
  platform?: UGCContent['platform'] | 'all'
  search?: string
}

export type ContentStatus = UGCContent['status']

export interface TDRApplication {
  id: string
  created_at: string
  full_name: string
  email: string
  phone: string
  instagram_handle: string
  tiktok_username: string
  follower_count: string
  content_focus: string
  why_partner: string
  owns_motorcycle: string
  racing_experience: string
  motorcycle_knowledge: string
  portfolio_url: string
  portfolio_filename: string
  status: 'pending' | 'approved' | 'rejected'
  notes?: string
}

export interface TDRApplicationFilters {
  status?: TDRApplication['status'] | 'all'
  search?: string
  owns_motorcycle?: string | 'all'
  racing_experience?: string | 'all'
}

export type ApplicationStatus = TDRApplication['status']

// Reporting System Types
export interface WeeklyReport {
  id: string
  title: string
  description?: string
  report_period_start: string
  report_period_end: string
  status: 'draft' | 'generating' | 'completed' | 'failed'
  generated_at: string
  generated_by?: string
  template_id?: string
  file_url?: string
  metrics_summary: Record<string, any>
  ai_recommendations: AIRecommendation[]
  created_at: string
  updated_at: string
}

export interface ContentPerformanceMetrics {
  id: string
  content_id: string
  report_id: string
  total_likes: number
  total_comments: number
  total_shares: number
  reach_estimate: number
  engagement_rate: number
  performance_score: number
  viral_coefficient: number
  top_hashtags: string[]
  hashtag_effectiveness_score: number
  peak_engagement_hour: number
  engagement_velocity: number
  media_quality_score: number
  caption_sentiment: 'positive' | 'neutral' | 'negative'
  calculated_at: string
  period_start: string
  period_end: string
  created_at: string
  updated_at: string
}

export interface AIRecommendation {
  id: string
  report_id: string
  category: 'content_strategy' | 'engagement_optimization' | 'hashtag_strategy' | 'timing_strategy' | 'creator_development' | 'trending_topics' | 'platform_optimization'
  title: string
  description: string
  actionable_steps: string[]
  priority_level: 'low' | 'medium' | 'high' | 'critical'
  estimated_impact: number
  confidence_score: number
  supporting_data: Record<string, any>
  status: 'pending' | 'in_progress' | 'implemented' | 'dismissed'
  implementation_notes?: string
  created_at: string
  updated_at: string
  expires_at: string
}

export interface ReportTemplate {
  id: string
  name: string
  description?: string
  is_default: boolean
  is_active: boolean
  template_type: 'weekly' | 'monthly' | 'custom'
  layout_config: Record<string, any>
  sections: ReportSection[]
  styling: Record<string, any>
  included_metrics: string[]
  chart_configurations: Record<string, any>
  filters: Record<string, any>
  ai_recommendations_enabled: boolean
  recommendation_categories: string[]
  ai_confidence_threshold: number
  pdf_format_settings: Record<string, any>
  export_formats: string[]
  created_by?: string
  version: number
  created_at: string
  updated_at: string
}

export interface ReportSection {
  id: string
  title: string
  order: number
  visible: boolean
}

// Report Generation Types
export interface ReportGenerationConfig {
  template_id?: string
  period_start: string
  period_end: string
  title?: string
  description?: string
  include_ai_recommendations: boolean
  export_formats: string[]
}

export interface PerformanceMetricsSummary {
  total_content: number
  average_engagement_rate: number
  top_performing_content: ContentPerformanceMetrics[]
  hashtag_performance: Array<{
    hashtag: string
    usage_count: number
    avg_engagement_rate: number
  }>
  platform_comparison: Array<{
    platform: string
    content_count: number
    avg_performance: number
  }>
  time_based_insights: {
    best_posting_times: number[]
    peak_engagement_days: string[]
  }
}

// Filter Types
export interface WeeklyReportFilters {
  status?: WeeklyReport['status'] | 'all'
  template_id?: string | 'all'
  date_range?: {
    start: string
    end: string
  }
  search?: string
}

export interface ContentMetricsFilters {
  period_start?: string
  period_end?: string
  content_id?: string
  min_performance_score?: number
  category?: string
}