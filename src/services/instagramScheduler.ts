import { supabase } from '@/lib/supabase'
import instagramScraper, { InstagramPost } from './instagramScraper'
import { processAndUploadImage, needsImageProcessing, isProxyAvailable } from './imageStorage'

const TARGET_HASHTAGS = [
  'ridetothrive',
  'mitra2000',
  'motorcyclespecialist',
  'tdr',
  'oneteamstore',
  'highperformancezone',
  'hpzcrew',
  'hpz'
]

export interface ScheduledCollectionResult {
  success: boolean
  postsCollected: number
  newPostsAdded: number
  errors: string[]
  timestamp: string
}

class InstagramSchedulerService {
  async collectFromHashtag(hashtag: string, count: number = 20): Promise<ScheduledCollectionResult> {
    const startTime = new Date()
    const errors: string[] = []
    let totalCollected = 0
    let newPostsAdded = 0

    const cleanHashtag = hashtag.toLowerCase().replace(/^#/, '')

    try {
      
      const result = await instagramScraper.searchByHashtag(hashtag, count)

      if (!result.success) {
        errors.push(result.error || `Failed to fetch posts for hashtag #${cleanHashtag}`)
        return {
          success: false,
          postsCollected: 0,
          newPostsAdded: 0,
          errors,
          timestamp: startTime.toISOString()
        }
      }

      if (!result.data) {
        errors.push(`No data returned for hashtag #${cleanHashtag}`)
        return {
          success: false,
          postsCollected: 0,
          newPostsAdded: 0,
          errors,
          timestamp: startTime.toISOString()
        }
      }

      totalCollected = result.data.length
      
            for (const post of result.data) {
        try {
          const existingPost = await this.checkIfPostExists(post.id)

          if (!existingPost) {
            await this.savePostToDatabase(post)
            newPostsAdded++
          }
        } catch (error) {
          const errorMsg = `Error processing post ${post.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
          errors.push(errorMsg)
                  }
      }

      
      return {
        success: true,
        postsCollected: totalCollected,
        newPostsAdded,
        errors,
        timestamp: startTime.toISOString()
      }

    } catch (error) {
      const errorMsg = `Critical error in collection for #${cleanHashtag}: ${error instanceof Error ? error.message : 'Unknown error'}`
      errors.push(errorMsg)
      
      return {
        success: false,
        postsCollected: totalCollected,
        newPostsAdded,
        errors,
        timestamp: startTime.toISOString()
      }
    }
  }

  async collectNewPosts(): Promise<ScheduledCollectionResult> {
    const startTime = new Date()
    const errors: string[] = []
    let totalCollected = 0
    let newPostsAdded = 0

    try {
      
            const result = await instagramScraper.searchMultipleHashtags(TARGET_HASHTAGS, 2)

      if (!result.success || !result.data) {
        errors.push(result.error || 'Failed to fetch posts from Instagram API')
        return {
          success: false,
          postsCollected: 0,
          newPostsAdded: 0,
          errors,
          timestamp: startTime.toISOString()
        }
      }

      totalCollected = result.data.length
      
            for (const post of result.data) {
        try {
          const existingPost = await this.checkIfPostExists(post.id)

          if (!existingPost) {
            await this.savePostToDatabase(post)
            newPostsAdded++
          }
        } catch (error) {
          const errorMsg = `Error processing post ${post.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
          errors.push(errorMsg)
                  }
      }

      
      return {
        success: true,
        postsCollected: totalCollected,
        newPostsAdded,
        errors,
        timestamp: startTime.toISOString()
      }

    } catch (error) {
      const errorMsg = `Critical error in collection: ${error instanceof Error ? error.message : 'Unknown error'}`
      errors.push(errorMsg)
      
      return {
        success: false,
        postsCollected: totalCollected,
        newPostsAdded,
        errors,
        timestamp: startTime.toISOString()
      }
    }
  }

  private async checkIfPostExists(postId: string): Promise<boolean> {
    try {
            const { data, error } = await supabase
        .from('ugc_content')
        .select('id')
        .eq('id', postId)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
                throw error
      }

            return !!data
    } catch (error) {
            throw error
    }
  }

  private async savePostToDatabase(post: InstagramPost): Promise<void> {
    try {
      
            let processedThumbnailUrl: string | undefined = post.thumbnail_url

      if (post.thumbnail_url && needsImageProcessing(post.thumbnail_url)) {
                const uploadedUrl = await processAndUploadImage(post.thumbnail_url)

        if (!uploadedUrl) {
                    processedThumbnailUrl = post.thumbnail_url
        } else {
          processedThumbnailUrl = uploadedUrl
                  }
      }

      const postData = {
        id: post.id,
        platform: post.platform,
        author_username: post.username,
        content_url: post.permalink,
        media_type: post.media_type,
        media_url: post.media_url,
        thumbnail_url: processedThumbnailUrl,
        caption: post.caption,
        likes_count: post.likes_count,
        comments_count: post.comments_count,
        hashtags: post.hashtags,
        status: post.status,
        created_at: post.timestamp,
        updated_at: new Date().toISOString()
      }

      
      const { data, error } = await supabase
        .from('ugc_content')
        .insert([postData])
        .select()

      if (error) {
                throw error
      }

          } catch (error) {
            throw error
    }
  }

  async getCollectionHistory(limit: number = 10): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('collection_history')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit)

      if (error) {
        throw error
      }

      return data || []
    } catch (error) {
            return []
    }
  }

  async logCollectionResult(result: ScheduledCollectionResult): Promise<void> {
    try {
      const { error } = await supabase
        .from('collection_history')
        .insert([{
          success: result.success,
          posts_collected: result.postsCollected,
          new_posts_added: result.newPostsAdded,
          errors: result.errors,
          timestamp: result.timestamp
        }])

      if (error) {
              }
    } catch (error) {
          }
  }
}

export const instagramScheduler = new InstagramSchedulerService()
export default instagramScheduler

export async function runScheduledCollection(): Promise<void> {
  
  const scheduler = new InstagramSchedulerService()
  const result = await scheduler.collectNewPosts()

  await scheduler.logCollectionResult(result)

  }

export async function devManualCollection(): Promise<ScheduledCollectionResult> {
  
  const scheduler = new InstagramSchedulerService()
  const result = await scheduler.collectNewPosts()

  await scheduler.logCollectionResult(result)

    return result
}

export async function devManualHashtagCollection(hashtag: string, count: number = 20): Promise<ScheduledCollectionResult> {
  
  const scheduler = new InstagramSchedulerService()
  const result = await scheduler.collectFromHashtag(hashtag, count)

  await scheduler.logCollectionResult(result)

    return result
}