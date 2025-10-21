import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Loader2,
  CheckCircle,
  XCircle,
  Hash,
  Sparkles,
  Zap,
  BarChart3,
  Clock,
  Link,
  Users,
  PlayCircle,
  PauseCircle,
  AlertTriangle,
  TrendingUp,
  Target,
  Layers,
  Rocket,
} from 'lucide-react'
import { scrapeByHashtags, scrapeByUrls, ScrapeResult, ProgressCallback } from '@/services/apify'
import { cn } from '@/lib/utils'

const AVAILABLE_HASHTAGS = [
  'ridetothrive',
  'mitra2000',
  'motorcyclespecialist',
  'tdr',
  'oneteamstore',
  'highperformancezone',
  'hpzcrew',
  'hpz',
]

interface CollectionProgress {
  step: string
  percentage: number
  current?: number
  total?: number
  message?: string
  timestamp: number
}

interface CollectionStats {
  totalPosts: number
  newPosts: number
  status: 'success' | 'error' | 'processing'
  lastRun: string
  errors: number
  processingTime?: number
}

export function InstagramCollectionPage() {
  const [activeTab, setActiveTab] = useState<'hashtags' | 'profiles' | 'urls'>('hashtags')
  const [isLoading, setIsLoading] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  // Hashtag collection state
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>([])
  const [customHashtags, setCustomHashtags] = useState('')

  // Profile collection state
  const [profileUrls, setProfileUrls] = useState('')

  // URL collection state
  const [postUrls, setPostUrls] = useState('')

  // Progress and results state
  const [progress, setProgress] = useState<CollectionProgress | null>(null)
  const [lastResult, setLastResult] = useState<ScrapeResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Advanced options
  const [resultsLimit, setResultsLimit] = useState(50)

  const progressCallback: ProgressCallback = useCallback((progress) => {
    setProgress({ ...progress, timestamp: Date.now() })
  }, [])

  const handleCollection = async () => {
    setIsLoading(true)
    setError(null)
    setProgress(null)

    try {
      let result: ScrapeResult

      // Prepare input based on active tab
      switch (activeTab) {
        case 'hashtags':
          const hashtags = [
            ...selectedHashtags,
            ...customHashtags
              .split(',')
              .map((h) => h.trim())
              .filter((h) => h),
          ]
          if (hashtags.length === 0) {
            setError('Please select at least one hashtag')
            setIsLoading(false)
            return
          }

          result = await scrapeByHashtags(hashtags, {
            resultsLimit,
            onProgress: progressCallback,
          })
          break

        case 'profiles':
          const profiles = profileUrls
            .split('\n')
            .map((p) => p.trim())
            .filter((p) => p)
          if (profiles.length === 0) {
            setError('Please enter at least one profile URL')
            setIsLoading(false)
            return
          }

          result = await scrapeByUrls(profiles, {
            resultsLimit,
            onProgress: progressCallback,
          })
          break

        case 'urls':
          const urls = postUrls
            .split('\n')
            .map((u) => u.trim())
            .filter((u) => u)
          if (urls.length === 0) {
            setError('Please enter at least one post URL')
            setIsLoading(false)
            return
          }

          result = await scrapeByUrls(urls, {
            resultsLimit,
            onProgress: progressCallback,
          })
          break

        default:
          setError('Invalid tab selected')
          setIsLoading(false)
          return
      }

      setLastResult(result)

      if (!result.success && result.errors.length > 0) {
        setError(result.errors.join(', '))
      }
    } catch (err) {
      console.error('Collection error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred during collection')
    } finally {
      setIsLoading(false)
      setProgress(null)
    }
  }

  const handlePauseResume = () => {
    setIsPaused(!isPaused)
  }

  const stats: CollectionStats | null = lastResult
    ? {
        totalPosts: lastResult.postsCollected,
        newPosts: lastResult.newPostsAdded,
        status: isLoading ? 'processing' : lastResult.success ? 'success' : 'error',
        lastRun: lastResult.timestamp,
        errors: lastResult.errors.length,
      }
    : null

  const toggleHashtag = (hashtag: string) => {
    setSelectedHashtags((prev) =>
      prev.includes(hashtag) ? prev.filter((h) => h !== hashtag) : [...prev, hashtag]
    )
  }

  return (
    <div className="container mx-auto max-w-7xl space-y-8 p-4">
      {/* Enhanced Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-3">
              <Rocket className="h-8 w-8 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent" />
            </div>
            <div>
              <h1 className="bg-clip-text text-4xl font-bold tracking-tight text-black">
                Instagram Content Hub
              </h1>
              <p className="text-lg text-muted-foreground">
                Advanced content discovery with AI-powered scraping and real-time processing
              </p>
            </div>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <Badge variant="outline" className="text-xs">
              <TrendingUp className="mr-1 h-3 w-3" />
              Enhanced V2
            </Badge>
          </div>
        </div>
      </div>

      {/* Real-time Progress Display */}
      {progress && (
        <Card className="border-l-4 border-l-blue-500 bg-blue-50/50">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-blue-100 p-2">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900">{progress.step}</h3>
                  <p className="text-sm text-blue-700">{progress.message}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">{progress.percentage}%</p>
                {progress.current && progress.total && (
                  <p className="text-sm text-blue-600">
                    {progress.current} / {progress.total}
                  </p>
                )}
              </div>
            </div>
            <Progress value={progress.percentage} className="h-2 bg-blue-100" />
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Posts</p>
                  <p className="text-3xl font-bold">{stats.totalPosts}</p>
                </div>
                <div className="rounded-full bg-blue-100 p-3">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 h-20 w-20 rounded-full bg-blue-50" />
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">New Posts</p>
                  <p className="text-3xl font-bold text-green-600">{stats.newPosts}</p>
                </div>
                <div className="rounded-full bg-green-100 p-3">
                  <Sparkles className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 h-20 w-20 rounded-full bg-green-50" />
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <div className="mt-1 flex items-center gap-2">
                    {stats.status === 'success' ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : stats.status === 'processing' ? (
                      <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className="text-lg font-semibold capitalize">{stats.status}</span>
                  </div>
                </div>
                <div className="rounded-full bg-gray-100 p-3">
                  <Zap className="h-6 w-6 text-gray-600" />
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 h-20 w-20 rounded-full bg-gray-50" />
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Processing Time</p>
                  <p className="text-2xl font-bold">
                    {stats.processingTime ? `${(stats.processingTime / 1000).toFixed(1)}s` : '--'}
                  </p>
                </div>
                <div className="rounded-full bg-purple-100 p-3">
                  <Clock className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 h-20 w-20 rounded-full bg-purple-50" />
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Errors</p>
                  <p className="text-2xl font-bold text-red-600">{stats.errors}</p>
                </div>
                <div className="rounded-full bg-red-100 p-3">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 h-20 w-20 rounded-full bg-red-50" />
            </CardContent>
          </Card>
        </div>
      )}

      <div className={cn('space-y-8', 'hidden lg:block')}>
        {/* Main Collection Interface */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* Collection Tabs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Content Collection
                </CardTitle>
                <CardDescription>
                  Choose your collection method and configure parameters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs
                  value={activeTab}
                  onValueChange={(value) => setActiveTab(value as any)}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="hashtags" className="flex items-center gap-2">
                      <Hash className="h-4 w-4" />
                      Hashtags
                    </TabsTrigger>
                    <TabsTrigger value="profiles" className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Profiles
                    </TabsTrigger>
                    <TabsTrigger value="urls" className="flex items-center gap-2">
                      <Link className="h-4 w-4" />
                      URLs
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="hashtags" className="mt-6 space-y-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="mb-3 block text-base font-semibold">
                          Select Hashtags
                        </Label>
                        <div className="mb-4 flex flex-wrap gap-2">
                          {AVAILABLE_HASHTAGS.map((hashtag) => (
                            <Badge
                              key={hashtag}
                              variant={selectedHashtags.includes(hashtag) ? 'default' : 'outline'}
                              className="cursor-pointer transition-all hover:scale-105"
                              onClick={() => toggleHashtag(hashtag)}
                            >
                              #{hashtag}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label className="mb-2 block text-base font-semibold">
                          Custom Hashtags
                        </Label>
                        <Textarea
                          placeholder="Enter custom hashtags separated by commas..."
                          value={customHashtags}
                          onChange={(e) => setCustomHashtags(e.target.value)}
                          className="min-h-[80px]"
                        />
                        <p className="mt-1 text-sm text-muted-foreground">
                          Add extra hashtags beyond the predefined list
                        </p>
                      </div>

                      <div>
                        <Label className="mb-2 block text-base font-semibold">
                          Results Limit: {resultsLimit} posts
                        </Label>
                        <Input
                          type="range"
                          min="10"
                          max="200"
                          step="10"
                          value={resultsLimit}
                          onChange={(e) => setResultsLimit(parseInt(e.target.value))}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="profiles" className="mt-6 space-y-6">
                    <div>
                      <Label className="mb-2 block text-base font-semibold">Profile URLs</Label>
                      <Textarea
                        placeholder="Enter Instagram profile URLs (one per line)..."
                        value={profileUrls}
                        onChange={(e) => setProfileUrls(e.target.value)}
                        className="min-h-[150px]"
                      />
                      <p className="mt-1 text-sm text-muted-foreground">
                        Example: https://www.instagram.com/username
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="urls" className="mt-6 space-y-6">
                    <div>
                      <Label className="mb-2 block text-base font-semibold">Post URLs</Label>
                      <Textarea
                        placeholder="Enter Instagram post URLs (one per line)..."
                        value={postUrls}
                        onChange={(e) => setPostUrls(e.target.value)}
                        className="min-h-[150px]"
                      />
                      <p className="mt-1 text-sm text-muted-foreground">
                        Example: https://www.instagram.com/p/C1234567890/
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Advanced Options */}
                <div className="mt-6 border-t pt-6">
                  <h4 className="mb-4 text-base font-semibold">Advanced Options</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="results-limit" className="text-sm font-medium">
                        Results Limit
                      </Label>
                      <Input
                        id="results-limit"
                        type="number"
                        value={resultsLimit}
                        onChange={(e) => setResultsLimit(Number(e.target.value))}
                        className="w-24"
                        min={1}
                        max={200}
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-6">
                  <Button
                    onClick={handleCollection}
                    disabled={isLoading}
                    className="flex-1"
                    size="lg"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {isPaused ? 'Paused' : 'Collecting...'}
                      </>
                    ) : (
                      <>
                        <Rocket className="mr-2 h-4 w-4" />
                        Start Collection
                      </>
                    )}
                  </Button>

                  {isLoading && (
                    <Button
                      variant="outline"
                      onClick={handlePauseResume}
                      className="px-6"
                      size="lg"
                    >
                      {isPaused ? (
                        <>
                          <PlayCircle className="mr-2 h-4 w-4" />
                          Resume
                        </>
                      ) : (
                        <>
                          <PauseCircle className="mr-2 h-4 w-4" />
                          Pause
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar - Status & Results */}
          <div className="space-y-6">
            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Collection Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Collection Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {lastResult && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Status</span>
                      <div className="flex items-center gap-2">
                        {lastResult.success ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span className="text-sm capitalize">
                          {lastResult.success ? 'Success' : 'Failed'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-lg bg-blue-50 p-3 text-center">
                        <p className="text-2xl font-bold text-blue-600">
                          {lastResult.postsCollected}
                        </p>
                        <p className="text-xs text-blue-600">Collected</p>
                      </div>
                      <div className="rounded-lg bg-green-50 p-3 text-center">
                        <p className="text-2xl font-bold text-green-600">
                          {lastResult.newPostsAdded}
                        </p>
                        <p className="text-xs text-green-600">New Posts</p>
                      </div>
                    </div>

                    {lastResult.errors.length > 0 && (
                      <div>
                        <h5 className="mb-2 text-sm font-medium text-red-700">
                          Errors ({lastResult.errors.length})
                        </h5>
                        <div className="max-h-32 space-y-1 overflow-y-auto">
                          {lastResult.errors.map((err, index) => (
                            <div key={index} className="rounded bg-red-50 p-2 text-xs text-red-600">
                              {err}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!lastResult && !error && (
                  <div className="py-8 text-center">
                    <Target className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-2 text-muted-foreground">Ready to collect</p>
                    <p className="text-sm text-muted-foreground">
                      Configure settings and start collection
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
