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

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 mb-6">
      <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6">
        {/* Header - Mobile Responsive */}
        <div className="space-y-2 text-center sm:space-y-3">
          <h1 className="flex items-center justify-center gap-3 text-2xl font-bold text-gray-900 sm:text-3xl lg:text-4xl">
            <Database className="h-6 w-6 sm:h-8 sm:w-8" />
            <span className="hidden sm:inline">Instagram Data Collection</span>
            <span className="sm:hidden">Data Collection</span>
          </h1>
          <p className="px-4 text-sm text-gray-600 sm:text-base">
            Fetch real Instagram posts using Apify Scraper
          </p>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="lg:hidden">
          <Button
            variant="outline"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="w-full gap-2"
          >
            <Menu className="h-4 w-4" />
            {isMobileMenuOpen ? 'Hide Tools' : 'Show Collection Tools'}
          </Button>
        </div>

        <div
          className={cn(
            'space-y-4 sm:space-y-6',
            'lg:grid lg:grid-cols-1 lg:gap-6 lg:space-y-0',
            !isMobileMenuOpen && 'hidden lg:block'
          )}
        >
          {/* Apify Actor Panel - Full Width on Large Screens */}
          <div className="w-full">
            <ApifyActorPanel />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-2 ">
            {/* Collection Settings */}
            <Card className="border border-gray-200 bg-white">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
                  Collection Settings
                </CardTitle>
                <CardDescription className="text-sm">
                  Configure how you want to collect Instagram posts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                {/* Collection Mode */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Collection Mode</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={collectionMode === 'single' ? 'default' : 'outline'}
                      onClick={() => setCollectionMode('single')}
                      size="sm"
                      className="flex-1 sm:flex-none"
                    >
                      Single Hashtag
                    </Button>
                    <Button
                      variant={collectionMode === 'all' ? 'default' : 'outline'}
                      onClick={() => setCollectionMode('all')}
                      size="sm"
                      className="flex-1 sm:flex-none"
                    >
                      All Hashtags
                    </Button>
                  </div>
                </div>

                {/* Single Hashtag Selection */}
                {collectionMode === 'single' && (
                  <div className="space-y-2">
                    <Label htmlFor="hashtag-select" className="text-sm font-medium">
                      Select Hashtag
                    </Label>
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

                {/* Post Count */}
                <div className="space-y-2">
                  <Label htmlFor="post-count" className="text-sm font-medium">
                    Number of Posts to Collect
                  </Label>
                  <Input
                    id="post-count"
                    type="number"
                    min="1"
                    max="100"
                    value={postCount}
                    onChange={(e) => setPostCount(parseInt(e.target.value) || 20)}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500">
                    Recommended: 20-50 posts to avoid rate limiting
                  </p>
                </div>

                {/* Available Hashtags Preview */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Available Hashtags</Label>
                  <div className="flex max-h-32 flex-wrap gap-1 overflow-y-auto sm:gap-2">
                    {AVAILABLE_HASHTAGS.map((hashtag) => (
                      <Badge
                        key={hashtag}
                        variant={selectedHashtag === hashtag ? 'default' : 'outline'}
                        className="cursor-pointer text-xs transition-colors hover:bg-gray-100"
                        onClick={() => collectionMode === 'single' && setSelectedHashtag(hashtag)}
                      >
                        #{hashtag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Collection Buttons */}
                <div className="space-y-2">
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
                        <span className="hidden sm:inline">Collecting Posts...</span>
                        <span className="sm:hidden">Collecting...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        <span className="hidden sm:inline">
                          {collectionMode === 'single'
                            ? `Collect from #${selectedHashtag || 'Selected Hashtag'}`
                            : 'Collect from All Hashtags'}
                        </span>
                        <span className="sm:hidden">
                          {collectionMode === 'single' ? 'Collect Single' : 'Collect All'}
                        </span>
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Results Panel */}
            <Card className="border border-gray-200 bg-white">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Hash className="h-4 w-4 sm:h-5 sm:w-5" />
                  Collection Results
                </CardTitle>
                <CardDescription className="text-sm">
                  View collection status and results
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Error Display */}
                {error && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">{error}</AlertDescription>
                  </Alert>
                )}

                {/* Results Display */}
                {lastResult && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      {lastResult.success ? (
                        <CheckCircle className="h-4 w-4 text-green-600 sm:h-5 sm:w-5" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600 sm:h-5 sm:w-5" />
                      )}
                      <span
                        className={`text-sm font-medium sm:text-base ${lastResult.success ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {lastResult.success ? 'Collection Completed' : 'Collection Failed'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                      <div className="rounded-lg bg-gray-50 p-3">
                        <span className="block text-gray-600">Posts Collected:</span>
                        <span className="text-lg font-bold">{lastResult.postsCollected}</span>
                      </div>
                      <div className="rounded-lg bg-gray-50 p-3">
                        <span className="block text-gray-600">New Posts Added:</span>
                        <span className="text-lg font-bold text-green-600">
                          {lastResult.newPostsAdded}
                        </span>
                      </div>
                    </div>

                    {lastResult.errors.length > 0 && (
                      <div>
                        <h5 className="mb-2 text-sm font-medium text-gray-700">Errors:</h5>
                        <div className="max-h-32 space-y-1 overflow-y-auto">
                          {lastResult.errors.map((err, index) => (
                            <p key={index} className="rounded bg-red-50 p-2 text-xs text-red-600">
                              {err}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-gray-500">
                      Last run: {new Date(lastResult.timestamp).toLocaleString()}
                    </p>
                  </div>
                )}

                {/* Info Panels - Responsive Stacking */}
                <div className="space-y-4">
                  {/* API Setup Instructions */}
                  <div className="rounded-lg bg-gray-50 p-3">
                    <h5 className="mb-2 text-sm font-medium text-gray-700">Setup Required:</h5>
                    <ol className="space-y-1 text-xs text-gray-600">
                      <li>1. Get Apify API token from apify.com</li>
                      <li>2. Create Instagram scraper actor and collect posts</li>
                      <li>3. Add VITE_APIFY_API_TOKEN to .env file</li>
                      <li>4. Add VITE_APIFY_DATASET_ID to .env file</li>
                      <li>5. Run the SQL script in INSTAGRAM_DATABASE_SETUP.sql</li>
                      <li>6. Set up Supabase Storage (see SUPABASE_STORAGE_SETUP.md)</li>
                    </ol>
                  </div>

                  {/* Storage Notice */}
                  <div className="rounded-lg bg-green-50 p-3">
                    <h5 className="mb-2 text-sm font-medium text-green-700">🎉 New Feature:</h5>
                    <ul className="space-y-1 text-xs text-green-600">
                      <li>• Automatic thumbnail processing with Supabase Storage</li>
                      <li>• No more broken Instagram thumbnails!</li>
                      <li>• Images are downloaded and stored in your own bucket</li>
                      <li>• Faster loading and reliable access</li>
                    </ul>
                  </div>

                  {/* Tips */}
                  <div className="rounded-lg bg-blue-50 p-3">
                    <h5 className="mb-2 text-sm font-medium text-blue-700">Tips:</h5>
                    <ul className="space-y-1 text-xs text-blue-600">
                      <li>• Start with single hashtag collection to test API</li>
                      <li>• Use smaller post counts (10-20) to avoid rate limits</li>
                      <li>• Wait a few minutes between collections if you get 429 errors</li>
                      <li>• Check your Apify subscription limits</li>
                      <li>• Check browser console (F12) for logs</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
