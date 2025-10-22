import { ReportTemplate } from '@/types'

/**
 * Mock Template Management Service
 * Provides mock templates for report generation without database dependency
 */
export class MockTemplateManagementService {
  private mockTemplates: ReportTemplate[] = [
    {
      id: 'template-weekly-performance',
      name: 'Weekly Performance Report',
      description: 'Comprehensive weekly analysis of content performance, engagement metrics, and AI-powered recommendations.',
      is_default: true,
      is_active: true,
      template_type: 'weekly',
      layout_config: {
        sections: [
          { id: 'overview', title: 'Executive Summary', order: 1, visible: true },
          { id: 'metrics', title: 'Performance Metrics', order: 2, visible: true },
          { id: 'recommendations', title: 'AI Recommendations', order: 3, visible: true }
        ]
      },
      sections: [
        {
          id: 'overview',
          title: 'Executive Summary',
          order: 1,
          visible: true
        },
        {
          id: 'metrics',
          title: 'Performance Metrics',
          order: 2,
          visible: true
        },
        {
          id: 'recommendations',
          title: 'AI Recommendations',
          order: 3,
          visible: true
        }
      ],
      styling: {
        theme: 'professional',
        color_scheme: 'default',
        fonts: {
          heading: 'geist',
          body: 'geist'
        },
        spacing: 'comfortable',
        animations: 'subtle'
      },
      included_metrics: [
        'total_content',
        'average_engagement_rate',
        'top_hashtags',
        'platform_comparison',
        'ai_insights'
      ],
      chart_configurations: {
        line_chart: {
          enabled: true,
          smooth: true,
          animations: true
        },
        bar_chart: {
          enabled: true,
          animations: true
        }
      },
      filters: {
        date_range: true,
        content_types: true,
        platforms: true
      },
      ai_recommendations_enabled: true,
      recommendation_categories: [
        'content_strategy',
        'engagement_optimization',
        'hashtag_strategy',
        'timing_strategy'
      ],
      ai_confidence_threshold: 0.7,
      pdf_format_settings: {
        page_size: 'a4',
        margins: 'normal',
        include_header: true,
        include_page_numbers: true,
        color_mode: 'color'
      },
      export_formats: ['pdf', 'json'],
      created_by: 'system',
      version: 1.0,
      created_at: new Date('2024-01-01T00:00:00.000Z').toISOString(),
      updated_at: new Date('2024-01-01T00:00:00.000Z').toISOString()
    },
    {
      id: 'template-monthly-analytics',
      name: 'Monthly Analytics Report',
      description: 'Deep-dive monthly analysis with comprehensive metrics, trend analysis, and strategic insights for long-term growth.',
      is_default: false,
      is_active: true,
      template_type: 'monthly',
      layout_config: {
        sections: [
          { id: 'executive_summary', title: 'Executive Summary', order: 1, visible: true },
          { id: 'monthly_trends', title: 'Monthly Trends', order: 2, visible: true },
          { id: 'platform_performance', title: 'Platform Performance', order: 3, visible: true },
          { id: 'content_analysis', title: 'Content Analysis', order: 4, visible: true },
          { id: 'ai_insights', title: 'AI Insights', order: 5, visible: true }
        ]
      },
      sections: [
        {
          id: 'executive_summary',
          title: 'Executive Summary',
          order: 1,
          visible: true
        },
        {
          id: 'monthly_trends',
          title: 'Monthly Trends',
          order: 2,
          visible: true
        },
        {
          id: 'platform_performance',
          title: 'Platform Performance',
          order: 3,
          visible: true
        },
        {
          id: 'content_analysis',
          title: 'Content Analysis',
          order: 4,
          visible: true
        },
        {
          id: 'ai_insights',
          title: 'AI Insights',
          order: 5,
          visible: true
        }
      ],
      styling: {
        theme: 'corporate',
        color_scheme: 'default',
        fonts: {
          heading: 'geist',
          body: 'geist'
        },
        spacing: 'compact',
        animations: 'smooth'
      },
      included_metrics: [
        'total_content',
        'average_engagement_rate',
        'monthly_growth',
        'top_performers',
        'conversion_trends',
        'audience_insights'
      ],
      chart_configurations: {
        line_chart: {
          enabled: true,
          smooth: true,
          animations: true
        },
        area_chart: {
          enabled: true,
          animations: true
        },
        bar_chart: {
          enabled: true,
          animations: true
        }
      },
      filters: {
        date_range: true,
        content_types: true,
        platforms: true,
        hashtags: true
      },
      ai_recommendations_enabled: true,
      recommendation_categories: [
        'content_strategy',
        'engagement_optimization',
        'hashtag_strategy',
        'timing_strategy',
        'creator_development',
        'trending_topics',
        'platform_optimization'
      ],
      ai_confidence_threshold: 0.8,
      pdf_format_settings: {
        page_size: 'a4',
        margins: 'normal',
        include_header: true,
        include_page_numbers: true,
        color_mode: 'color'
      },
      export_formats: ['pdf', 'json', 'csv'],
      created_by: 'system',
      version: 1.0,
      created_at: new Date('2024-01-01T00:00:00.000Z').toISOString(),
      updated_at: new Date('2024-01-01T00:00:00.000Z').toISOString()
    }
  ]

  /**
   * Get all active report templates
   */
  async getTemplates(): Promise<ReportTemplate[]> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 200))
      return this.mockTemplates.filter(template => template.is_active)
    } catch (error) {
      console.error('Error fetching templates:', error)
      throw error
    }
  }

  /**
   * Get templates by type
   */
  async getTemplatesByType(type: 'weekly' | 'monthly' | 'custom'): Promise<ReportTemplate[]> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 200))
      return this.mockTemplates.filter(template => template.template_type === type && template.is_active)
    } catch (error) {
      console.error('Error fetching templates by type:', error)
      throw error
    }
  }

  /**
   * Get a specific template by ID
   */
  async getTemplate(id: string): Promise<ReportTemplate | null> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 200))
      return this.mockTemplates.find(template => template.id === id) || null
    } catch (error) {
      console.error('Error fetching template:', error)
      throw error
    }
  }

  /**
   * Create a new template
   */
  async createTemplate(template: Omit<ReportTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<ReportTemplate> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))

      const newTemplate: ReportTemplate = {
        ...template,
        id: `template_${Date.now().toString(36)}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        version: 1.0
      }

      this.mockTemplates.unshift(newTemplate)
      return newTemplate
    } catch (error) {
      console.error('Error creating template:', error)
      throw error
    }
  }

  /**
   * Update an existing template
   */
  async updateTemplate(id: string, updates: Partial<ReportTemplate>): Promise<ReportTemplate> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))

      const index = this.mockTemplates.findIndex(t => t.id === id)
      if (index === -1) {
        throw new Error('Template not found')
      }

      this.mockTemplates[index] = {
        ...this.mockTemplates[index],
        ...updates,
        updated_at: new Date().toISOString()
      }

      return this.mockTemplates[index]
    } catch (error) {
      console.error('Error updating template:', error)
      throw error
    }
  }

  /**
   * Delete a template
   */
  async deleteTemplate(id: string): Promise<void> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300))

      const index = this.mockTemplates.findIndex(t => t.id === id)
      if (index === -1) {
        throw new Error('Template not found')
      }

      this.mockTemplates.splice(index, 1)
    } catch (error) {
      console.error('Error deleting template:', error)
      throw error
    }
  }
}

export const mockTemplateManagementService = new MockTemplateManagementService()