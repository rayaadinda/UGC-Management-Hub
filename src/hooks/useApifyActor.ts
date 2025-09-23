import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apifyActorService, ApifyActorInput, ApifyActorTask } from '@/services/apifyActor'

const APIFY_ACTOR_QUERY_KEY = 'apify-actor'

export function useRunApifyActor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: ApifyActorInput) => {
      const result = await apifyActorService.runActorWithUrls(input)

      if (!result.success) {
        throw new Error(result.error || 'Failed to run Apify actor')
      }

      return result
    },
    onSuccess: (data) => {
      // Update actor tasks cache
      queryClient.setQueryData([APIFY_ACTOR_QUERY_KEY, 'tasks'], (old: ApifyActorTask[] = []) => {
        if (data.data) {
          return [data.data, ...old]
        }
        return old
      })

      // Invalidate actor queries
      queryClient.invalidateQueries({ queryKey: [APIFY_ACTOR_QUERY_KEY] })
    },
  })
}

export function useRunApifyActorAsync() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: ApifyActorInput) => {
      const result = await apifyActorService.runActorAsync(input)

      if (!result.success) {
        throw new Error(result.error || 'Failed to start async Apify actor')
      }

      return result
    },
    onSuccess: (data) => {
      // Update actor tasks cache
      queryClient.setQueryData([APIFY_ACTOR_QUERY_KEY, 'tasks'], (old: ApifyActorTask[] = []) => {
        if (data.data) {
          return [data.data, ...old]
        }
        return old
      })

      // Invalidate actor queries
      queryClient.invalidateQueries({ queryKey: [APIFY_ACTOR_QUERY_KEY] })
    },
  })
}

export function useApifyActorStatus(taskId: string, enabled = false) {
  return useQuery({
    queryKey: [APIFY_ACTOR_QUERY_KEY, 'status', taskId],
    queryFn: async () => {
      const result = await apifyActorService.getTaskStatus(taskId)

      if (!result.success) {
        throw new Error(result.error || 'Failed to get task status')
      }

      return result.data
    },
    enabled: enabled && !!taskId,
    refetchInterval: (data) => {
      // Refetch every 5 seconds if task is still running
      const taskData = data as unknown as ApifyActorTask | undefined
      if (taskData && (taskData.status === 'RUNNING' || taskData.status === 'TIMED_OUT')) {
        return 5000
      }
      return false
    },
  })
}

export function useApifyActorTasks() {
  return useQuery({
    queryKey: [APIFY_ACTOR_QUERY_KEY, 'tasks'],
    queryFn: async () => {
      // This would typically fetch from a backend that stores task history
      // For now, we'll return an empty array
      return [] as ApifyActorTask[]
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useApifyActorDataset(datasetId: string, enabled = false) {
  return useQuery({
    queryKey: [APIFY_ACTOR_QUERY_KEY, 'dataset', datasetId],
    queryFn: async () => {
      const result = await apifyActorService.getDatasetItems(datasetId)

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch dataset items')
      }

      return result.data
    },
    enabled: enabled && !!datasetId,
  })
}

// Hook for validating Instagram URLs
export function useInstagramUrlValidation() {
  return {
    validateUrl: (url: string): { isValid: boolean; error?: string } => {
      try {
        const instagramUrlPattern = /^https:\/\/(www\.)?instagram\.com\/(p|reel)\/[a-zA-Z0-9_-]+\/?$/
        const profileUrlPattern = /^https:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9_.]+\/?$/

        if (!url) {
          return { isValid: false, error: 'URL is required' }
        }

        if (!instagramUrlPattern.test(url) && !profileUrlPattern.test(url)) {
          return { isValid: false, error: 'Please enter a valid Instagram URL (post, reel, or profile)' }
        }

        return { isValid: true }
      } catch (error) {
        return { isValid: false, error: 'Invalid URL format' }
      }
    },
  }
}

// Hook for managing Instagram URL list
export function useInstagramUrlList() {
  const [urls, setUrls] = useState<string[]>([])
  const { validateUrl } = useInstagramUrlValidation()

  const addUrl = (url: string): { success: boolean; error?: string } => {
    const validation = validateUrl(url)

    if (!validation.isValid) {
      return { success: false, error: validation.error }
    }

    // Check for duplicates
    if (urls.includes(url)) {
      return { success: false, error: 'URL already added' }
    }

    setUrls(prev => [...prev, url])
    return { success: true }
  }

  const removeUrl = (url: string) => {
    setUrls(prev => prev.filter(u => u !== url))
  }

  const clearUrls = () => {
    setUrls([])
  }

  return {
    urls,
    addUrl,
    removeUrl,
    clearUrls,
    isValid: urls.length > 0,
  }
}