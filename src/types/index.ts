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

// TDR Applications Types
export interface TDRApplication {
  id: string
  created_at: string
  full_name: string
  email: string
  phone: string
  instagram_handle: string
  tiktok_username: string
  follower_count: string
  content_focus: string
  why_partner: string
  owns_motorcycle: string
  racing_experience: string
  motorcycle_knowledge: string
  portfolio_url: string
  portfolio_filename: string
  status: 'pending' | 'accepted' | 'declined'
  notes?: string
}

export interface TDRApplicationFilters {
  status?: TDRApplication['status'] | 'all'
  search?: string
  owns_motorcycle?: string | 'all'
  racing_experience?: string | 'all'
}

export type ApplicationStatus = TDRApplication['status']