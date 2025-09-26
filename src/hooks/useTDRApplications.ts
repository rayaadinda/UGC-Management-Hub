import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { TDRApplication, TDRApplicationFilters } from '@/types'

export function useTDRApplications(filters: TDRApplicationFilters = {}) {
  return useQuery({
    queryKey: ['tdr-applications', filters],
    queryFn: async () => {
      let query = supabase
        .from('tdr_applications')
        .select('*')
        .order('created_at', { ascending: false })

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }

      if (filters.owns_motorcycle && filters.owns_motorcycle !== 'all') {
        query = query.eq('owns_motorcycle', filters.owns_motorcycle)
      }

      if (filters.racing_experience && filters.racing_experience !== 'all') {
        query = query.eq('racing_experience', filters.racing_experience)
      }

      if (filters.search) {
        query = query.or(
          `full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,instagram_handle.ilike.%${filters.search}%`
        )
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      return data as TDRApplication[]
    },
  })
}

export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      notes 
    }: { 
      id: string
      status: TDRApplication['status']
      notes?: string
    }) => {

      const updateData: any = { 
        status,
        updated_at: new Date().toISOString() 
      }
      
            if (notes !== undefined) {
        updateData.notes = notes
      }

      const { data, error } = await supabase
        .from('tdr_applications')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update application status: ${error.message}`)
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tdr-applications'] })
    },
    onError: (error) => {
      throw error
    }
  })
}