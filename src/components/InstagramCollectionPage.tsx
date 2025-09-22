import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, RefreshCw, CheckCircle, XCircle, Database, Hash, Settings } from 'lucide-react'
import { devManualHashtagCollection, devManualCollection } from '@/services/instagramScheduler'
import { ScheduledCollectionResult } from '@/services/instagramScheduler'

const AVAILABLE_HASHTAGS = [
  'ridetothrive',
  'mitra2000',
  'motorcyclespecialist',
  'tdr',
  'oneteamstore',
  'highperformancezone',
  'hpzcrew',
  'hpz'
]

export function InstagramCollectionPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedHashtag, setSelectedHashtag] = useState<string>('')
  const [postCount, setPostCount] = useState<number>(20)
  const [collectionMode, setCollectionMode] = useState<'single' | 'all'>('single')
  const [lastResult, setLastResult] = useState<ScheduledCollectionResult | null>(null)
  const [error, setError] = useState<string | null>(null)

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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-3">
            <Database className="h-8 w-8" />
            Instagram Data Collection
          </h1>
          <p className="text-gray-600">
            Fetch real Instagram posts using Apify Scraper
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Collection Settings */}
          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Collection Settings
              </CardTitle>
              <CardDescription>
                Configure how you want to collect Instagram posts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Collection Mode */}
              <div className="space-y-2">
                <Label>Collection Mode</Label>
                <div className="flex gap-2">
                  <Button
                    variant={collectionMode === 'single' ? 'default' : 'outline'}
                    onClick={() => setCollectionMode('single')}
                    size="sm"
                  >
                    Single Hashtag
                  </Button>
                  <Button
                    variant={collectionMode === 'all' ? 'default' : 'outline'}
                    onClick={() => setCollectionMode('all')}
                    size="sm"
                  >
                    All Hashtags
                  </Button>
                </div>
              </div>

              {/* Single Hashtag Selection */}
              {collectionMode === 'single' && (
                <div className="space-y-2">
                  <Label htmlFor="hashtag-select">Select Hashtag</Label>
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
                <Label htmlFor="post-count">Number of Posts to Collect</Label>
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
                <Label>Available Hashtags</Label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_HASHTAGS.map((hashtag) => (
                    <Badge
                      key={hashtag}
                      variant={selectedHashtag === hashtag ? "default" : "outline"}
                      className="text-xs cursor-pointer"
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
                  onClick={collectionMode === 'single' ? handleSingleHashtagCollection : handleAllHashtagsCollection}
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
                        : 'Collect from All Hashtags'
                      }
                    </>
                  )}
                </Button>

                </div>
            </CardContent>
          </Card>

          {/* Results Panel */}
          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5" />
                Collection Results
              </CardTitle>
              <CardDescription>
                View collection status and results
              </CardDescription>
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
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {lastResult.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className={`font-medium ${lastResult.success ? 'text-green-600' : 'text-red-600'}`}>
                      {lastResult.success ? 'Collection Completed' : 'Collection Failed'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Posts Collected:</span>
                      <span className="font-medium ml-2">{lastResult.postsCollected}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">New Posts Added:</span>
                      <span className="font-medium ml-2">{lastResult.newPostsAdded}</span>
                    </div>
                  </div>

                  {lastResult.errors.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Errors:</h5>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {lastResult.errors.map((err, index) => (
                          <p key={index} className="text-xs text-red-600 bg-red-50 p-2 rounded">
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

              {/* API Setup Instructions */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Setup Required:</h5>
                <ol className="text-xs text-gray-600 space-y-1">
                  <li>1. Get Apify API token from apify.com</li>
                  <li>2. Create Instagram scraper actor and collect posts</li>
                  <li>3. Add VITE_APIFY_API_TOKEN to .env file</li>
                  <li>4. Add VITE_APIFY_DATASET_ID to .env file</li>
                  <li>5. Run the SQL script in INSTAGRAM_DATABASE_SETUP.sql</li>
                  <li>6. Set up Supabase Storage (see SUPABASE_STORAGE_SETUP.md)</li>
                </ol>
              </div>

              {/* Storage Notice */}
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <h5 className="text-sm font-medium text-green-700 mb-2">🎉 New Feature:</h5>
                <ul className="text-xs text-green-600 space-y-1">
                  <li>• Automatic thumbnail processing with Supabase Storage</li>
                  <li>• No more broken Instagram thumbnails!</li>
                  <li>• Images are downloaded and stored in your own bucket</li>
                  <li>• Faster loading and reliable access</li>
                </ul>
              </div>

              {/* Tips */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <h5 className="text-sm font-medium text-blue-700 mb-2">Tips:</h5>
                <ul className="text-xs text-blue-600 space-y-1">
                  <li>• Start with single hashtag collection to test API</li>
                  <li>• Use smaller post counts (10-20) to avoid rate limits</li>
                  <li>• Wait a few minutes between collections if you get 429 errors</li>
                  <li>• Check your Apify subscription limits</li>
                  <li>• Check browser console (F12) for logs</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}