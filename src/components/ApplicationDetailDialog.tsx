import { useState } from 'react'
import {
  X,
  Mail,
  Phone,
  Instagram,
  Calendar,
  Bike,
  Trophy,
  FileText,
  ExternalLink,
  CheckCircle,
  XCircle,
  MessageSquare,
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useUpdateApplicationStatus } from '@/hooks/useTDRApplications'
import { TDRApplication } from '@/types'
import { toast } from 'sonner'

interface ApplicationDetailDialogProps {
  application: TDRApplication | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ApplicationDetailDialog({
  application,
  open,
  onOpenChange,
}: ApplicationDetailDialogProps) {
  const [notes, setNotes] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const updateStatus = useUpdateApplicationStatus()

  if (!application) return null

  const handleStatusUpdate = async (status: TDRApplication['status']) => {
    setIsUpdating(true)
    try {
      await updateStatus.mutateAsync({
        id: application.id,
        status,
        notes: notes || undefined,
      })
      toast.success(`Application ${status === 'approved' ? 'approved' : 'rejected'} successfully`)
      onOpenChange(false)
    } catch (error) {
      toast.error('Failed to update application status')
    } finally {
      setIsUpdating(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Pending Review
          </Badge>
        )
      case 'approved':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Approved
          </Badge>
        )
      case 'rejected':
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800">
            Rejected
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                  {getInitials(application.full_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-semibold">{application.full_name}</h2>
                <p className="text-sm text-gray-500">
                  Applied on {new Date(application.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            {getStatusBadge(application.status)}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div className="space-y-4">
            <h3 className="border-b pb-2 text-lg font-semibold">Personal Information</h3>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{application.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{application.phone}</p>
                </div>
              </div>
            </div>
          </div>

                    <div className="space-y-4">
            <h3 className="border-b pb-2 text-lg font-semibold">Social Media</h3>

            <div className="space-y-3">
              {application.instagram_handle && (
                <div className="flex items-center gap-3">
                  <Instagram className="h-5 w-5 text-pink-500" />
                  <div>
                    <p className="text-sm text-gray-500">Instagram</p>
                    <a
                      href={application.instagram_handle}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 font-medium text-blue-600 hover:underline"
                    >
                      {application.instagram_handle}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              )}

              {application.tiktok_username && (
                <div className="flex items-center gap-3">
                  <div className="flex h-5 w-5 items-center justify-center rounded bg-black text-xs text-white">
                    TT
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">TikTok</p>
                    <p className="font-medium">@{application.tiktok_username}</p>
                  </div>
                </div>
              )}

              {application.follower_count && (
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-sm text-gray-500">Total Followers</p>
                  <p className="text-lg font-bold text-blue-600">{application.follower_count}</p>
                </div>
              )}
            </div>
          </div>

                    <div className="space-y-4">
            <h3 className="border-b pb-2 text-lg font-semibold">Experience & Background</h3>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Bike className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Owns Motorcycle</p>
                  <Badge variant={application.owns_motorcycle === 'Yes' ? 'default' : 'secondary'}>
                    {application.owns_motorcycle}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Trophy className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Racing Experience</p>
                  <p className="font-medium">{application.racing_experience || 'Not specified'}</p>
                </div>
              </div>

              <div>
                <p className="mb-1 text-sm text-gray-500">Motorcycle Knowledge Level</p>
                <Badge variant="outline">
                  {application.motorcycle_knowledge || 'Not specified'}
                </Badge>
              </div>
            </div>
          </div>

                    <div className="space-y-4">
            <h3 className="border-b pb-2 text-lg font-semibold">Content Focus</h3>

            {application.content_focus && (
              <div className="rounded-lg bg-blue-50 p-3">
                <p className="whitespace-pre-wrap text-sm text-blue-600">
                  {application.content_focus}
                </p>
              </div>
            )}
          </div>

                    <div className="space-y-4 lg:col-span-2">
            <h3 className="border-b pb-2 text-lg font-semibold">Why Partner with TDR Racing?</h3>

            {application.why_partner && (
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="whitespace-pre-wrap">{application.why_partner}</p>
              </div>
            )}
          </div>

                    {application.portfolio_url && (
            <div className="space-y-4 lg:col-span-2">
              <h3 className="border-b pb-2 text-lg font-semibold">Portfolio</h3>

              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-gray-400" />
                <a
                  href={application.portfolio_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-600 hover:underline"
                >
                  {application.portfolio_filename || 'View Portfolio'}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          )}

                    <div className="space-y-4 lg:col-span-2">
            <h3 className="border-b pb-2 text-lg font-semibold">Admin Notes</h3>

            {application.notes && (
              <div className="mb-3 rounded-lg bg-yellow-50 p-3">
                <p className="text-sm text-yellow-800">{application.notes}</p>
              </div>
            )}

            <div>
              <Label htmlFor="notes">Add Notes (optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add internal notes about this application..."
                rows={3}
              />
            </div>
          </div>
        </div>

                {application.status === 'pending' && (
          <div className="flex gap-3 border-t pt-6">
            <Button
              onClick={() => handleStatusUpdate('approved')}
              disabled={isUpdating}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Approve Application
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleStatusUpdate('rejected')}
              disabled={isUpdating}
              className="flex-1"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Reject Application
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
