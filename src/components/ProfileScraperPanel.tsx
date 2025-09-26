import { useState, useEffect } from 'react'
import {
  Loader2,
  Play,
  Pause,
  RefreshCw,
  Instagram,
  Users,
  Database,
  BarChart3,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Settings,
  Eye,
  Trash2,
  Plus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { profileScrapingService, ScrapingJob, CreateScrapingJobInput } from '@/services/profileScraping'
import { toast } from 'sonner'

interface ProfileScraperPanelProps {
  applicantId?: string
  applicantName?: string
  instagramHandle?: string
  showControls?: boolean
  compact?: boolean
}

export function ProfileScraperPanel({
  applicantId,
  applicantName,
  instagramHandle,
  showControls = true,
  compact = false,
}: ProfileScraperPanelProps) {
  const [jobs, setJobs] = useState<ScrapingJob[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [selectedJob, setSelectedJob] = useState<ScrapingJob | null>(null)
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [showAddJob, setShowAddJob] = useState(false)

  // New job form state
  const [newJobHandle, setNewJobHandle] = useState('')
  const [newJobName, setNewJobName] = useState('')
  const [postsLimit, setPostsLimit] = useState(50)
  const [includeStories, setIncludeStories] = useState(false)
  const [includeHighlights, setIncludeHighlights] = useState(false)

  const loadJobs = async () => {
    try {
      setIsRefreshing(true)
      const filters = applicantId ? { applicant_id: applicantId } : undefined
      const jobData = await profileScrapingService.getScrapingJobs(filters)
      setJobs(jobData)
    } catch (error) {
      toast.error('Failed to load scraping jobs')
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadJobs()
  }, [applicantId])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(loadJobs, 30000) // Refresh every 30 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const handleStartJob = async (jobId: string) => {
    setIsLoading(true)
    try {
      const result = await profileScrapingService.startScrapingJob(jobId)
      if (result.success) {
        toast.success('Scraping job started successfully')
        await loadJobs()
      } else {
        toast.error(result.error || 'Failed to start scraping job')
      }
    } catch (error) {
      toast.error('Failed to start scraping job')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddJob = async () => {
    if (!newJobHandle.trim() || !newJobName.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsLoading(true)
    try {
      const input: CreateScrapingJobInput = {
        applicant_id: applicantId || `manual_${Date.now()}`,
        applicant_name: newJobName,
        instagram_handle: newJobHandle,
        posts_limit: postsLimit,
        include_stories: includeStories,
        include_highlights: includeHighlights,
      }

      const result = await profileScrapingService.createScrapingJob(input)
      if (result.success) {
        toast.success('Scraping job created successfully')
        setNewJobHandle('')
        setNewJobName('')
        setShowAddJob(false)
        await loadJobs()
      } else {
        toast.error(result.error || 'Failed to create scraping job')
      }
    } catch (error) {
      toast.error('Failed to create scraping job')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this scraping job?')) return

    setIsLoading(true)
    try {
      const success = await profileScrapingService.deleteScrapingJob(jobId)
      if (success) {
        toast.success('Scraping job deleted successfully')
        await loadJobs()
      } else {
        toast.error('Failed to delete scraping job')
      }
    } catch (error) {
      toast.error('Failed to delete scraping job')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        )
      case 'running':
        return (
          <Badge variant="default" className="bg-blue-100 text-blue-800">
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            Running
          </Badge>
        )
      case 'completed':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="mr-1 h-3 w-3" />
            Completed
          </Badge>
        )
      case 'failed':
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800">
            <XCircle className="mr-1 h-3 w-3" />
            Failed
          </Badge>
        )
      case 'paused':
        return (
          <Badge variant="outline">
            <Pause className="mr-1 h-3 w-3" />
            Paused
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const stats = {
    total: jobs.length,
    running: jobs.filter(j => j.status === 'running').length,
    completed: jobs.filter(j => j.status === 'completed').length,
    failed: jobs.filter(j => j.status === 'failed').length,
    totalPosts: jobs.reduce((sum, job) => sum + job.posts_count, 0),
    newPosts: jobs.reduce((sum, job) => sum + job.new_posts, 0),
  }

  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Instagram className="h-5 w-5 text-pink-500" />
            Profile Scraper
          </CardTitle>
          <CardDescription>
            {instagramHandle ? `@${instagramHandle}` : 'Instagram profile scraping'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-2">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{stats.running}</p>
              <p className="text-xs text-gray-600">Running</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              <p className="text-xs text-gray-600">Completed</p>
            </div>
          </div>

          {/* Latest Job */}
          {jobs.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Latest Job</span>
                {getStatusBadge(jobs[0].status)}
              </div>
              <div className="text-xs text-gray-500">
                {jobs[0].posts_count} posts collected
              </div>
            </div>
          )}

          {/* Actions */}
          {showControls && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={loadJobs}
                disabled={isRefreshing}
                className="flex-1"
              >
                <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              {applicantId && applicantName && instagramHandle && (
                <Button
                  size="sm"
                  onClick={() => {
                    setNewJobHandle(instagramHandle)
                    setNewJobName(applicantName)
                    setShowAddJob(true)
                  }}
                  className="flex-1"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Instagram Profile Scraper</h2>
          <p className="text-gray-600">
            {applicantName ? `Scraping jobs for ${applicantName}` : 'Manage Instagram profile scraping jobs'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {showControls && (
            <>
              <div className="flex items-center space-x-2">
                <Switch
                  id="auto-refresh"
                  checked={autoRefresh}
                  onCheckedChange={setAutoRefresh}
                />
                <Label htmlFor="auto-refresh" className="text-sm">Auto Refresh</Label>
              </div>
              <Dialog open={showAddJob} onOpenChange={setShowAddJob}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Job
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Scraping Job</DialogTitle>
                    <DialogDescription>
                      Create a new Instagram profile scraping job
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="job-name">Applicant Name</Label>
                      <Input
                        id="job-name"
                        value={newJobName}
                        onChange={(e) => setNewJobName(e.target.value)}
                        placeholder="Enter applicant name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="job-handle">Instagram Handle</Label>
                      <Input
                        id="job-handle"
                        value={newJobHandle}
                        onChange={(e) => setNewJobHandle(e.target.value)}
                        placeholder="@username"
                      />
                    </div>
                    <div>
                      <Label htmlFor="posts-limit">Posts Limit</Label>
                      <Select value={postsLimit.toString()} onValueChange={(value) => setPostsLimit(parseInt(value))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10 posts</SelectItem>
                          <SelectItem value="25">25 posts</SelectItem>
                          <SelectItem value="50">50 posts</SelectItem>
                          <SelectItem value="100">100 posts</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="include-stories"
                        checked={includeStories}
                        onCheckedChange={setIncludeStories}
                      />
                      <Label htmlFor="include-stories">Include Stories</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="include-highlights"
                        checked={includeHighlights}
                        onCheckedChange={setIncludeHighlights}
                      />
                      <Label htmlFor="include-highlights">Include Highlights</Label>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleAddJob} disabled={isLoading || !newJobHandle.trim() || !newJobName.trim()}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Job'}
                      </Button>
                      <Button variant="outline" onClick={() => setShowAddJob(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="outline" onClick={loadJobs} disabled={isRefreshing}>
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
        <Card>
          <CardContent className="p-4 text-center">
            <Database className="mx-auto mb-2 h-6 w-6 text-blue-600" />
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-xs text-gray-600">Total Jobs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Loader2 className="mx-auto mb-2 h-6 w-6 text-blue-600 animate-spin" />
            <p className="text-2xl font-bold text-blue-600">{stats.running}</p>
            <p className="text-xs text-gray-600">Running</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="mx-auto mb-2 h-6 w-6 text-green-600" />
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            <p className="text-xs text-gray-600">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <XCircle className="mx-auto mb-2 h-6 w-6 text-red-600" />
            <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
            <p className="text-xs text-gray-600">Failed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <BarChart3 className="mx-auto mb-2 h-6 w-6 text-purple-600" />
            <p className="text-2xl font-bold text-gray-900">{stats.totalPosts}</p>
            <p className="text-xs text-gray-600">Total Posts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="mx-auto mb-2 h-6 w-6 text-green-600" />
            <p className="text-2xl font-bold text-green-600">{stats.newPosts}</p>
            <p className="text-xs text-gray-600">New Posts</p>
          </CardContent>
        </Card>
      </div>

      {/* Jobs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Scraping Jobs</CardTitle>
          <CardDescription>
            Active and completed Instagram profile scraping jobs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <div className="text-center py-8">
              <Instagram className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <h3 className="mb-2 text-lg font-medium text-gray-900">No scraping jobs found</h3>
              <p className="text-gray-600">
                {showControls ? 'Create your first scraping job to get started' : 'No jobs available for this applicant'}
              </p>
              {showControls && (
                <Button className="mt-4" onClick={() => setShowAddJob(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Job
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Instagram Handle</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Posts</TableHead>
                    <TableHead>New</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium">{job.applicant_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Instagram className="h-4 w-4 text-pink-500" />
                          @{job.instagram_handle}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(job.status)}</TableCell>
                      <TableCell>{job.posts_count}</TableCell>
                      <TableCell>{job.new_posts}</TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-500">
                          {job.last_scraped
                            ? new Date(job.last_scraped).toLocaleDateString()
                            : job.started_at
                            ? new Date(job.started_at).toLocaleDateString()
                            : 'Never'
                          }
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {job.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => handleStartJob(job.id)}
                              disabled={isLoading}
                            >
                              <Play className="h-3 w-3" />
                            </Button>
                          )}
                          {job.status === 'running' && (
                            <Button size="sm" variant="outline" disabled>
                              <Pause className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedJob(job)
                            }}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteJob(job.id)}
                            disabled={isLoading}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Job Details */}
      {selectedJob && (
        <Card>
          <CardHeader>
            <CardTitle>Job Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Applicant</Label>
                <p className="text-sm text-gray-600">{selectedJob.applicant_name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Instagram Handle</Label>
                <p className="text-sm text-gray-600">@{selectedJob.instagram_handle}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Status</Label>
                <div>{getStatusBadge(selectedJob.status)}</div>
              </div>
              <div>
                <Label className="text-sm font-medium">Posts Collected</Label>
                <p className="text-sm text-gray-600">{selectedJob.posts_count}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">New Posts</Label>
                <p className="text-sm text-gray-600">{selectedJob.new_posts}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Started At</Label>
                <p className="text-sm text-gray-600">
                  {selectedJob.started_at
                    ? new Date(selectedJob.started_at).toLocaleString()
                    : 'Not started'
                  }
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Completed At</Label>
                <p className="text-sm text-gray-600">
                  {selectedJob.completed_at
                    ? new Date(selectedJob.completed_at).toLocaleString()
                    : 'Not completed'
                  }
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Last Scraped</Label>
                <p className="text-sm text-gray-600">
                  {selectedJob.last_scraped
                    ? new Date(selectedJob.last_scraped).toLocaleString()
                    : 'Never'
                  }
                </p>
              </div>
            </div>

            {selectedJob.error_message && (
              <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{selectedJob.error_message}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}