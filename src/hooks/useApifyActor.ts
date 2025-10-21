import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apifyActorService, ApifyActorInput, ApifyActorTask } from '@/services/apifyActor'

const APIFY_ACTOR_QUERY_KEY = 'apify-actor'

export function useRunApifyActor() {
  const queryClient = useQueryClient()
  const [progress, setProgress] = useState<{ step: string; percentage: number; current?: number; total?: number } | null>(null)

  const mutation = useMutation({
    mutationFn: async (input: ApifyActorInput) => {
      setProgress({ step: 'Initializing...', percentage: 0 })
      
      const result = await apifyActorService.scrapeByUrls(
        input.urls || [],
        input,
        (progressUpdate: any) => {
          setProgress(progressUpdate)
        }
      )

      if (!result.success) {
        // Enhanced error handling for common issues
        let errorMessage = result.error || 'Failed to run Apify actor'
        
        if (errorMessage.includes('no_items') || errorMessage.includes('Empty or private data')) {
          errorMessage = 'No posts found. This could be due to: 1) Private Instagram account 2) Invalid URLs 3) Posts don\'t exist. Please check the URLs and try again.'
        } else if (errorMessage.includes('JWT') || errorMessage.includes('401')) {
          errorMessage = 'Authentication failed. Please check your Apify API token.'
        }
        
        throw new Error(errorMessage)
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
      
      // Invalidate UGC content cache to show new posts
      queryClient.invalidateQueries({ queryKey: ['ugc-content'] })
      
      // Clear progress on success
      setProgress(null)
    },
    onError: () => {
      // Clear progress on error
      setProgress(null)
    }
  })

  return {
    ...mutation,
    progress
  }
}

export function useRunApifyActorAsync() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: ApifyActorInput) => {
      const result = await apifyActorService.executeScraping(input)

      if (!result.success) {
        // Enhanced error handling for common issues
        let errorMessage = result.error || 'Failed to start async Apify actor'
        
        if (errorMessage.includes('no_items') || errorMessage.includes('Empty or private data')) {
          errorMessage = 'No posts found. This could be due to: 1) Private Instagram account 2) Invalid URLs 3) Posts don\'t exist. Please check the URLs and try again.'
        } else if (errorMessage.includes('JWT') || errorMessage.includes('401')) {
          errorMessage = 'Authentication failed. Please check your Apify API token.'
        }
        
        throw new Error(errorMessage)
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

        // Check if URL is properly formatted
        try {
          new URL(url)
        } catch {
          return { isValid: false, error: 'Invalid URL format' }
        }

        if (!instagramUrlPattern.test(url) && !profileUrlPattern.test(url)) {
          return { 
            isValid: false, 
            error: 'Please enter a valid Instagram URL. Supported formats:\n• Post: instagram.com/p/ABC123/\n• Reel: instagram.com/reel/ABC123/\n• Profile: instagram.com/username/' 
          }
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