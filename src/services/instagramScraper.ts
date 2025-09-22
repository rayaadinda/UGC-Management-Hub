// Supabase client for database operations

export interface InstagramPost {
  id: string
  caption: string
  media_url: string
  media_type: 'image' | 'video'
  permalink: string
  timestamp: string
  username: string
  likes_count: number
  comments_count: number
  hashtags: string[]
  status: 'new' | 'approved_for_repost' | 'weekly_winner' | 'rejected'
  platform: 'instagram'
  thumbnail_url?: string
}

export interface InstagramScraperResponse {
  success: boolean
  data?: InstagramPost[]
  error?: string
}

class InstagramScraperService {
  private readonly apiKey: string
  private readonly baseUrl: string
  private readonly datasetId: string

  constructor() {
    this.apiKey = import.meta.env.VITE_APIFY_API_TOKEN || ''
    this.baseUrl = 'https://api.apify.com/v2'
    this.datasetId = import.meta.env.VITE_APIFY_DATASET_ID
  }

  async searchByHashtag(hashtag: string, count: number = 20): Promise<InstagramScraperResponse> {
    try {
      if (!this.apiKey) {
        throw new Error('APIFY_API_TOKEN not found in environment variables')
      }

  
      const response = await fetch(
        `${this.baseUrl}/datasets/${this.datasetId}/items?token=${this.apiKey}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (response.status === 401) {
        throw new Error('Apify API token invalid or not authorized. Please check your API token.')
      }

      if (response.status === 403) {
        throw new Error('Access denied. Please check your API token permissions.')
      }

      if (response.status === 404) {
        throw new Error('Dataset not found. Please check your dataset ID.')
      }

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

  
      // Filter posts by hashtag and parse the clean JSON response
      const posts = this.parseApifyResponse(data, hashtag, count)

      if (posts.length === 0) {
        return {
          success: true,
          data: [],
          error: `No posts found for hashtag #${hashtag}`,
        }
      }

      return { success: true, data: posts }
    } catch (error) {
      console.error('Error fetching Instagram posts from Apify:')
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  async searchMultipleHashtags(
    hashtags: string[],
    postsPerHashtag: number = 5
  ): Promise<InstagramScraperResponse> {
    try {
      const allPosts: InstagramPost[] = []
      const errors: string[] = []

      for (const hashtag of hashtags) {
        const result = await this.searchByHashtag(hashtag, postsPerHashtag)

        if (result.success && result.data) {
          allPosts.push(...result.data)
        } else if (result.error) {
          errors.push(`${hashtag}: ${result.error}`)
        }
      }

      if (allPosts.length === 0) {
        return {
          success: false,
          error: `Failed to fetch posts from all hashtags. Errors: ${errors.join(', ')}`,
        }
      }

      return { success: true, data: allPosts }
    } catch (error) {
      console.error('Error searching multiple hashtags:')
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  private parseApifyResponse(data: any[], targetHashtag: string, count: number): InstagramPost[] {
    try {
      const posts: InstagramPost[] = []

      // Filter posts that contain the target hashtag in caption or hashtags array
      const filteredPosts = data.filter((item) => {
        const targetHashtagLower = targetHashtag.toLowerCase().replace(/^#/, '')

        // Check if hashtag is in the hashtags array
        if (item.hashtags && Array.isArray(item.hashtags)) {
          return item.hashtags.some(
            (hashtag: string) => hashtag.toLowerCase() === targetHashtagLower
          )
        }

        // Check if hashtag is in the caption
        if (item.caption && typeof item.caption === 'string') {
          return item.caption.toLowerCase().includes(`#${targetHashtagLower}`)
        }

        return false
      })

      
      // Parse the filtered posts
      for (const item of filteredPosts.slice(0, count)) {
        try {
          const post = this.parseApifyItem(item, targetHashtag)
          if (post) {
            posts.push(post)
          }
        } catch (error) {
          console.warn('Failed to parse Apify item:', error)
        }
      }

          return posts
    } catch (error) {
      console.error('Error parsing Apify response:')
      return []
    }
  }

  private parseApifyItem(item: any, _targetHashtag: string): InstagramPost | null {
    try {
      
      // Extract hashtags from caption if not already in hashtags array
      let allHashtags = item.hashtags || []
      if (item.caption && typeof item.caption === 'string') {
        const captionHashtags = this.extractHashtags(item.caption)
        allHashtags = [...new Set([...allHashtags, ...captionHashtags])]
      }

      // Determine media type and extract thumbnail
      let mediaType: 'image' | 'video' = 'image'
      let mediaUrl = item.displayUrl || ''
      let thumbnailUrl: string | undefined

      
      if (item.type === 'Video' && item.videoUrl) {
        mediaType = 'video'
        mediaUrl = item.videoUrl

        // For videos, try multiple sources for thumbnails
        if (item.displayUrl) {
          thumbnailUrl = item.displayUrl
        }

        // Check if there are any images in the array
        if (!thumbnailUrl && item.images && item.images.length > 0) {
          thumbnailUrl = item.images[0]
        }

        // Try to generate thumbnail from video URL pattern
        if (!thumbnailUrl && item.videoUrl) {
          // Instagram video thumbnails often follow CDN patterns
          const videoUrl = item.videoUrl

          // Try to extract base URL and change extension
          const mp4Match = videoUrl.match(/(.+)\.mp4/)
          if (mp4Match) {
            thumbnailUrl = `${mp4Match[1]}.jpg`
          }

          // Try Instagram's thumbnail CDN pattern
          if (!thumbnailUrl) {
            const cdnMatch = videoUrl.match(
              /(instagram\.f[a-z0-9-]+\.fbcdn\.net)\/.*\/([^\/]+\.mp4)/
            )
            if (cdnMatch) {
              thumbnailUrl = `https://${cdnMatch[1]}/v/t51.2885-15/${cdnMatch[2].replace('.mp4', '.jpg')}`
            }
          }
        }
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
        hashtags: allHashtags,
        status: 'new',
        platform: 'instagram',
        thumbnail_url: thumbnailUrl,
      }

      
      return post
    } catch (error) {
      console.error('Error parsing Apify item:')
      return null
    }
  }

  private extractHashtags(caption: string): string[] {
    const hashtagRegex = /#(\w+)/g
    const matches = caption.match(hashtagRegex)
    return matches ? matches.map((tag) => tag.substring(1)) : []
  }

  // Currently unused but kept for future validation
  /*
  private async isValidImageUrl(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' })
      const contentType = response.headers.get('content-type')
      return contentType?.startsWith('image/') || false
    } catch (error) {
      console.warn('Failed to validate image URL:', url, error)
      return false
    }
  }
  */
}

export const instagramScraper = new InstagramScraperService()
export default instagramScraper
