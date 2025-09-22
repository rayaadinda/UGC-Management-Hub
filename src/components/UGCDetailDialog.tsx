import { useState } from 'react'
import { ExternalLink, Instagram, Music, Heart, MessageCircle, Calendar } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UGCContent } from '@/types'
import { useUpdateUGCStatus } from '@/hooks/useUGCContent'

interface UGCDetailDialogProps {
  content: UGCContent | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const statusConfig = {
  new: { label: 'New', variant: 'default' as const },
  approved_for_repost: { label: 'Approved for Repost', variant: 'secondary' as const },
  weekly_winner: { label: 'Weekly Winner', variant: 'default' as const },
  rejected: { label: 'Rejected', variant: 'destructive' as const },
}

const platformIcons = {
  instagram: Instagram,
  tiktok: Music,
}

export function UGCDetailDialog({ content, open, onOpenChange }: UGCDetailDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState(content?.status || 'new')
  const updateStatus = useUpdateUGCStatus()

  if (!content) return null

  const PlatformIcon = platformIcons[content.platform]
  const currentStatusInfo = statusConfig[content.status]

  const handleStatusChange = async (newStatus: UGCContent['status']) => {
    setSelectedStatus(newStatus)
    await updateStatus.mutateAsync({ id: content.id, status: newStatus })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlatformIcon className="h-5 w-5" />
            Content Details - @{content.author_username}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
              {content.media_type === 'image' ? (
                <img
                  src={content.thumbnail_url || content.media_url}
                  alt={content.caption}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    if (!target.src.includes('picsum.photos')) {
                      target.src = `https://picsum.photos/seed/instagram_${content.id}/400/400.jpg`
                    }
                  }}
                />
              ) : (
                <div className="w-full h-full relative">
                  {/* Video Thumbnail */}
                  <img
                    src={content.thumbnail_url || content.media_url}
                    alt={content.caption}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      if (!target.src.includes('picsum.photos')) {
                        target.src = `https://picsum.photos/seed/video_${content.id}/400/400.jpg`
                      }
                    }}
                  />

                  {/* Video Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <div className="w-20 h-20 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <svg className="w-10 h-10 text-gray-800 ml-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                      </svg>
                    </div>
                  </div>

                  {/* View Video Button */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="bg-white/90 hover:bg-white text-gray-800"
                      onClick={() => window.open(content.content_url, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Video on Instagram
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => window.open(content.content_url, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Original Post
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Content Information</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <PlatformIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Platform:</span>
                  <span className="font-medium capitalize">{content.platform}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Posted:</span>
                  <span className="font-medium">{formatDate(content.created_at)}</span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Likes:</span>
                    <span className="font-medium">{content.likes_count.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Comments:</span>
                    <span className="font-medium">{content.comments_count.toLocaleString()}</span>
                  </div>
                </div>

                <div>
                  <span className="text-sm text-gray-600">Current Status:</span>
                  <div className="mt-1">
                    <Badge variant={currentStatusInfo.variant}>
                      {currentStatusInfo.label}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Caption</h3>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {content.caption}
              </p>
            </div>

            {content.hashtags.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Hashtags</h3>
                <div className="flex flex-wrap gap-2">
                  {content.hashtags.map((hashtag, index) => (
                    <Badge key={index} variant="outline">
                      #{hashtag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-lg font-semibold mb-3">Update Status</h3>
              <Select value={selectedStatus} onValueChange={handleStatusChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="approved_for_repost">Approved for Repost</SelectItem>
                  <SelectItem value="weekly_winner">Weekly Winner</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              {updateStatus.isPending && (
                <p className="text-sm text-gray-500 mt-2">Updating status...</p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}