import { InstagramPost } from './instagramScraper'

export interface ScrapingJob {
  id: string
  applicant_id: string
  applicant_name: string
  instagram_handle: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused'
  posts_count: number
  new_posts: number
  started_at?: string
  completed_at?: string
  error_message?: string
  last_scraped?: string
  apify_task_id?: string
}

export interface ScrapedProfile {
  id: string
  applicant_id: string
  instagram_handle: string
  username: string
  full_name: string
  bio: string
  followers_count: number
  following_count: number
  posts_count: number
  profile_pic_url: string
  is_private: boolean
  is_verified: boolean
  website?: string
  external_url?: string
  business_category_name?: string
  last_updated: string
}

export interface ScrapedPost extends InstagramPost {
  id: string
  profile_id: string
  applicant_id: string
  instagram_post_id: string
  created_at: string
  updated_at: string
}

export interface CreateScrapingJobInput {
  applicant_id: string
  applicant_name: string
  instagram_handle: string
  posts_limit?: number
  include_stories?: boolean
  include_highlights?: boolean
}

export interface ScrapingJobResult {
  success: boolean
  data?: ScrapingJob
  error?: string
}

export interface ScrapingResult {
  success: boolean
  posts_collected: number
  new_posts: number
  profile_data?: ScrapedProfile
  posts: ScrapedPost[]
  errors: string[]
}

class ProfileScrapingService {
  private readonly supabaseUrl: string
  private readonly supabaseAnonKey: string
  private readonly apifyApiKey: string

  constructor() {
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
    this.supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
    this.apifyApiKey = import.meta.env.VITE_APIFY_API_TOKEN || ''
  }

  async createScrapingJob(input: CreateScrapingJobInput): Promise<ScrapingJobResult> {
    try {
      if (!this.supabaseUrl || !this.supabaseAnonKey) {
        throw new Error('Supabase configuration not found')
      }

      const response = await fetch(`${this.supabaseUrl}/rest/v1/scraping_jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseAnonKey}`,
          'apikey': this.supabaseAnonKey,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          applicant_id: input.applicant_id,
          applicant_name: input.applicant_name,
          instagram_handle: input.instagram_handle.replace('@', ''),
          status: 'pending',
          posts_count: 0,
          new_posts: 0,
          posts_limit: input.posts_limit || 50,
          include_stories: input.include_stories || false,
          include_highlights: input.include_highlights || false,
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to create scraping job: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return {
        success: true,
        data: data[0]
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  async getScrapingJobs(filters?: {
    status?: string
    applicant_id?: string
    limit?: number
  }): Promise<ScrapingJob[]> {
    try {
      if (!this.supabaseUrl || !this.supabaseAnonKey) {
        throw new Error('Supabase configuration not found')
      }

      let url = `${this.supabaseUrl}/rest/v1/scraping_jobs?select=*&order=created_at.desc`

      if (filters) {
        if (filters.status) url += `&status=eq.${filters.status}`
        if (filters.applicant_id) url += `&applicant_id=eq.${filters.applicant_id}`
        if (filters.limit) url += `&limit=${filters.limit}`
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.supabaseAnonKey}`,
          'apikey': this.supabaseAnonKey,
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch scraping jobs: ${response.status} ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching scraping jobs:', error)
      return []
    }
  }

  async startScrapingJob(jobId: string): Promise<ScrapingJobResult> {
    try {
      // Get job details
      const job = await this.getJobById(jobId)
      if (!job) {
        throw new Error('Scraping job not found')
      }

      // Update job status to running
      await this.updateJobStatus(jobId, 'running')

      // Start Apify scraping task
      const scrapingResult = await this.executeProfileScraping(job)

      if (scrapingResult.success) {
        // Update job with results
        await this.updateJobResults(jobId, {
          status: 'completed',
          posts_count: scrapingResult.posts_collected,
          new_posts: scrapingResult.new_posts,
          completed_at: new Date().toISOString(),
          last_scraped: new Date().toISOString(),
        })

        // Store scraped data
        if (scrapingResult.profile_data) {
          await this.storeProfileData(job.applicant_id, scrapingResult.profile_data)
        }

        if (scrapingResult.posts.length > 0) {
          await this.storePostsData(job.applicant_id, scrapingResult.posts)
        }

        return { success: true }
      } else {
        // Update job with error
        await this.updateJobStatus(jobId, 'failed', scrapingResult.errors.join(', '))
        return { success: false, error: scrapingResult.errors.join(', ') }
      }
    } catch (error) {
      await this.updateJobStatus(jobId, 'failed', error instanceof Error ? error.message : 'Unknown error')
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  private async getJobById(jobId: string): Promise<ScrapingJob | null> {
    try {
      const response = await fetch(`${this.supabaseUrl}/rest/v1/scraping_jobs?id=eq.${jobId}&select=*`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.supabaseAnonKey}`,
          'apikey': this.supabaseAnonKey,
        }
      })

      if (!response.ok) return null
      const data = await response.json()
      return data[0] || null
    } catch (error) {
      return null
    }
  }

  private async updateJobStatus(jobId: string, status: string, errorMessage?: string): Promise<void> {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    }

    if (status === 'running') {
      updateData.started_at = new Date().toISOString()
    }

    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString()
    }

    if (errorMessage) {
      updateData.error_message = errorMessage
    }

    await fetch(`${this.supabaseUrl}/rest/v1/scraping_jobs?id=eq.${jobId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.supabaseAnonKey}`,
        'apikey': this.supabaseAnonKey,
      },
      body: JSON.stringify(updateData)
    })
  }

  private async updateJobResults(jobId: string, results: {
    status: string
    posts_count: number
    new_posts: number
    completed_at: string
    last_scraped: string
  }): Promise<void> {
    await fetch(`${this.supabaseUrl}/rest/v1/scraping_jobs?id=eq.${jobId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.supabaseAnonKey}`,
        'apikey': this.supabaseAnonKey,
      },
      body: JSON.stringify({
        ...results,
        updated_at: new Date().toISOString(),
      })
    })
  }

  private async executeProfileScraping(job: ScrapingJob): Promise<ScrapingResult> {
    try {
      if (!this.apifyApiKey) {
        throw new Error('Apify API key not configured')
      }

      // Build Instagram profile URL
      const profileUrl = `https://www.instagram.com/${job.instagram_handle}/`

      // Use Apify Instagram scraper
      const response = await fetch('https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync-get-dataset-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: this.apifyApiKey,
          input: {
            urls: [profileUrl],
            resultsType: 'posts',
            resultsLimit: job.posts_limit || 50,
          }
        })
      })

      if (!response.ok) {
        throw new Error(`Apify API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      // Parse Apify response
      const scrapedPosts = this.parseApifyProfileResponse(data)
      const profileData = this.extractProfileData(data, job)

      // Determine new posts (simplified - in real app, check against existing posts)
      const newPosts = scrapedPosts.length

      return {
        success: true,
        posts_collected: scrapedPosts.length,
        new_posts: newPosts,
        profile_data: profileData,
        posts: scrapedPosts,
        errors: []
      }
    } catch (error) {
      return {
        success: false,
        posts_collected: 0,
        new_posts: 0,
        posts: [],
        errors: [error instanceof Error ? error.message : 'Unknown error occurred']
      }
    }
  }

  private parseApifyProfileResponse(data: any[]): ScrapedPost[] {
    const posts: ScrapedPost[] = []

    for (const item of data) {
      try {
        const post = this.parseApifyPostItem(item)
        if (post) {
          posts.push(post)
        }
      } catch (error) {
        console.error('Error parsing post item:', error)
      }
    }

    return posts
  }

  private parseApifyPostItem(item: any): ScrapedPost | null {
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

      return {
        id: `post_${item.id}_${Date.now()}`,
        profile_id: '', // Will be set when storing
        applicant_id: '', // Will be set when storing
        instagram_post_id: item.id,
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
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    } catch (error) {
      console.error('Error parsing Apify post item:', error)
      return null
    }
  }

  private extractProfileData(data: any[], job: ScrapingJob): ScrapedProfile | null {
    try {
      // Find profile info from the first item that contains owner data
      const profileItem = data.find(item => item.owner)
      if (!profileItem || !profileItem.owner) return null

      const owner = profileItem.owner

      return {
        id: `profile_${job.applicant_id}_${Date.now()}`,
        applicant_id: job.applicant_id,
        instagram_handle: job.instagram_handle,
        username: owner.username || job.instagram_handle,
        full_name: owner.fullName || job.applicant_name,
        bio: owner.biography || '',
        followers_count: owner.followersCount || 0,
        following_count: owner.followsCount || 0,
        posts_count: owner.postsCount || 0,
        profile_pic_url: owner.profilePicUrl || '',
        is_private: owner.isPrivate || false,
        is_verified: owner.isVerified || false,
        website: owner.externalUrl,
        last_updated: new Date().toISOString(),
      }
    } catch (error) {
      console.error('Error extracting profile data:', error)
      return null
    }
  }

  private async storeProfileData(applicantId: string, profileData: ScrapedProfile): Promise<void> {
    try {
      await fetch(`${this.supabaseUrl}/rest/v1/scraped_profiles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseAnonKey}`,
          'apikey': this.supabaseAnonKey,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(profileData)
      })
    } catch (error) {
      console.error('Error storing profile data:', error)
    }
  }

  private async storePostsData(applicantId: string, posts: ScrapedPost[]): Promise<void> {
    try {
      // Add applicant_id to all posts
      const postsWithApplicant = posts.map(post => ({
        ...post,
        applicant_id: applicantId,
        profile_id: `profile_${applicantId}`,
      }))

      await fetch(`${this.supabaseUrl}/rest/v1/scraped_posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseAnonKey}`,
          'apikey': this.supabaseAnonKey,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(postsWithApplicant)
      })
    } catch (error) {
      console.error('Error storing posts data:', error)
    }
  }

  async getScrapedProfiles(applicantId?: string): Promise<ScrapedProfile[]> {
    try {
      let url = `${this.supabaseUrl}/rest/v1/scraped_profiles?select=*&order=last_updated.desc`
      if (applicantId) {
        url += `&applicant_id=eq.${applicantId}`
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.supabaseAnonKey}`,
          'apikey': this.supabaseAnonKey,
        }
      })

      if (!response.ok) return []
      return await response.json()
    } catch (error) {
      console.error('Error fetching scraped profiles:', error)
      return []
    }
  }

  async getScrapedPosts(applicantId?: string, limit?: number): Promise<ScrapedPost[]> {
    try {
      let url = `${this.supabaseUrl}/rest/v1/scraped_posts?select=*&order=created_at.desc`
      if (applicantId) {
        url += `&applicant_id=eq.${applicantId}`
      }
      if (limit) {
        url += `&limit=${limit}`
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.supabaseAnonKey}`,
          'apikey': this.supabaseAnonKey,
        }
      })

      if (!response.ok) return []
      return await response.json()
    } catch (error) {
      console.error('Error fetching scraped posts:', error)
      return []
    }
  }

  async deleteScrapingJob(jobId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.supabaseUrl}/rest/v1/scraping_jobs?id=eq.${jobId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.supabaseAnonKey}`,
          'apikey': this.supabaseAnonKey,
        }
      })

      return response.ok
    } catch (error) {
      console.error('Error deleting scraping job:', error)
      return false
    }
  }
}

export const profileScrapingService = new ProfileScrapingService()
export default profileScrapingService