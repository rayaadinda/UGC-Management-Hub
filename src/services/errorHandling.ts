/**
 * Progress Tracking System
 * Handles real-time progress updates and step-by-step feedback
 */

export interface ProgressUpdate {
  step: string
  percentage: number
  current?: number
  total?: number
  message?: string
  details?: any
  duration?: number
  estTimeRemaining?: number
  lastUpdated?: Date
}

export class ProgressTracker {
  private updates: ProgressUpdate[] = []
  private startTime: number = Date.now()
  private currentStep: string = ''
  private currentPercentage = 0
  private currentTotal: number = 0
  private lastUpdate = Date.now()

  /**
   * Track progress updates
   */
  updateProgress(update: ProgressUpdate): void {
    const now = Date.now()
    this.lastUpdate = now

    // Calculate time-based progress for ongoing operations
    const timeElapsed = (now - this.startTime) / 1000 // ms to seconds
    const estTimeRemaining = this.calculateEstTimeRemaining(timeElapsed, update.percentage)

    this.currentStep = update.step
    this.currentPercentage = Math.min(100, Math.round(update.percentage))
    this.currentTotal = update.total || 0
    this.lastUpdate = now

    // Add to updates array
    this.updates.push({
      ...update,
      duration: timeElapsed,
      estTimeRemaining
    })

    // Keep only recent updates (last 50 entries)
    if (this.updates.length > 50) {
      this.updates = this.updates.slice(-50)
    }
  }

  /**
   * Get progress statistics
   */
  getProgress(): ProgressUpdate | null {
    if (this.updates.length === 0) {
      return null
    }

    const latest = this.updates[this.updates.length - 1]
    return {
      step: latest.step,
      percentage: latest.percentage,
      current: latest.current,
      total: latest.total,
      duration: latest.duration || 0,
      estTimeRemaining: latest.estTimeRemaining || 0,
      lastUpdated: new Date()
    }
  }

  /**
   * Reset tracker for new operation
   */
  reset(): void {
    this.startTime = Date.now()
    this.currentStep = ''
    this.currentPercentage = 0
    this.currentTotal = 0
    this.lastUpdate = Date.now()
    this.updates = []
  }

  /**
   * Get current progress status
   */
  getStatus() {
    if (this.updates.length === 0) return null

    const latest = this.getProgress()
    const isCompleted = (latest?.percentage ?? 0) >= 100

    return {
      step: latest?.step,
      percentage: latest?.percentage,
      current: latest?.current,
      total: latest?.total,
      duration: latest?.duration || 0,
      estTimeRemaining: latest?.estTimeRemaining || 0,
      lastUpdated: latest?.lastUpdated,
      isCompleted
    }
  }

  /**
   * Calculate estimated time remaining
   */
  private calculateEstTimeRemaining(elapsedSeconds: number, currentPercentage: number): number {
    if (currentPercentage === 0) return 0
    const totalDuration = (elapsedSeconds / currentPercentage) * 100
    return Math.max(0, totalDuration - elapsedSeconds)
  }
}