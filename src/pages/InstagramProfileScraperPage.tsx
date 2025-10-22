import { useState, useEffect } from 'react'
import {
  Loader2,
  Search,
  Instagram,
  RefreshCw,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  Clock,
  Database,
  BarChart3,
  Calendar,
  Hash,
  Image,
  Video,
  Heart,
  MessageCircle,
  ExternalLink,
  Plus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

interface ScrapingJob {
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
}

interface ScrapedProfile {
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
  last_updated: string
}

interface ScrapedPost {
  id: string
  profile_id: string
  instagram_post_id: string
  caption: string
  media_url: string
  media_type: 'image' | 'video'
  permalink: string
  timestamp: string
  likes_count: number
  comments_count: number
  hashtags: string[]
  status: 'new' | 'approved_for_repost' | 'weekly_winner' | 'rejected'
  created_at: string
}

export function InstagramProfileScraperPage() {
  const [jobs, setJobs] = useState<ScrapingJob[]>([])
  const [profiles, setProfiles] = useState<ScrapedProfile[]>([])
  const [posts, setPosts] = useState<ScrapedPost[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'pending' | 'running' | 'completed' | 'failed'
  >('all')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [selectedJob, setSelectedJob] = useState<ScrapingJob | null>(null)
  const [isJobDetailsOpen, setIsJobDetailsOpen] = useState(false)
  const [showAddJobDialog, setShowAddJobDialog] = useState(false)
  const [newJobHandle, setNewJobHandle] = useState('')

  // Mock data for development
  useEffect(() => {
    const mockJobs: ScrapingJob[] = [
      {
        id: '1',
        applicant_id: 'app1',
        applicant_name: 'John Rider',
        instagram_handle: 'johnrider',
        status: 'completed',
        posts_count: 45,
        new_posts: 12,
        started_at: '2024-01-15T10:30:00Z',
        completed_at: '2024-01-15T11:15:00Z',
        last_scraped: '2024-01-15T11:15:00Z',
      },
      {
        id: '2',
        applicant_id: 'app2',
        applicant_name: 'Sarah Speed',
        instagram_handle: 'sarahspeed',
        status: 'running',
        posts_count: 0,
        new_posts: 0,
        started_at: '2024-01-15T11:00:00Z',
      },
      {
        id: '3',
        applicant_id: 'app3',
        applicant_name: 'Mike Turbo',
        instagram_handle: 'miketurbo',
        status: 'pending',
        posts_count: 0,
        new_posts: 0,
      },
    ]
    setJobs(mockJobs)

    const mockProfiles: ScrapedProfile[] = [
      {
        id: '1',
        applicant_id: 'app1',
        instagram_handle: 'johnrider',
        username: 'johnrider',
        full_name: 'John Rider',
        bio: 'Motorcycle enthusiast | Racing lover | Speed addict 🏍️',
        followers_count: 15420,
        following_count: 890,
        posts_count: 342,
        profile_pic_url: 'https://via.placeholder.com/150',
        is_private: false,
        is_verified: false,
        last_updated: '2024-01-15T11:15:00Z',
      },
    ]
    setProfiles(mockProfiles)

    const mockPosts: ScrapedPost[] = [
      {
        id: '1',
        profile_id: '1',
        instagram_post_id: 'post1',
        caption: 'Amazing ride today! #motorcycle #speed #racing',
        media_url: 'https://via.placeholder.com/600x400',
        media_type: 'image',
        permalink: 'https://instagram.com/p/post1',
        timestamp: '2024-01-14T15:30:00Z',
        likes_count: 234,
        comments_count: 45,
        hashtags: ['motorcycle', 'speed', 'racing'],
        status: 'new',
        created_at: '2024-01-15T11:15:00Z',
      },
    ]
    setPosts(mockPosts)
  }, [])

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.applicant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.instagram_handle.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter
    return matchesSearch && matchesStatus
  })

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

  const handleStartJob = async (jobId: string) => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setJobs((prev) =>
        prev.map((job) =>
          job.id === jobId
            ? { ...job, status: 'running' as const, started_at: new Date().toISOString() }
            : job
        )
      )
      toast.success('Scraping job started')
    } catch (error) {
      toast.error('Failed to start scraping job')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePauseJob = async (jobId: string) => {
    setIsLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 500))
      setJobs((prev) =>
        prev.map((job) => (job.id === jobId ? { ...job, status: 'paused' as const } : job))
      )
      toast.success('Scraping job paused')
    } catch (error) {
      toast.error('Failed to pause scraping job')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddJob = async () => {
    if (!newJobHandle.trim()) return

    setIsLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      const newJob: ScrapingJob = {
        id: Date.now().toString(),
        applicant_id: 'new_app',
        applicant_name: newJobHandle,
        instagram_handle: newJobHandle.replace('@', ''),
        status: 'pending',
        posts_count: 0,
        new_posts: 0,
      }
      setJobs((prev) => [newJob, ...prev])
      setNewJobHandle('')
      setShowAddJobDialog(false)
      toast.success('New scraping job added')
    } catch (error) {
      toast.error('Failed to add scraping job')
    } finally {
      setIsLoading(false)
    }
  }

  const stats = {
    totalJobs: jobs.length,
    runningJobs: jobs.filter((j) => j.status === 'running').length,
    completedJobs: jobs.filter((j) => j.status === 'completed').length,
    failedJobs: jobs.filter((j) => j.status === 'failed').length,
    totalPosts: jobs.reduce((sum, job) => sum + job.posts_count, 0),
    newPosts: jobs.reduce((sum, job) => sum + job.new_posts, 0),
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header Section */}
      <div className="border-b border-white/20 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="flex items-center space-x-3">
              <div className="rounded-2xl bg-gradient-to-r from-pink-600 to-purple-600 p-3 shadow-lg">
                <Instagram className="h-8 w-8 text-white" />
              </div>
              <h1 className="bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-3xl font-bold sm:text-4xl">
                Instagram Profile Scraper
              </h1>
            </div>
            <p className="max-w-2xl text-lg text-gray-600">
              Scrape Instagram profiles from approved TDR applicants
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Stats Overview */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <Card className="border-white/20 bg-white/60 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <Database className="mx-auto mb-2 h-6 w-6 text-blue-600" />
              <p className="text-2xl font-bold text-gray-900">{stats.totalJobs}</p>
              <p className="text-xs text-gray-600">Total Jobs</p>
            </CardContent>
          </Card>

          <Card className="border-white/20 bg-white/60 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-blue-600" />
              <p className="text-2xl font-bold text-blue-600">{stats.runningJobs}</p>
              <p className="text-xs text-gray-600">Running</p>
            </CardContent>
          </Card>

          <Card className="border-white/20 bg-white/60 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <CheckCircle className="mx-auto mb-2 h-6 w-6 text-green-600" />
              <p className="text-2xl font-bold text-green-600">{stats.completedJobs}</p>
              <p className="text-xs text-gray-600">Completed</p>
            </CardContent>
          </Card>

          <Card className="border-white/20 bg-white/60 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <XCircle className="mx-auto mb-2 h-6 w-6 text-red-600" />
              <p className="text-2xl font-bold text-red-600">{stats.failedJobs}</p>
              <p className="text-xs text-gray-600">Failed</p>
            </CardContent>
          </Card>

          <Card className="border-white/20 bg-white/60 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <BarChart3 className="mx-auto mb-2 h-6 w-6 text-purple-600" />
              <p className="text-2xl font-bold text-gray-900">{stats.totalPosts}</p>
              <p className="text-xs text-gray-600">Total Posts</p>
            </CardContent>
          </Card>

          <Card className="border-white/20 bg-white/60 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <Hash className="mx-auto mb-2 h-6 w-6 text-green-600" />
              <p className="text-2xl font-bold text-green-600">{stats.newPosts}</p>
              <p className="text-xs text-gray-600">New Posts</p>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
              <Input
                placeholder="Search by name or handle..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 sm:w-64"
              />
            </div>

            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Switch id="auto-refresh" checked={autoRefresh} onCheckedChange={setAutoRefresh} />
              <Label htmlFor="auto-refresh" className="text-sm">
                Auto Refresh
              </Label>
            </div>

            <Dialog open={showAddJobDialog} onOpenChange={setShowAddJobDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Job
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Scraping Job</DialogTitle>
                  <DialogDescription>
                    Enter the Instagram handle to scrape profile data
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="instagram-handle">Instagram Handle</Label>
                    <Input
                      id="instagram-handle"
                      placeholder="@username"
                      value={newJobHandle}
                      onChange={(e) => setNewJobHandle(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddJob} disabled={isLoading || !newJobHandle.trim()}>
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Job'}
                    </Button>
                    <Button variant="outline" onClick={() => setShowAddJobDialog(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="outline" onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="jobs" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="jobs">Scraping Jobs</TabsTrigger>
            <TabsTrigger value="profiles">Profiles</TabsTrigger>
            <TabsTrigger value="posts">Scraped Posts</TabsTrigger>
          </TabsList>

          <TabsContent value="jobs">
            <Card className="border-white/20 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Scraping Jobs Queue</CardTitle>
                <CardDescription>
                  Manage Instagram profile scraping jobs and monitor their progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Applicant</TableHead>
                        <TableHead>Instagram Handle</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Posts</TableHead>
                        <TableHead>New</TableHead>
                        <TableHead>Started</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredJobs.map((job) => (
                        <TableRow key={job.id}>
                          <TableCell className="font-medium">{job.applicant_name}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Instagram className="h-4 w-4 text-pink-500" />@{job.instagram_handle}
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(job.status)}</TableCell>
                          <TableCell>{job.posts_count}</TableCell>
                          <TableCell>{job.new_posts}</TableCell>
                          <TableCell>
                            {job.started_at ? (
                              <div className="flex items-center gap-1 text-sm text-gray-500">
                                <Calendar className="h-3 w-3" />
                                {new Date(job.started_at).toLocaleDateString()}
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
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
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handlePauseJob(job.id)}
                                  disabled={isLoading}
                                >
                                  <Pause className="h-3 w-3" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedJob(job)
                                  setIsJobDetailsOpen(true)
                                }}
                              ></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profiles">
            <Card className="border-white/20 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Scraped Profiles</CardTitle>
                <CardDescription>
                  Instagram profiles that have been successfully scraped
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {profiles.map((profile) => (
                    <Card key={profile.id} className="border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <img
                            src={profile.profile_pic_url}
                            alt={profile.full_name}
                            className="h-12 w-12 rounded-full"
                          />
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate font-semibold">{profile.full_name}</h3>
                            <p className="text-sm text-gray-500">@{profile.username}</p>
                            <div className="mt-1 flex items-center gap-2">
                              <Badge variant={profile.is_verified ? 'default' : 'secondary'}>
                                {profile.followers_count.toLocaleString()} followers
                              </Badge>
                              {profile.is_private && <Badge variant="outline">Private</Badge>}
                            </div>
                          </div>
                        </div>
                        <p className="mt-2 line-clamp-2 text-sm text-gray-600">{profile.bio}</p>
                        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                          <span>{profile.posts_count} posts</span>
                          <span>Updated {new Date(profile.last_updated).toLocaleDateString()}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="posts">
            <Card className="border-white/20 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Scraped Posts</CardTitle>
                <CardDescription>Instagram posts collected from scraped profiles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {posts.map((post) => (
                    <Card key={post.id} className="border-gray-200">
                      <CardContent className="p-4">
                        <div className="mb-3 flex aspect-square items-center justify-center rounded-lg bg-gray-100">
                          {post.media_type === 'video' ? (
                            <Video className="h-8 w-8 text-gray-400" />
                          ) : (
                            <Image className="h-8 w-8 text-gray-400" />
                          )}
                        </div>
                        <p className="mb-2 line-clamp-3 text-sm">{post.caption}</p>
                        <div className="mb-2 flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            {post.likes_count}
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            {post.comments_count}
                          </div>
                        </div>
                        <div className="mb-2 flex flex-wrap gap-1">
                          {post.hashtags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge variant={post.status === 'new' ? 'secondary' : 'default'}>
                            {post.status}
                          </Badge>
                          <a
                            href={post.permalink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Job Details Dialog */}
      <Dialog open={isJobDetailsOpen} onOpenChange={setIsJobDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Job Details</DialogTitle>
          </DialogHeader>
          {selectedJob && (
            <div className="space-y-4">
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
                  <Label className="text-sm font-medium">Last Scraped</Label>
                  <p className="text-sm text-gray-600">
                    {selectedJob.last_scraped
                      ? new Date(selectedJob.last_scraped).toLocaleString()
                      : 'Never'}
                  </p>
                </div>
              </div>

              {selectedJob.error_message && (
                <Alert variant="destructive">
                  <AlertDescription>{selectedJob.error_message}</AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
