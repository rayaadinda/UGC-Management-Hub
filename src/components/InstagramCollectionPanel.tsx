import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, RefreshCw, CheckCircle, XCircle, Database } from 'lucide-react'
import { devManualCollection } from '@/services/instagramScheduler'
import { ScheduledCollectionResult } from '@/services/instagramScheduler'

export function InstagramCollectionPanel() {
  const [isLoading, setIsLoading] = useState(false)
  const [lastResult, setLastResult] = useState<ScheduledCollectionResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleManualCollection = async () => {
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
    <Card className="bg-white border border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Instagram Data Collection
        </CardTitle>
        <CardDescription>
          Fetch real Instagram posts using RapidAPI Scraper
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Target Hashtags */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Target Hashtags:</h4>
          <div className="flex flex-wrap gap-2">
            {['RideToThrive', 'MITRA2000', 'MotorcycleSpecialist', 'TDR', 'oneteamstore', 'HighPerformanceZone', 'HPZCREW', 'HPZ'].map((hashtag) => (
              <Badge key={hashtag} variant="outline" className="text-xs">
                #{hashtag}
              </Badge>
            ))}
          </div>
        </div>

        {/* Manual Collection Button */}
        <Button
          onClick={handleManualCollection}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Collecting Posts...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Collect New Posts
            </>
          )}
        </Button>

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
                <div className="space-y-1">
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
            <li>1. Get RapidAPI key from rapidapi.com</li>
            <li>2. Subscribe to Instagram Scraper API</li>
            <li>3. Add VITE_RAPIDAPI_KEY to .env file</li>
            <li>4. Run the SQL script in instagramDatabase.ts</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}