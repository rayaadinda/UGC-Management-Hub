import { InstagramPost } from './instagramScraper'
import { supabase } from '@/lib/supabase'
import { processAndUploadImage, needsImageProcessing } from './imageStorage'

export interface ApifyActorInput {
  urls: string[]
  hashtags?: string[]
  resultsType?: 'posts' | 'details' | 'comments'
  resultsLimit?: number
  onlyPostsNewerThan?: string
  searchType?: 'hashtag' | 'profile' | 'location'
}

export interface ProgressCallback {
  (progress: { step: string; percentage: number; current?: number; total?: number }): void
}

export interface ApifyActorTask {
  id: string
  status: 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'TIMED_OUT' | 'ABORTED'
  startedAt?: string
  finishedAt?: string
  datasetId?: string
  resultCount?: number
  error?: string
}

export interface ApifyActorRunResponse {
  success: boolean
  data?: ApifyActorTask
  error?: string
}

export interface ApifyActorResult {
  success: boolean
  data?: InstagramPost[]
  error?: string
}

class ApifyActorService {
  private readonly apiKey: string
  private readonly baseUrl: string
  private readonly actorId: string

  constructor() {
    this.apiKey = import.meta.env.VITE_APIFY_API_TOKEN || ''
    this.baseUrl = import.meta.env.DEV ? '/api/apify/v2' : 'https://api.apify.com/v2'
    
    this.actorId = import.meta.env.VITE_APIFY_ACTOR_ID || 'apify/instagram-scraper'
  }

  async runActorWithUrls(input: ApifyActorInput, onProgress?: ProgressCallback): Promise<ApifyActorRunResponse> {
    try {
      if (!this.apiKey) {
        throw new Error('APIFY_API_TOKEN not found in environment variables')
      }

      if (!input.urls || input.urls.length === 0) {
        throw new Error('At least one Instagram URL is required')
      }

      // Validate Instagram URLs
      for (const url of input.urls) {
        if (!this.isValidInstagramUrl(url)) {
          throw new Error(`Invalid Instagram URL: ${url}`)
        }
      }

      // Try sync first, fallback to async if CORS issues
      try {
        onProgress?.({ step: 'Starting scraper...', percentage: 0 })
        return await this.runActorSync(input, onProgress)
      } catch (error) {
        console.warn('Sync execution failed, trying async approach:', error)
        return await this.runActorAsync(input, onProgress)
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  // Helper method to test different actor IDs
  async testActorAvailability(): Promise<{ actorId: string; available: boolean; error?: string }[]> {
    const actorIds = [
      'dtrungtin/instagram-scraper',
      'jaroslavhuss/instagram-scraper',
      'apify~instagram-scraper',
      'lukaskrivka/instagram-scraper',
      'apify/instagram-scraper'
    ]

    const results = []
    for (const actorId of actorIds) {
      try {
        const response = await fetch(`${this.baseUrl}/acts/${actorId}?token=${this.apiKey}`)
        results.push({
          actorId,
          available: response.ok,
          error: response.ok ? undefined : `${response.status} ${response.statusText}`
        })
      } catch (error) {
        results.push({
          actorId,
          available: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    return results
  }

  private async runActorSync(input: ApifyActorInput, onProgress?: ProgressCallback): Promise<ApifyActorRunResponse> {
    try {
      onProgress?.({ step: 'Preparing scraper input...', percentage: 10 })
      
      // Correct input format based on successful Apify console test
      const actorInput = {
        addParentData: false,
        directUrls: input.urls,
        enhanceUserSearchWithFacebookPage: false,
        isUserReelFeedURL: false,
        isUserTaggedFeedURL: false,
        onlyPostsNewerThan: input.onlyPostsNewerThan || "1 day",
        resultsLimit: input.resultsLimit || 50,
        resultsType: input.resultsType || "posts",
        searchType: input.searchType || "hashtag"
      }

      onProgress?.({ step: 'Connecting to Instagram...', percentage: 20 })
      
      const response = await fetch(
        `${this.baseUrl}/acts/${this.actorId}/run-sync-get-dataset-items?token=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(actorInput),
        }
      )

      if (response.status === 400) {
        const errorData = await response.json()
        throw new Error(`Bad Request (400): ${JSON.stringify(errorData, null, 2)}`)
      }

      if (response.status === 401) {
        throw new Error('Apify API token invalid or not authorized. Please check your API token.')
      }

      if (response.status === 403) {
        throw new Error('Access denied. Please check your API token permissions.')
      }

      if (response.status === 404) {
        throw new Error(`Actor '${this.actorId}' not found. Please verify:
1. Your API token has access to 'apify/instagram-scraper'
2. The actor ID is correct: apify/instagram-scraper
3. Try setting VITE_APIFY_ACTOR_ID=apify/instagram-scraper in your .env file
4. Check if you have proper permissions on your Apify account`)
      }

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }

      onProgress?.({ step: 'Scraping Instagram posts...', percentage: 50 })
      
      const data = await response.json()
      const posts = this.parseActorResponse(data)

      onProgress?.({ step: 'Processing images...', percentage: 70 })

      // Store posts in database if any were found
      if (posts.length > 0) {
        await this.storePosts(posts, onProgress)
      }

      return {
        success: true,
        data: {
          id: `sync_${Date.now()}`,
          status: 'SUCCEEDED',
          startedAt: new Date().toISOString(),
          finishedAt: new Date().toISOString(),
          datasetId: 'sync_dataset',
          resultCount: posts.length,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  async getDatasetItems(datasetId: string): Promise<ApifyActorResult> {
    try {
      if (!this.apiKey) {
        throw new Error('APIFY_API_TOKEN not found in environment variables')
      }

      const response = await fetch(
        `${this.baseUrl}/datasets/${datasetId}/items?token=${this.apiKey}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch dataset items: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      const posts = this.parseActorResponse(data)

      // Store posts in database if any were found
      if (posts.length > 0) {
        await this.storePosts(posts)
      }

      return { success: true, data: posts }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  async runActorAsync(input: ApifyActorInput, onProgress?: ProgressCallback): Promise<ApifyActorRunResponse> {
    try {
      onProgress?.({ step: 'Starting async scraper...', percentage: 10 })
      
      if (!this.apiKey) {
        throw new Error('APIFY_API_TOKEN not found in environment variables')
      }

      if (!input.urls || input.urls.length === 0) {
        throw new Error('At least one Instagram URL is required')
      }

      // Correct input format based on successful Apify console test
      const actorInput = {
        addParentData: false,
        directUrls: input.urls,
        enhanceUserSearchWithFacebookPage: false,
        isUserReelFeedURL: false,
        isUserTaggedFeedURL: false,
        onlyPostsNewerThan: input.onlyPostsNewerThan || "1 day",
        resultsLimit: input.resultsLimit || 50,
        resultsType: input.resultsType || "posts",
        searchType: input.searchType || "hashtag"
      }

      const response = await fetch(
        `${this.baseUrl}/acts/${this.actorId}/runs?token=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(actorInput),
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to start actor run: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      return {
        success: true,
        data: {
          id: data.data.id,
          status: data.data.status,
          startedAt: data.data.startedAt,
          finishedAt: data.data.finishedAt,
          datasetId: data.data.defaultDatasetId,
          resultCount: data.data.stats?.inputBodyLen || 0,
        },
      }
    } catch (error) {
            return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  async getTaskStatus(taskId: string): Promise<ApifyActorRunResponse> {
    try {
      if (!this.apiKey) {
        throw new Error('APIFY_API_TOKEN not found in environment variables')
      }

      const response = await fetch(
        `${this.baseUrl}/actor-runs/${taskId}?token=${this.apiKey}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to get task status: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      return {
        success: true,
        data: {
          id: data.data.id,
          status: data.data.status,
          startedAt: data.data.startedAt,
          finishedAt: data.data.finishedAt,
          datasetId: data.data.defaultDatasetId,
          resultCount: data.data.stats?.inputBodyLen || 0,
          error: data.data.status === 'FAILED' ? data.data.error?.message : undefined,
        },
      }
    } catch (error) {
            return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  private async storePosts(posts: InstagramPost[], onProgress?: ProgressCallback): Promise<{ success: boolean; stored: number; errors: string[] }> {
    try {
      const results = {
        success: true,
        stored: 0,
        errors: [] as string[]
      }

      if (posts.length === 0) {
        onProgress?.({ step: 'Complete', percentage: 100 })
        return results
      }

      onProgress?.({ step: 'Checking existing posts...', percentage: 75, current: 0, total: posts.length })

      // Batch check for existing posts
      const permalinks = posts.map(p => p.permalink)
      const { data: existingPosts } = await supabase
        .from('ugc_content')
        .select('content_url')
        .in('content_url', permalinks)

      const existingUrls = new Set(existingPosts?.map(p => p.content_url) || [])
      const newPosts = posts.filter(p => !existingUrls.has(p.permalink))

      if (newPosts.length === 0) {
        onProgress?.({ step: 'All posts already exist', percentage: 100 })
        return results
      }

      onProgress?.({ step: 'Processing posts...', percentage: 85, current: 0, total: newPosts.length })

      // Helper function to generate UUID
      const generateUUID = () => {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
          return crypto.randomUUID()
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0
          const v = c == 'x' ? r : (r & 0x3 | 0x8)
          return v.toString(16)
        })
      }

      // Process images in batches to avoid overwhelming the server
      const BATCH_SIZE = 3
      for (let i = 0; i < newPosts.length; i += BATCH_SIZE) {
        const batch = newPosts.slice(i, i + BATCH_SIZE)
        
        const batchPromises = batch.map(async (post) => {
          try {
            // Fast image processing - process in parallel
            const [processedMediaUrl, processedThumbnailUrl] = await Promise.all([
              post.media_url && needsImageProcessing(post.media_url) 
                ? processAndUploadImage(post.media_url).catch(() => post.media_url)
                : Promise.resolve(post.media_url || post.permalink),
              
              post.thumbnail_url && needsImageProcessing(post.thumbnail_url)
                ? processAndUploadImage(post.thumbnail_url).catch(() => post.thumbnail_url)
                : Promise.resolve(post.thumbnail_url)
            ])

            // Prepare post data
            const postData = {
              id: generateUUID(),
              platform: post.platform || 'instagram',
              author_username: post.username || 'unknown',
              content_url: post.permalink,
              media_type: post.media_type || 'image',
              media_url: processedMediaUrl,
              thumbnail_url: processedThumbnailUrl,
              caption: post.caption || '',
              likes_count: Number(post.likes_count) || 0,
              comments_count: Number(post.comments_count) || 0,
              hashtags: Array.isArray(post.hashtags) ? post.hashtags : [],
              status: post.status || 'new',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }

            // Insert post
            const { error } = await supabase
              .from('ugc_content')
              .insert(postData)

            if (error) {
              results.errors.push(`${post.id}: ${error.message}`)
            } else {
              results.stored++
            }
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error'
            results.errors.push(`${post.id}: ${errorMsg}`)
          }
        })

        await Promise.allSettled(batchPromises)
        
        const progress = Math.round(85 + ((i + BATCH_SIZE) / newPosts.length) * 10)
        onProgress?.({ 
          step: `Stored ${Math.min(i + BATCH_SIZE, newPosts.length)} of ${newPosts.length} posts`, 
          percentage: Math.min(progress, 95),
          current: Math.min(i + BATCH_SIZE, newPosts.length),
          total: newPosts.length 
        })
      }

      onProgress?.({ step: 'Complete!', percentage: 100 })
      
      results.success = results.errors.length === 0 || results.stored > 0
      return results
    } catch (error) {
      return {
        success: false,
        stored: 0,
        errors: [error instanceof Error ? error.message : 'Unknown database error']
      }
    }
  }

  private parseActorResponse(data: any[]): InstagramPost[] {
    const posts: InstagramPost[] = []

    // Check if the response contains error information
    if (data && data.length > 0 && data[0].error) {
      const errorItem = data[0]
      if (errorItem.error === 'no_items') {
        throw new Error(`Empty or private data for provided input: ${errorItem.errorDescription || 'No posts found'}`)
      }
      throw new Error(`Apify actor error: ${errorItem.error} - ${errorItem.errorDescription || 'Unknown error'}`)
    }

    if (!Array.isArray(data)) {
      console.warn('Invalid data format received from Apify actor:', data)
      return posts
    }

    for (const item of data) {
      try {
        // Skip error items
        if (item.error) {
          console.warn('Skipping error item:', item)
          continue
        }
        
        const post = this.parseActorItem(item)
        if (post) {
          posts.push(post)
        }
      } catch (error) {
        console.warn('Failed to parse item:', item, error)
      }
    }

    return posts
  }

  private parseActorItem(item: any): InstagramPost | null {
    try {
      let mediaType: 'image' | 'video' = 'image'
      let mediaUrl = item.displayUrl || ''
      let thumbnailUrl: string | undefined

      if (item.type === 'Video' && item.videoUrl) {
        mediaType = 'video'
        mediaUrl = item.videoUrl
        thumbnailUrl = item.displayUrl
      }

      // Extract hashtags from caption
      let hashtags: string[] = []
      if (item.caption && typeof item.caption === 'string') {
        const hashtagRegex = /#(\w+)/g
        const matches = item.caption.match(hashtagRegex)
        hashtags = matches ? matches.map((tag: string) => tag.substring(1)) : []
      }

      // Add hashtags from the hashtags array if available
      if (item.hashtags && Array.isArray(item.hashtags)) {
        hashtags = [...new Set([...hashtags, ...item.hashtags])]
      }

      const post: InstagramPost = {
        id: item.id,
        caption: item.caption || '',
        media_url: mediaUrl,
        media_type: mediaType,
        permalink: item.url || '',
        timestamp: item.timestamp || new Date().toISOString(),
        username: item.ownerUsername || 'unknown',
        likes_count: item.likesCount || 0,
        comments_count: item.commentsCount || 0,
        hashtags,
        status: 'new',
        platform: 'instagram',
        thumbnail_url: thumbnailUrl,
      }

      return post
    } catch (error) {
            return null
    }
  }

  private isValidInstagramUrl(url: string): boolean {
    const instagramUrlPattern = /^https:\/\/(www\.)?instagram\.com\/(p|reel)\/[a-zA-Z0-9_-]+\/?$/
    const profileUrlPattern = /^https:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9_.]+\/?$/

    return instagramUrlPattern.test(url) || profileUrlPattern.test(url)
  }
}

export const apifyActorService = new ApifyActorService()
export default apifyActorService