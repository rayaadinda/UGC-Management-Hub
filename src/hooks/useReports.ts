import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { reportGenerationService } from '@/services/reportGeneration'
import { WeeklyReport, WeeklyReportFilters, ReportGenerationConfig } from '@/types'

export function useReports(filters?: WeeklyReportFilters) {
  return useQuery({
    queryKey: ['reports', filters],
    queryFn: () => reportGenerationService.getReports(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useReport(id: string) {
  return useQuery({
    queryKey: ['report', id],
    queryFn: () => reportGenerationService.getReport(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

export function useGenerateReport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (config: ReportGenerationConfig) =>
      reportGenerationService.createReport(config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] })
    },
  })
}

export function useDeleteReport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => reportGenerationService.deleteReport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] })
    },
  })
}