import { supabase } from '@/lib/supabase'
import { ReportTemplate } from '@/types'

/**
 * Template Management Service
 * Handles CRUD operations for report templates
 */

export class TemplateManagementService {
  /**
   * Get all active report templates
   */
  async getTemplates(): Promise<ReportTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('report_templates')
        .select('*')
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .order('name', { ascending: true })

      if (error) throw error
      return data || []
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
      const { data, error } = await supabase
        .from('report_templates')
        .select('*')
        .eq('template_type', type)
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .order('name', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching templates by type:', error)
      throw error
    }
  }

  /**
   * Get default template for a type
   */
  async getDefaultTemplate(type: 'weekly' | 'monthly' | 'custom'): Promise<ReportTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('report_templates')
        .select('*')
        .eq('template_type', type)
        .eq('is_default', true)
        .eq('is_active', true)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null // Not found
        throw error
      }

      return data
    } catch (error) {
      console.error('Error fetching default template:', error)
      throw error
    }
  }

  /**
   * Get a single template by ID
   */
  async getTemplate(id: string): Promise<ReportTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('report_templates')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null // Not found
        throw error
      }

      return data
    } catch (error) {
      console.error('Error fetching template:', error)
      throw error
    }
  }

  /**
   * Create a new template
   */
  async createTemplate(template: Omit<ReportTemplate, 'id' | 'created_at' | 'updated_at' | 'version'>): Promise<ReportTemplate> {
    try {
      const { data, error } = await supabase
        .from('report_templates')
        .insert({
          ...template,
          version: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data
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
      // Get current template to increment version
      const currentTemplate = await this.getTemplate(id)
      if (!currentTemplate) {
        throw new Error('Template not found')
      }

      const { data, error } = await supabase
        .from('report_templates')
        .update({
          ...updates,
          version: currentTemplate.version + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating template:', error)
      throw error
    }
  }

  /**
   * Set a template as default for its type
   */
  async setAsDefault(id: string): Promise<void> {
    try {
      const template = await this.getTemplate(id)
      if (!template) {
        throw new Error('Template not found')
      }

      // First, unset current default for this type
      await supabase
        .from('report_templates')
        .update({ is_default: false })
        .eq('template_type', template.template_type)
        .eq('is_default', true)

      // Then set new default
      const { error } = await supabase
        .from('report_templates')
        .update({ is_default: true })
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Error setting template as default:', error)
      throw error
    }
  }

  /**
   * Deactivate a template
   */
  async deactivateTemplate(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('report_templates')
        .update({ is_active: false })
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Error deactivating template:', error)
      throw error
    }
  }

  /**
   * Delete a template (only if not used by reports)
   */
  async deleteTemplate(id: string): Promise<void> {
    try {
      // Check if template is being used by any reports
      const { data: reports, error: checkError } = await supabase
        .from('weekly_reports')
        .select('id')
        .eq('template_id', id)
        .limit(1)

      if (checkError) throw checkError

      if (reports && reports.length > 0) {
        throw new Error('Cannot delete template that is being used by reports')
      }

      // Delete the template
      const { error } = await supabase
        .from('report_templates')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting template:', error)
      throw error
    }
  }

  /**
   * Duplicate a template
   */
  async duplicateTemplate(id: string, newName: string): Promise<ReportTemplate> {
    try {
      const originalTemplate = await this.getTemplate(id)
      if (!originalTemplate) {
        throw new Error('Template not found')
      }

      const duplicatedTemplate = {
        ...originalTemplate,
        name: newName,
        is_default: false,
        // Remove fields that should be reset
        id: undefined,
        created_at: undefined,
        updated_at: undefined,
        version: undefined,
        created_by: undefined
      }

      return await this.createTemplate(duplicatedTemplate)
    } catch (error) {
      console.error('Error duplicating template:', error)
      throw error
    }
  }

  /**
   * Get template usage statistics
   */
  async getTemplateUsageStats(id: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('weekly_reports')
        .select('id, status, generated_at')
        .eq('template_id', id)
        .order('generated_at', { ascending: false })

      if (error) throw error

      const totalReports = data?.length || 0
      const completedReports = data?.filter(r => r.status === 'completed').length || 0
      const failedReports = data?.filter(r => r.status === 'failed').length || 0

      // Get recent usage (last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const recentReports = data?.filter(r =>
        new Date(r.generated_at) >= thirtyDaysAgo
      ).length || 0

      return {
        total_reports: totalReports,
        completed_reports: completedReports,
        failed_reports: failedReports,
        success_rate: totalReports > 0 ? (completedReports / totalReports) * 100 : 0,
        recent_usage: recentReports,
        last_used: data && data.length > 0 ? data[0].generated_at : null
      }
    } catch (error) {
      console.error('Error fetching template usage stats:', error)
      throw error
    }
  }

  /**
   * Validate template configuration
   */
  validateTemplate(template: Partial<ReportTemplate>): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!template.name || template.name.trim().length === 0) {
      errors.push('Template name is required')
    }

    if (!template.template_type || !['weekly', 'monthly', 'custom'].includes(template.template_type)) {
      errors.push('Valid template type is required')
    }

    if (!template.sections || !Array.isArray(template.sections) || template.sections.length === 0) {
      errors.push('At least one section is required')
    }

    if (template.sections) {
      const hasInvalidSections = template.sections.some(section =>
        !section.id || !section.title || typeof section.order !== 'number'
      )
      if (hasInvalidSections) {
        errors.push('All sections must have valid id, title, and order')
      }
    }

    if (!template.included_metrics || !Array.isArray(template.included_metrics) || template.included_metrics.length === 0) {
      errors.push('At least one metric must be included')
    }

    if (template.ai_confidence_threshold !== undefined &&
        (template.ai_confidence_threshold < 0 || template.ai_confidence_threshold > 1)) {
      errors.push('AI confidence threshold must be between 0 and 1')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Get predefined template options for different use cases
   */
  getPredefinedTemplates(): Array<{
    name: string
    description: string
    type: 'weekly' | 'monthly' | 'custom'
    config: Partial<ReportTemplate>
  }> {
    return [
      {
        name: 'Basic Weekly Report',
        description: 'Simple weekly overview with essential metrics',
        type: 'weekly',
        config: {
          sections: [
            { id: 'summary', title: 'Summary', order: 1, visible: true },
            { id: 'metrics', title: 'Key Metrics', order: 2, visible: true },
            { id: 'top_content', title: 'Top Performing Content', order: 3, visible: true }
          ],
          included_metrics: ['content_performance', 'engagement_rates'],
          ai_recommendations_enabled: true,
          recommendation_categories: ['content_strategy', 'engagement_optimization']
        }
      },
      {
        name: 'Comprehensive Monthly Report',
        description: 'Detailed monthly analysis with trends and insights',
        type: 'monthly',
        config: {
          sections: [
            { id: 'executive_summary', title: 'Executive Summary', order: 1, visible: true },
            { id: 'performance_trends', title: 'Performance Trends', order: 2, visible: true },
            { id: 'hashtag_analysis', title: 'Hashtag Analysis', order: 3, visible: true },
            { id: 'creator_insights', title: 'Creator Insights', order: 4, visible: true },
            { id: 'recommendations', title: 'Strategic Recommendations', order: 5, visible: true }
          ],
          included_metrics: [
            'content_performance', 'engagement_rates', 'hashtag_analysis',
            'timing_analysis', 'creator_performance'
          ],
          ai_recommendations_enabled: true,
          recommendation_categories: [
            'content_strategy', 'engagement_optimization', 'hashtag_strategy',
            'timing_strategy', 'creator_development'
          ]
        }
      },
      {
        name: 'Performance-Only Report',
        description: 'Focus on metrics and analytics, no AI recommendations',
        type: 'weekly',
        config: {
          sections: [
            { id: 'metrics', title: 'Performance Metrics', order: 1, visible: true },
            { id: 'charts', title: 'Visual Analytics', order: 2, visible: true },
            { id: 'data_table', title: 'Detailed Data', order: 3, visible: true }
          ],
          included_metrics: ['content_performance', 'engagement_rates', 'timing_analysis'],
          ai_recommendations_enabled: false
        }
      }
    ]
  }
}

export const templateManagementService = new TemplateManagementService()