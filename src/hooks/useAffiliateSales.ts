import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { affiliateSalesService } from '@/services/affiliateSales'
import { AffiliateSaleFilters, AffiliateSaleStatus } from '@/types'
import { supabase } from '@/lib/supabase'

export function useAffiliateSales(filters: AffiliateSaleFilters = {}) {
  const { data: brandAmbassadors } = useBrandAmbassadors()
  const brandAmbassadorNames = brandAmbassadors?.map(ba => ba.full_name) || []

  return useQuery({
    queryKey: ['affiliate-sales', filters, brandAmbassadorNames],
    queryFn: () => affiliateSalesService.getSales(filters, brandAmbassadorNames),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
  })
}

export function useAffiliateStats(filters: AffiliateSaleFilters = {}) {
  const { data: brandAmbassadors } = useBrandAmbassadors()
  const brandAmbassadorNames = brandAmbassadors?.map(ba => ba.full_name) || []

  return useQuery({
    queryKey: ['affiliate-stats', filters, brandAmbassadorNames],
    queryFn: () => affiliateSalesService.getStats(filters, brandAmbassadorNames),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 15 * 60 * 1000, // Refetch every 15 minutes
  })
}

export function useUpdateSaleStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: AffiliateSaleStatus }) => {
      return affiliateSalesService.updateSaleStatus(id, status)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliate-sales'] })
      queryClient.invalidateQueries({ queryKey: ['affiliate-stats'] })
    },
  })
}

export function useAffiliatePerformance(affiliateName: string) {
  return useQuery({
    queryKey: ['affiliate-performance', affiliateName],
    queryFn: () => affiliateSalesService.getAffiliatePerformance(affiliateName),
    enabled: !!affiliateName,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Utility hook for getting unique affiliate names
export function useAffiliateNames() {
  return useQuery({
    queryKey: ['affiliate-names'],
    queryFn: async () => {
      const sales = await affiliateSalesService.getSales()
      const uniqueNames = Array.from(new Set(sales.map(sale => sale.affiliate_name)))
      return uniqueNames.sort()
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  })
}

// Utility hook for getting unique product categories
export function useProductCategories() {
  const { data: brandAmbassadors } = useBrandAmbassadors()
  const brandAmbassadorNames = brandAmbassadors?.map(ba => ba.full_name) || []

  return useQuery({
    queryKey: ['product-categories', brandAmbassadorNames],
    queryFn: async () => {
      const sales = await affiliateSalesService.getSales(undefined, brandAmbassadorNames)
      const uniqueCategories = Array.from(new Set(sales.map(sale => sale.product_category)))
      return uniqueCategories.sort()
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  })
}

// Hook to fetch approved brand ambassadors from TDR applications
export function useBrandAmbassadors() {
  return useQuery({
    queryKey: ['brand-ambassadors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tdr_applications')
        .select('full_name, instagram_handle, tiktok_username')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      return data || []
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
  })
}