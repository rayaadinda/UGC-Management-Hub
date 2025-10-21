import { Image, Heart, Users, Award } from 'lucide-react'
import { StatsCard } from './StatsCard'
import { UGCContent } from '@/types'

interface DashboardStatsProps {
  content: UGCContent[]
}

export function DashboardStats({ content }: DashboardStatsProps) {
  const totalContent = content.length
  const images = content.filter(item => item.media_type === 'image').length
  const videos = content.filter(item => item.media_type === 'video').length
  const totalLikes = content.reduce((sum, item) => sum + item.likes_count, 0)
  const totalComments = content.reduce((sum, item) => sum + item.comments_count, 0)

  const statusCounts = content.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const approvedCount = statusCounts.approved_for_repost || 0
  const uniqueAuthors = new Set(content.map(item => item.author_username)).size

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatsCard
        title="Total Content"
        value={totalContent}
        description={`${images} images, ${videos} videos`}
        icon={Image}
        trend={{ value: 12, isPositive: true }}
        className="border-l-4 border-l-blue-500"
      />

      <StatsCard
        title="Approved for Repost"
        value={approvedCount}
        description="Ready to share"
        icon={Award}
        trend={{ value: 8, isPositive: true }}
        className="border-l-4 border-l-green-500"
      />

      <StatsCard
        title="Total Engagement"
        value={totalLikes.toLocaleString()}
        description={`${totalComments.toLocaleString()} comments`}
        icon={Heart}
        trend={{ value: 23, isPositive: true }}
        className="border-l-4 border-l-purple-500"
      />

      <StatsCard
        title="Active Creators"
        value={uniqueAuthors}
        description="Unique contributors"
        icon={Users}
        trend={{ value: 5, isPositive: true }}
        className="border-l-4 border-l-orange-500"
      />
    </div>
  )
}