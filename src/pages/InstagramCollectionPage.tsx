import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Loader2,
  RefreshCw,
  CheckCircle,
  XCircle,
  Database,
  Hash,
  Settings,
  Menu,
  Sparkles,
  Zap,
  Target,
  BarChart3,
  Clock,
  Filter,
} from 'lucide-react'
import { devManualHashtagCollection, devManualCollection } from '@/services/instagramScheduler'
import { ScheduledCollectionResult } from '@/services/instagramScheduler'
import { ApifyActorPanel } from '@/components/ApifyActorPanel'
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

export function InstagramCollectionPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedHashtag, setSelectedHashtag] = useState<string>('')
  const [postCount, setPostCount] = useState<number>(20)
  const [collectionMode, setCollectionMode] = useState<'single' | 'all'>('single')
  const [lastResult, setLastResult] = useState<ScheduledCollectionResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleSingleHashtagCollection = async () => {
    if (!selectedHashtag) {
      setError('Please select a hashtag first')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await devManualHashtagCollection(selectedHashtag, postCount)
      setLastResult(result)

      if (!result.success) {
        setError(`Collection completed with errors: ${result.errors.join(', ')}`)
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAllHashtagsCollection = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await devManualCollection()
      setLastResult(result)

      if (!result.success) {
        setError(`Collection completed with errors: ${result.errors.join(', ')}`)
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  const stats = lastResult ? {
    totalPosts: lastResult.postsCollected,
    newPosts: lastResult.newPostsAdded,
    status: lastResult.success ? 'success' : 'error',
    lastRun: lastResult.timestamp,
    errors: lastResult.errors.length,
  } : null

  return (
    <div className="container mx-auto p-4 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Database className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Instagram Data Collection</h1>
            <p className="text-muted-foreground">
              Automate your content discovery with powerful Instagram scraping tools
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Menu Toggle */}
      <div className="lg:hidden">
        <Button
          variant="outline"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="w-full justify-center gap-2"
        >
          <Menu className="h-4 w-4" />
          {isMobileMenuOpen ? 'Hide Controls' : 'Show Controls'}
        </Button>
      </div>

      <div className={cn('space-y-6', !isMobileMenuOpen && 'hidden lg:block')}>
        {/* Stats Cards */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Posts</p>
                    <p className="text-2xl font-bold">{stats.totalPosts}</p>
                  </div>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">New Posts</p>
                    <p className="text-2xl font-bold text-green-600">{stats.newPosts}</p>
                  </div>
                  <Sparkles className="h-4 w-4 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <div className="flex items-center gap-2">
                      {stats.status === 'success' ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span className={cn(
                        "text-sm font-medium",
                        stats.status === 'success' ? "text-green-600" : "text-red-600"
                      )}>
                        {stats.status === 'success' ? 'Success' : 'Failed'}
                      </span>
                    </div>
                  </div>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Last Run</p>
                    <p className="text-sm font-medium">
                      {new Date(stats.lastRun).toLocaleTimeString()}
                    </p>
                  </div>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Controls */}
          <div className="space-y-6 lg:col-span-2">
            {/* Apify Actor Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Apify Actor Control
                </CardTitle>
                <CardDescription>
                  Manage your Instagram scraping actor and monitor runs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ApifyActorPanel />
              </CardContent>
            </Card>

            {/* Collection Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Collection Settings
                </CardTitle>
                <CardDescription>
                  Configure your Instagram data collection parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Mode Selection */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Collection Mode</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant={collectionMode === 'single' ? 'default' : 'outline'}
                      onClick={() => setCollectionMode('single')}
                      className="h-auto flex-col space-y-2 p-4"
                    >
                      <Hash className="h-6 w-6" />
                      <span className="text-sm font-medium">Single Hashtag</span>
                    </Button>
                    <Button
                      variant={collectionMode === 'all' ? 'default' : 'outline'}
                      onClick={() => setCollectionMode('all')}
                      className="h-auto flex-col space-y-2 p-4"
                    >
                      <Filter className="h-6 w-6" />
                      <span className="text-sm font-medium">All Hashtags</span>
                    </Button>
                  </div>
                </div>

                {collectionMode === 'single' && (
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Select Hashtag</Label>
                    <Select value={selectedHashtag} onValueChange={setSelectedHashtag}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a hashtag to collect from" />
                      </SelectTrigger>
                      <SelectContent>
                        {AVAILABLE_HASHTAGS.map((hashtag) => (
                          <SelectItem key={hashtag} value={hashtag}>
                            #{hashtag}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-3">
                  <Label className="text-base font-semibold">Post Count</Label>
                  <div className="flex items-center space-x-4">
                    <Input
                      type="range"
                      min="5"
                      max="100"
                      step="5"
                      value={postCount}
                      onChange={(e) => setPostCount(parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <div className="min-w-[60px] rounded-md bg-primary/10 px-3 py-2 text-center font-semibold text-primary">
                      {postCount}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">Recommended: 20-50 posts to avoid rate limiting</p>
                </div>

                {/* Hashtag Pills */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Available Hashtags</Label>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_HASHTAGS.map((hashtag) => (
                      <Badge
                        key={hashtag}
                        variant={selectedHashtag === hashtag ? 'default' : 'secondary'}
                        className="cursor-pointer transition-colors hover:bg-primary/80"
                        onClick={() => collectionMode === 'single' && setSelectedHashtag(hashtag)}
                      >
                        #{hashtag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Action Button */}
                <Button
                  onClick={
                    collectionMode === 'single'
                      ? handleSingleHashtagCollection
                      : handleAllHashtagsCollection
                  }
                  disabled={isLoading || (collectionMode === 'single' && !selectedHashtag)}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Collecting Posts...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      {collectionMode === 'single'
                        ? `Collect from #${selectedHashtag || 'Selected Hashtag'}`
                        : 'Collect from All Hashtags'}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Status */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Collection Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Error Display */}
                {error && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Results Display */}
                {lastResult && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div className="flex items-center gap-3">
                        {lastResult.success ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        <div>
                          <p className="font-semibold">
                            {lastResult.success ? 'Collection Completed' : 'Collection Failed'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(lastResult.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-blue-50 p-3 text-center">
                        <p className="text-sm text-blue-600">Collected</p>
                        <p className="text-xl font-bold text-blue-600">{lastResult.postsCollected}</p>
                      </div>
                      <div className="rounded-lg bg-green-50 p-3 text-center">
                        <p className="text-sm text-green-600">New Posts</p>
                        <p className="text-xl font-bold text-green-600">{lastResult.newPostsAdded}</p>
                      </div>
                    </div>

                    {lastResult.errors.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium text-red-700">Errors ({lastResult.errors.length})</h5>
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
                  <div className="text-center py-8">
                    <RefreshCw className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-2 text-muted-foreground">No collections yet</p>
                    <p className="text-sm text-muted-foreground">Start collecting to see results</p>
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