export interface UGCContent {
  id: string
  platform: 'instagram' | 'tiktok'
  author_username: string
  content_url: string
  media_type: 'image' | 'video'
  media_url: string
  thumbnail_url?: string
  caption: string
  likes_count: number
  comments_count: number
  hashtags: string[]
  status: 'new' | 'approved_for_repost' | 'weekly_winner' | 'rejected'
  created_at: string
  updated_at: string
}

export interface UGCContentFilters {
  status?: UGCContent['status'] | 'all'
  platform?: UGCContent['platform'] | 'all'
  search?: string
}

export type ContentStatus = UGCContent['status']