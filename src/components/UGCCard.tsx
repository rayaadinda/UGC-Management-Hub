import { Instagram, Music, Eye } from 'lucide-react'
import { UGCContent } from '@/types'

interface UGCCardProps {
  content: UGCContent
  onViewDetails: (content: UGCContent) => void
}

const statusConfig = {
  new: { label: 'New', color: 'bg-gray-100 text-gray-800 border-gray-200' },
  approved_for_repost: { label: 'Approved', color: 'bg-black text-white border-black' },
  weekly_winner: {
    label: 'Weekly Winner',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800 border-red-200' },
}

const platformIcons = {
  instagram: Instagram,
  tiktok: Music,
}

export function UGCCard({ content, onViewDetails }: UGCCardProps) {
  const PlatformIcon = platformIcons[content.platform]
  const statusInfo = statusConfig[content.status]

  return (
    <div className="group cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-white transition-all duration-300 hover:shadow-lg">
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        {content.media_type === 'image' ? (
          <img
            src={content.thumbnail_url || content.media_url}
            alt={content.caption}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="relative h-full w-full">
            {/* Video Thumbnail */}
            <img
              src={content.thumbnail_url || content.media_url}
              alt={content.caption}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />

            {/* Video Indicator */}
            <div className="absolute bottom-3 right-3">
              <span className="inline-flex items-center rounded bg-black/70 px-2 py-1 text-xs font-medium text-white">
                <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v8a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z" />
                </svg>
                Video
              </span>
            </div>
          </div>
        )}

        {/* Status Badge Overlay */}
        <div className="absolute left-3 top-3">
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusInfo.color}`}
          >
            {statusInfo.label}
          </span>
        </div>

        {/* Platform Icon */}
        <div className="absolute right-3 top-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm">
            <PlatformIcon className="h-4 w-4 text-gray-700" />
          </div>
        </div>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/0 transition-all duration-300 group-hover:bg-black/10" />
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Author */}
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100">
            <PlatformIcon className="h-3 w-3 text-gray-600" />
          </div>
          <span className="text-sm font-semibold text-gray-900">@{content.author_username}</span>
        </div>

        {/* Caption */}
        <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-gray-600">{content.caption}</p>

        {/* Engagement */}
        <div className="mb-4 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <span className="text-red-500">❤️</span>
            <span className="font-medium">{content.likes_count.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-blue-500">💬</span>
            <span className="font-medium">{content.comments_count.toLocaleString()}</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => onViewDetails(content)}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-gray-800"
        >
          <Eye className="h-4 w-4" />
          View Details
        </button>
      </div>
    </div>
  )
}
