import { InstagramPost } from './instagramScraper'

export interface ApifyActorInput {
  urls: string[]
  hashtags?: string[]
  resultsType?: 'posts' | 'details' | 'comments'
  resultsLimit?: number
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
    this.baseUrl = 'https://api.apify.com/v2'
    this.actorId = 'apify~instagram-scraper'
  }

  async runActorWithUrls(input: ApifyActorInput): Promise<ApifyActorRunResponse> {
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

      const actorInput = {
        urls: input.urls,
        hashtags: input.hashtags || [],
        resultsType: input.resultsType || 'posts',
        resultsLimit: input.resultsLimit || 50,
      }

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

      if (response.status === 401) {
        throw new Error('Apify API token invalid or not authorized. Please check your API token.')
      }

      if (response.status === 403) {
        throw new Error('Access denied. Please check your API token permissions.')
      }

      if (response.status === 404) {
        throw new Error('Actor not found. Please check the actor ID.')
      }

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      const posts = this.parseActorResponse(data)

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

      return { success: true, data: posts }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  async runActorAsync(input: ApifyActorInput): Promise<ApifyActorRunResponse> {
    try {
      if (!this.apiKey) {
        throw new Error('APIFY_API_TOKEN not found in environment variables')
      }

      if (!input.urls || input.urls.length === 0) {
        throw new Error('At least one Instagram URL is required')
      }

      const actorInput = {
        urls: input.urls,
        hashtags: input.hashtags || [],
        resultsType: input.resultsType || 'posts',
        resultsLimit: input.resultsLimit || 50,
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

  private parseActorResponse(data: any[]): InstagramPost[] {
    const posts: InstagramPost[] = []

    for (const item of data) {
      try {
        const post = this.parseActorItem(item)
        if (post) {
          posts.push(post)
        }
      } catch (error) {
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