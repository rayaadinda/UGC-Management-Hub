import { supabase } from '@/lib/supabase'
import { processAndUploadImage, needsImageProcessing } from './imageStorage'

// Instagram Post interface
export interface InstagramPost {
  id: string
  caption: string
  media_url: string
  media_type: 'image' | 'video' | 'carousel'
  thumbnail_url?: string
  permalink: string
  timestamp: string
  username: string
  likes_count: number
  comments_count: number
  hashtags: string[]
  status: 'new' | 'approved_for_repost' | 'weekly_winner' | 'rejected'
  platform: 'instagram'
}

// Result interface
export interface ScrapeResult {
  success: boolean
  postsCollected: number
  newPostsAdded: number
  errors: string[]
  timestamp: string
}

// Progress callback type
export type ProgressCallback = (progress: {
  step: string
  percentage: number
  current?: number
  total?: number
  message?: string
}) => void

/**
 * Browser-compatible Apify Service
 * Uses fetch API instead of apify-client to work in the browser
 */
class ApifyService {
  private token: string
  private actorId: string
  private baseUrl = 'https://api.apify.com/v2'

  constructor() {
    const token = import.meta.env.VITE_APIFY_API_TOKEN
    if (!token) {
      throw new Error('VITE_APIFY_API_TOKEN not found in environment')
    }

    this.token = token
    // Use the actor ID from your example
    this.actorId = import.meta.env.VITE_APIFY_ACTOR_ID || 'shu8hvrXbJbY3Eb9W'
  }

  /**
   * Make authenticated request to Apify API
   */
  private async apifyFetch(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseUrl}${endpoint}?token=${this.token}`
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }))
      throw new Error(`Apify API error: ${error.message || response.statusText}`)
    }

    return response.json()
  }

  /**
   * Scrape Instagram content
   */
  async scrapeInstagram(
    input: {
      directUrls?: string[]
      hashtags?: string[]
      resultsLimit?: number
      searchType?: 'hashtag' | 'user' | 'place'
      onlyPostsNewerThan?: string
    },
    onProgress?: ProgressCallback
  ): Promise<ScrapeResult> {
    try {
      onProgress?.({
        step: 'Starting Apify actor...',
        percentage: 10,
        message: 'Initializing scraper'
      })

      // Prepare actor input
      const actorInput: any = {
        resultsType: 'posts',
        resultsLimit: input.resultsLimit || 20,
        searchLimit: 1,
        addParentData: false
      }

      // Add directUrls if provided
      if (input.directUrls && input.directUrls.length > 0) {
        actorInput.directUrls = input.directUrls
        actorInput.searchType = 'user'
      }

      // Add hashtags if provided
      if (input.hashtags && input.hashtags.length > 0) {
        actorInput.hashtags = input.hashtags
        actorInput.searchType = 'hashtag'
      }

      // Add optional parameters
      if (input.onlyPostsNewerThan) {
        actorInput.onlyPostsNewerThan = input.onlyPostsNewerThan
      }

      console.log('🚀 Running Apify actor with input:', actorInput)

      onProgress?.({
        step: 'Running actor...',
        percentage: 30,
        message: 'Scraping Instagram content'
      })

      // Run the actor and wait for it to finish
      const runResponse = await this.apifyFetch(`/acts/${this.actorId}/runs`, {
        method: 'POST',
        body: JSON.stringify(actorInput),
      })

      const runId = runResponse.data.id
      const defaultDatasetId = runResponse.data.defaultDatasetId

      console.log('✅ Actor run started:', runId)

      // Wait for the run to complete
      await this.waitForRunCompletion(runId, onProgress)

      onProgress?.({
        step: 'Fetching results...',
        percentage: 60,
        message: 'Processing scraped data'
      })

      // Fetch results from the dataset
      const datasetResponse = await this.apifyFetch(`/datasets/${defaultDatasetId}/items`)
      const items = datasetResponse

      console.log(`📦 Fetched ${items.length} items from dataset`)

      onProgress?.({
        step: 'Parsing posts...',
        percentage: 80,
        message: `Processing ${items.length} posts`
      })

      // Parse items to InstagramPost format
      const posts = items.map((item: any) => this.parsePost(item)).filter(Boolean) as InstagramPost[]

      onProgress?.({
        step: 'Storing in database...',
        percentage: 90,
        message: 'Processing Instagram images and saving to database...'
      })

      // Store posts in Supabase
      const newPostsCount = await this.storePosts(posts)

      onProgress?.({
        step: 'Complete!',
        percentage: 100,
        message: `Collected ${posts.length} posts, ${newPostsCount} new`
      })

      return {
        success: true,
        postsCollected: posts.length,
        newPostsAdded: newPostsCount,
        errors: [],
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      console.error('❌ Apify scraping error:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      return {
        success: false,
        postsCollected: 0,
        newPostsAdded: 0,
        errors: [errorMessage],
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * Wait for actor run to complete
   */
  private async waitForRunCompletion(runId: string, onProgress?: ProgressCallback): Promise<void> {
    const maxWaitTime = 300000 // 5 minutes
    const pollInterval = 3000 // 3 seconds
    const startTime = Date.now()

    while (Date.now() - startTime < maxWaitTime) {
      const run = await this.getRunStatus(runId)
      
      if (!run) {
        throw new Error('Failed to get run status')
      }

      if (run.status === 'SUCCEEDED') {
        return
      }

      if (run.status === 'FAILED' || run.status === 'ABORTED' || run.status === 'TIMED-OUT') {
        throw new Error(`Actor run ${run.status.toLowerCase()}`)
      }

      // Update progress
      onProgress?.({
        step: 'Running actor...',
        percentage: 30 + (Date.now() - startTime) / maxWaitTime * 30,
        message: `Actor is ${run.status.toLowerCase()}...`
      })

      await new Promise(resolve => setTimeout(resolve, pollInterval))
    }

    throw new Error('Actor run timed out')
  }

  /**
   * Parse Apify dataset item to InstagramPost
   */
  private parsePost(item: any): InstagramPost | null {
    try {
      // Determine media type
      let mediaType: 'image' | 'video' | 'carousel' = 'image'
      if (item.type === 'Video') mediaType = 'video'
      if (item.carousel_media?.length > 0) mediaType = 'carousel'

      // Extract hashtags
      const hashtags: string[] = []
      if (item.caption) {
        const matches = item.caption.match(/#(\w+)/g)
        if (matches) {
          hashtags.push(...matches.map((tag: string) => tag.substring(1)))
        }
      }

      return {
        id: item.id || `post_${Date.now()}`,
        caption: item.caption || '',
        media_url: item.displayUrl || item.videoUrl || '',
        media_type: mediaType,
        thumbnail_url: item.displayUrl,
        permalink: item.url || '',
        timestamp: item.timestamp || new Date().toISOString(),
        username: item.ownerUsername || 'unknown',
        likes_count: item.likesCount || 0,
        comments_count: item.commentsCount || 0,
        hashtags,
        status: 'new',
        platform: 'instagram'
      }
    } catch (error) {
      console.warn('Failed to parse post:', error)
      return null
    }
  }

  /**
   * Store posts in Supabase
   */
  private async storePosts(posts: InstagramPost[]): Promise<number> {
    try {
      if (posts.length === 0) return 0

      // Check for existing posts
      const permalinks = posts.map(p => p.permalink)
      const { data: existingPosts } = await supabase
        .from('ugc_content')
        .select('content_url')
        .in('content_url', permalinks)

      const existingUrls = new Set(existingPosts?.map(p => p.content_url) || [])
      const newPosts = posts.filter(p => !existingUrls.has(p.permalink))

      if (newPosts.length === 0) {
        console.log('No new posts to store')
        return 0
      }

      console.log(`📸 Processing ${newPosts.length} Instagram images through proxy...`)

      // Process Instagram images through proxy to avoid CORS issues
      const processedPosts = await Promise.all(
        newPosts.map(async (post) => {
          try {
            // Process media_url if it's from Instagram CDN
            let processedMediaUrl = post.media_url
            if (needsImageProcessing(post.media_url)) {
              console.log(`🔄 Proxying image: ${post.media_url.substring(0, 50)}...`)
              processedMediaUrl = await processAndUploadImage(post.media_url, {
                maxRetries: 2,
                timeout: 20000,
                quality: 85
              })
              console.log(`✅ Processed media URL for ${post.username}`)
            }

            // Process thumbnail_url if it exists and is from Instagram CDN
            let processedThumbnailUrl = post.thumbnail_url
            if (post.thumbnail_url && needsImageProcessing(post.thumbnail_url)) {
              console.log(`🔄 Proxying thumbnail: ${post.thumbnail_url.substring(0, 50)}...`)
              processedThumbnailUrl = await processAndUploadImage(post.thumbnail_url, {
                maxRetries: 2,
                timeout: 20000,
                quality: 75
              })
              console.log(`✅ Processed thumbnail URL for ${post.username}`)
            }

            return {
              content_url: post.permalink,
              media_url: processedMediaUrl,
              thumbnail_url: processedThumbnailUrl,
              caption: post.caption,
              author_username: post.username,
              likes_count: post.likes_count,
              comments_count: post.comments_count,
              hashtags: post.hashtags,
              media_type: post.media_type,
              status: post.status,
              platform: post.platform
            }
          } catch (error) {
            console.warn(`⚠️ Failed to process images for ${post.username}, using original URLs:`, error)
            // Fallback to original URLs if processing fails
            return {
              content_url: post.permalink,
              media_url: post.media_url,
              thumbnail_url: post.thumbnail_url,
              caption: post.caption,
              author_username: post.username,
              likes_count: post.likes_count,
              comments_count: post.comments_count,
              hashtags: post.hashtags,
              media_type: post.media_type,
              status: post.status,
              platform: post.platform
            }
          }
        })
      )

      // Insert new posts with processed URLs
      const { data, error } = await supabase
        .from('ugc_content')
        .insert(processedPosts)
        .select()

      if (error) {
        console.error('Error storing posts:', error)
        return 0
      }

      console.log(`✅ Stored ${data?.length || 0} new posts with proxied images`)
      return data?.length || 0
    } catch (error) {
      console.error('Error in storePosts:', error)
      return 0
    }
  }

  /**
   * Get actor run status
   */
  async getRunStatus(runId: string) {
    try {
      const response = await this.apifyFetch(`/actor-runs/${runId}`)
      return response.data
    } catch (error) {
      console.error('Error getting run status:', error)
      return null
    }
  }

  /**
   * List recent runs
   */
  async listRuns(limit = 10) {
    try {
      const response = await this.apifyFetch(`/acts/${this.actorId}/runs?limit=${limit}`)
      return response.data.items
    } catch (error) {
      console.error('Error listing runs:', error)
      return []
    }
  }
}

// Export singleton instance
export const apifyService = new ApifyService()

// Export convenience functions
export async function scrapeByHashtags(
  hashtags: string[],
  options?: { resultsLimit?: number; onProgress?: ProgressCallback }
): Promise<ScrapeResult> {
  return apifyService.scrapeInstagram(
    {
      hashtags,
      resultsLimit: options?.resultsLimit,
      searchType: 'hashtag'
    },
    options?.onProgress
  )
}

export async function scrapeByUrls(
  urls: string[],
  options?: { resultsLimit?: number; onProgress?: ProgressCallback }
): Promise<ScrapeResult> {
  return apifyService.scrapeInstagram(
    {
      directUrls: urls,
      resultsLimit: options?.resultsLimit,
      searchType: 'user'
    },
    options?.onProgress
  )
}
