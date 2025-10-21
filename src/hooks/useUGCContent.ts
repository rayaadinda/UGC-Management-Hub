import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { UGCContent, UGCContentFilters } from '@/types'

export function useUGCContent(filters: UGCContentFilters = {}) {
  return useQuery({
    queryKey: ['ugc-content', filters],
    queryFn: async () => {
      let query = supabase
        .from('ugc_content')
        .select('*')
        .order('created_at', { ascending: false })

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }

      if (filters.platform && filters.platform !== 'all') {
        query = query.eq('platform', filters.platform)
      }

      if (filters.search) {
        query = query.or(
          `author_username.ilike.%${filters.search}%,caption.ilike.%${filters.search}%`
        )
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      return data as UGCContent[]
    },
  })
}

export function useUpdateUGCStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: UGCContent['status'] }) => {
      const { data, error } = await supabase
        .from('ugc_content')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw error
      }

      return data as UGCContent
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ugc-content'] })
    },
  })
}