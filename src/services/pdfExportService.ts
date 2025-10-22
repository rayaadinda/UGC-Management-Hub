import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { WeeklyReport, PerformanceMetricsSummary } from '@/types'
import { format } from 'date-fns'

/**
 * PDF Export Service
 * Generates actual PDF files for reports using mock data
 */
export class PDFExportService {
  /**
   * Helper method to trigger file download
   */
  private triggerDownload(blob: Blob, fileName: string): void {
    try {
      // Validate blob
      if (!blob || blob.size === 0) {
        throw new Error('Invalid or empty blob')
      }

      console.log('Starting download for:', fileName, 'Size:', blob.size, 'bytes')

      // Create download URL
      const url = URL.createObjectURL(blob)

      // Create download link
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      link.style.display = 'none'

      // Add to body and trigger download
      document.body.appendChild(link)

      // Multiple methods to ensure download works
      try {
        link.click()
      } catch (e) {
        console.warn('Click method failed, trying event dispatch')
        const event = new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: true
        })
        link.dispatchEvent(event)
      }

      // Clean up
      setTimeout(() => {
        try {
          document.body.removeChild(link)
        } catch (e) {
          console.warn('Could not remove link from DOM')
        }
        URL.revokeObjectURL(url)
        console.log('Cleanup completed')
      }, 100)

      console.log('Download triggered successfully for:', fileName)

    } catch (error) {
      console.error('Error in download process:', error)

      // Ultimate fallback: try to open in new tab
      try {
        const fallbackUrl = URL.createObjectURL(blob)
        const newWindow = window.open(fallbackUrl, '_blank')
        if (!newWindow) {
          // If popup blocked, try direct navigation
          window.location.href = fallbackUrl
        }
        setTimeout(() => URL.revokeObjectURL(fallbackUrl), 5000)
      } catch (fallbackError) {
        console.error('All download methods failed:', fallbackError)
        throw error
      }
    }
  }
  /**
   * Generate a complete PDF report
   */
  async generateReportPDF(report: WeeklyReport): Promise<void> {
    console.log('Starting PDF generation for report:', report.title)
    console.log('Report data:', report)

    try {
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()

    let yPosition = 20
    const lineHeight = 7
    const sectionMargin = 15

    // Helper function to add new page if needed
    const checkPageBreak = (requiredHeight: number) => {
      if (yPosition + requiredHeight > pageHeight - 20) {
        pdf.addPage()
        yPosition = 20
      }
    }

    // Helper function to add text with word wrap
    const addText = (text: string, fontSize: number = 12, isBold: boolean = false) => {
      pdf.setFontSize(fontSize)
      pdf.setFont('helvetica', isBold ? 'bold' : 'normal')

      const lines = pdf.splitTextToSize(text, pageWidth - 40)
      lines.forEach((line: string) => {
        checkPageBreak(lineHeight)
        pdf.text(line, 20, yPosition)
        yPosition += lineHeight
      })
      return yPosition
    }

    // Title Page
    pdf.setFontSize(24)
    pdf.setFont('helvetica', 'bold')
    pdf.text(report.title, pageWidth / 2, 40, { align: 'center' })

    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'normal')
    pdf.text('Generated on ' + format(new Date(report.generated_at), 'MMMM dd, yyyy'), pageWidth / 2, 50, { align: 'center' })

    yPosition = 70

    // Report Period
    addText('Report Period', 16, true)
    addText(`${format(new Date(report.report_period_start), 'MMMM dd, yyyy')} - ${format(new Date(report.report_period_end), 'MMMM dd, yyyy')}`)
    yPosition += sectionMargin

    // Executive Summary
    if (report.description) {
      checkPageBreak(lineHeight * 3)
      addText('Executive Summary', 16, true)
      addText(report.description)
      yPosition += sectionMargin
    }

    // Key Metrics
    checkPageBreak(lineHeight * 5)
    addText('Key Performance Metrics', 16, true)
    yPosition += 5

    const metrics = report.metrics_summary
    if (metrics) {
      // Create metrics table
      const metricsData = [
        ['Metric', 'Value'],
        ['Total Content Analyzed', metrics.total_content?.toString() || '0'],
        ['Average Engagement Rate', `${metrics.average_engagement_rate?.toFixed(2) || '0.00'}%`],
        ['Top Hashtag', metrics.hashtag_performance?.[0]?.hashtag || 'N/A'],
        ['Top Hashtag Performance', `${metrics.hashtag_performance?.[0]?.avg_engagement_rate?.toFixed(2) || '0.00'}%`],
      ]

      // Add table headers
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(12)
      pdf.text(metricsData[0][0], 20, yPosition)
      pdf.text(metricsData[0][1], 80, yPosition)
      yPosition += lineHeight

      // Add table rows
      pdf.setFont('helvetica', 'normal')
      for (let i = 1; i < metricsData.length; i++) {
        checkPageBreak(lineHeight)
        pdf.text(metricsData[i][0], 20, yPosition)
        pdf.text(metricsData[i][1], 80, yPosition)
        yPosition += lineHeight
      }
    }

    yPosition += sectionMargin

    // Platform Performance
    checkPageBreak(lineHeight * 6)
    addText('Platform Performance', 16, true)
    yPosition += 5

    if (metrics?.platform_comparison) {
      metrics.platform_comparison.forEach((platform: PerformanceMetricsSummary['platform_comparison'][0]) => {
        checkPageBreak(lineHeight * 2)
        addText(`${platform.platform.toUpperCase()}:`, 12, true)
        addText(`  Content Count: ${platform.content_count}`)
        addText(`  Average Performance: ${platform.avg_performance.toFixed(2)}`)
        yPosition += 5
      })
    }

    yPosition += sectionMargin

    // Timing Insights
    checkPageBreak(lineHeight * 5)
    addText('Optimal Posting Times', 16, true)
    yPosition += 5

    if (metrics?.time_based_insights) {
      const insights = metrics.time_based_insights
      if (insights.best_posting_times && insights.best_posting_times.length > 0) {
        addText(`Best Hours: ${insights.best_posting_times.map((h: number) => `${h}:00`).join(', ')}`)
      }
      if (insights.peak_engagement_days && insights.peak_engagement_days.length > 0) {
        addText(`Peak Days: ${insights.peak_engagement_days.join(', ')}`)
      }
    }

    yPosition += sectionMargin

    // AI Recommendations (New page if needed)
    if (report.ai_recommendations && report.ai_recommendations.length > 0) {
      checkPageBreak(lineHeight * 8)
      addText('AI-Powered Recommendations', 16, true)
      yPosition += 5

      report.ai_recommendations.forEach((recommendation, index) => {
        checkPageBreak(lineHeight * 10)

        addText(`${index + 1}. ${recommendation.title}`, 14, true)
        addText(`Category: ${recommendation.category.replace('_', ' ').toUpperCase()}`)
        addText(`Priority: ${recommendation.priority_level.toUpperCase()}`)
        addText(`Confidence: ${(recommendation.confidence_score * 100).toFixed(0)}%`)
        addText(`Estimated Impact: ${(recommendation.estimated_impact * 100).toFixed(0)}%`)

        yPosition += 3
        addText('Description:', 12, true)
        addText(recommendation.description)

        yPosition += 3
        addText('Actionable Steps:', 12, true)
        recommendation.actionable_steps.forEach((step) => {
          addText(`• ${step}`)
        })

        yPosition += 8
      })
    }

    // Footer
    const totalPages = pdf.internal.pages.length
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i)
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`Page ${i} of ${totalPages}`, pageWidth - 30, pageHeight - 10, { align: 'right' })
      pdf.text('Generated by UGC Management Hub', 20, pageHeight - 10)
    }

    // Save the PDF
    const fileName = `${report.title.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`

    // Create blob and download
    const pdfBlob = pdf.output('blob')
    console.log('PDF blob created, size:', pdfBlob.size, 'type:', pdfBlob.type)

    if (pdfBlob.size === 0) {
      throw new Error('Generated PDF blob is empty')
    }

    this.triggerDownload(pdfBlob, fileName)

    console.log('PDF downloaded successfully:', fileName)
    } catch (error) {
      console.error('Error generating PDF:', error)
      throw error
    }
  }

  /**
   * Generate a summary PDF with charts (simplified version)
   */
  async generateSummaryPDF(report: WeeklyReport): Promise<void> {
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()

    let yPosition = 20

    // Title
    pdf.setFontSize(20)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Performance Summary', pageWidth / 2, 30, { align: 'center' })

    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'normal')
    pdf.text(report.title, pageWidth / 2, 40, { align: 'center' })

    yPosition = 60

    // Quick Stats
    const metrics = report.metrics_summary
    if (metrics) {
      const stats = [
        `Total Content: ${metrics.total_content || 0}`,
        `Avg Engagement: ${(metrics.average_engagement_rate || 0).toFixed(1)}%`,
        `Top Hashtag: ${metrics.hashtag_performance?.[0]?.hashtag || 'N/A'}`,
        `AI Recommendations: ${report.ai_recommendations?.length || 0}`
      ]

      pdf.setFontSize(12)
      stats.forEach((stat) => {
        pdf.text(stat, pageWidth / 2, yPosition, { align: 'center' })
        yPosition += 15
      })
    }

    // Top Recommendations
    if (report.ai_recommendations && report.ai_recommendations.length > 0) {
      yPosition += 20
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Top Recommendations:', 20, yPosition)

      yPosition += 15
      pdf.setFont('helvetica', 'normal')

      report.ai_recommendations.slice(0, 3).forEach((rec, index) => {
        if (yPosition > 250) {
          pdf.addPage()
          yPosition = 20
        }

        pdf.setFontSize(12)
        pdf.setFont('helvetica', 'bold')
        pdf.text(`${index + 1}. ${rec.title}`, 25, yPosition)

        yPosition += 8
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(10)

        const description = pdf.splitTextToSize(rec.description, pageWidth - 50)
        description.forEach((line: string) => {
          pdf.text(line, 25, yPosition)
          yPosition += 6
        })

        yPosition += 10
      })
    }

    // Footer
    pdf.setFontSize(10)
    pdf.text(`Generated on ${format(new Date(), 'MMMM dd, yyyy')}`, pageWidth / 2, pdf.internal.pageSize.getHeight() - 20, { align: 'center' })

    // Save the PDF
    const fileName = `Summary_${report.title.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`

    // Create blob and download
    const pdfBlob = pdf.output('blob')
    this.triggerDownload(pdfBlob, fileName)

    console.log('Summary PDF downloaded successfully:', fileName)
  }

  /**
   * Export report data as CSV
   */
  async exportToCSV(report: WeeklyReport): Promise<void> {
    const metrics = report.metrics_summary
    if (!metrics) return

    let csvContent = 'data:text/csv;charset=utf-8,'

    // Header
    csvContent += 'Report Details\n'
    csvContent += `Title,${report.title}\n`
    csvContent += `Period,${format(new Date(report.report_period_start), 'yyyy-MM-dd')} to ${format(new Date(report.report_period_end), 'yyyy-MM-dd')}\n`
    csvContent += `Generated,${format(new Date(report.generated_at), 'yyyy-MM-dd HH:mm:ss')}\n\n`

    // Metrics
    csvContent += 'Metrics\n'
    csvContent += 'Total Content,' + (metrics.total_content || 0) + '\n'
    csvContent += 'Average Engagement Rate,' + (metrics.average_engagement_rate || 0).toFixed(2) + '\n\n'

    // Hashtag Performance
    if (metrics.hashtag_performance && metrics.hashtag_performance.length > 0) {
      csvContent += 'Hashtag Performance\n'
      csvContent += 'Hashtag,Usage Count,Avg Engagement Rate\n'
      metrics.hashtag_performance.forEach((hashtag: PerformanceMetricsSummary['hashtag_performance'][0]) => {
        csvContent += `"${hashtag.hashtag}",${hashtag.usage_count},${hashtag.avg_engagement_rate.toFixed(2)}\n`
      })
      csvContent += '\n'
    }

    // Platform Comparison
    if (metrics.platform_comparison && metrics.platform_comparison.length > 0) {
      csvContent += 'Platform Comparison\n'
      csvContent += 'Platform,Content Count,Average Performance\n'
      metrics.platform_comparison.forEach((platform: PerformanceMetricsSummary['platform_comparison'][0]) => {
        csvContent += `${platform.platform},${platform.content_count},${platform.avg_performance.toFixed(2)}\n`
      })
      csvContent += '\n'
    }

    // AI Recommendations
    if (report.ai_recommendations && report.ai_recommendations.length > 0) {
      csvContent += 'AI Recommendations\n'
      csvContent += 'Title,Category,Priority,Confidence,Impact\n'
      report.ai_recommendations.forEach(rec => {
        csvContent += `"${rec.title}","${rec.category}","${rec.priority_level}",${(rec.confidence_score * 100).toFixed(0)}%,${(rec.estimated_impact * 100).toFixed(0)}%\n`
      })
    }

    // Create download link
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Report_${report.title.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  /**
   * Generate a visual PDF with charts (using HTML to Canvas)
   */
  async generateVisualPDF(elementId: string, report: WeeklyReport): Promise<void> {
    const element = document.getElementById(elementId)
    if (!element) {
      throw new Error('Element not found for PDF generation')
    }

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')

      const imgWidth = 210
      const pageHeight = 297
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      let position = 0

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      // Save the PDF
      const fileName = `Visual_Report_${report.title.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`

      // Create blob and download
      const pdfBlob = pdf.output('blob')
      this.triggerDownload(pdfBlob, fileName)

      console.log('Visual PDF downloaded successfully:', fileName)
    } catch (error) {
      console.error('Error generating visual PDF:', error)
      // Fallback to regular PDF if visual generation fails
      await this.generateReportPDF(report)
    }
  }
}

export const pdfExportService = new PDFExportService()