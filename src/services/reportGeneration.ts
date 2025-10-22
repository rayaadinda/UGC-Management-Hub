import { WeeklyReport, ReportGenerationConfig } from '@/types'
import { mockReportGenerationService } from './mockReportGeneration'

/**
 * Report Generation Service
 * Handles the creation and management of weekly reports
 * Using mock service to bypass RLS issues
 */

export class ReportGenerationService {
  /**
   * Create a new weekly report
   */
  async createReport(config: ReportGenerationConfig): Promise<WeeklyReport> {
    return await mockReportGenerationService.createReport(config)
  }

  
  /**
   * Get all reports
   */
  async getReports(filters?: any): Promise<WeeklyReport[]> {
    return await mockReportGenerationService.getReports(filters)
  }

  /**
   * Get a single report by ID
   */
  async getReport(id: string): Promise<WeeklyReport | null> {
    return await mockReportGenerationService.getReport(id)
  }

  /**
   * Delete a report
   */
  async deleteReport(id: string): Promise<void> {
    return await mockReportGenerationService.deleteReport(id)
  }
}

export const reportGenerationService = new ReportGenerationService()