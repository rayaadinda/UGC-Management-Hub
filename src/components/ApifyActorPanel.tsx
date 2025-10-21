import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Loader2, Play, CheckCircle, XCircle, Plus, X, Link, AlertTriangle } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { useRunApifyActor, useApifyActorStatus, useInstagramUrlList } from '@/hooks/useApifyActor'
import { ApifyActorTask } from '@/services/apifyActor'

export function ApifyActorPanel() {
  const { urls, addUrl, removeUrl, clearUrls, isValid } = useInstagramUrlList()
  const [newUrl, setNewUrl] = useState('')
  const [hashtags, setHashtags] = useState('')
  const [resultsLimit, setResultsLimit] = useState(50)
  const [timeRange, setTimeRange] = useState('1 day')
  const [searchType, setSearchType] = useState('hashtag')
  const [error, setError] = useState<string | null>(null)
  const [currentTask, setCurrentTask] = useState<ApifyActorTask | null>(null)

  const { progress, ...runActorMutation } = useRunApifyActor()
  const { data: taskStatus, isLoading: isCheckingStatus } = useApifyActorStatus(
    currentTask?.id || '',
    !!currentTask && currentTask.status === 'RUNNING'
  )

  const handleAddUrl = () => {
    if (!newUrl.trim()) return

    const result = addUrl(newUrl.trim())
    if (!result.success) {
      setError(result.error || null)
    } else {
      setNewUrl('')
      setError(null)
    }
  }

  const handleRunActor = async () => {
    if (!isValid) {
      setError('Please add at least one Instagram URL')
      return
    }

    try {
      setError(null)
      const hashtagList = hashtags
        .split(',')
        .map((h) => h.trim())
        .filter((h) => h.length > 0)
        .map((h) => (h.startsWith('#') ? h : `#${h}`))

      const input = {
        urls,
        hashtags: hashtagList,
        resultsLimit,
        onlyPostsNewerThan: timeRange,
        searchType: searchType as 'hashtag' | 'profile' | 'location',
      }

      const result = await runActorMutation.mutateAsync(input)

      if (result.data) {
        setCurrentTask(result.data)
      }
    } catch (err) {
      console.error('❌ Apify actor error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddUrl()
    }
  }

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCEEDED':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'FAILED':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'RUNNING':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'TIMED_OUT':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getTaskStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCEEDED':
        return <CheckCircle className="h-4 w-4" />
      case 'FAILED':
        return <XCircle className="h-4 w-4" />
      case 'RUNNING':
        return <Loader2 className="h-4 w-4 animate-spin" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  const currentStatus = taskStatus || currentTask

  return (
    <Card className="mb-6 border border-gray-200 bg-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5" />
          Apify Instagram Scraper
        </CardTitle>
        <CardDescription>Run Instagram scraper with specific URLs and hashtags</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Instagram URLs Input */}
        <div>
          <Label htmlFor="url-input" className="text-sm font-medium text-gray-700">
            Instagram URLs
          </Label>
          <div className="mt-1 flex gap-2">
            <Input
              id="url-input"
              type="url"
              placeholder="https:/instagram.com/@username..."
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button onClick={handleAddUrl} disabled={!newUrl.trim()} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-1 text-xs text-gray-500">Add Instagram post, reel, or profile URLs</p>

          {/* Quick Test URLs */}
          <div className="mt-2">
            <p className="mb-1 text-xs font-medium text-gray-600">Quick Test URLs:</p>
            <div className="flex flex-wrap gap-1">
              {[
                'https://www.instagram.com/HPZ.TV/',
                'https://www.instagram.com/instagram/',
                'https://www.instagram.com/nasa/',
              ].map((testUrl, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const result = addUrl(testUrl)
                    if (!result.success) {
                      setError(result.error || null)
                    } else {
                      setError(null)
                    }
                  }}
                  className="h-auto px-2 py-1 text-xs"
                >
                  Test {idx + 1}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* URL List */}
        {urls.length > 0 && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-700">
                Added URLs ({urls.length})
              </Label>
              <Button onClick={clearUrls} variant="outline" size="sm" className="text-xs">
                Clear All
              </Button>
            </div>
            <div className="max-h-32 space-y-2 overflow-y-auto">
              {urls.map((url, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded bg-gray-50 p-2"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <Link className="h-3 w-3 flex-shrink-0 text-gray-400" />
                    <span className="truncate text-xs text-gray-700">{url}</span>
                  </div>
                  <Button
                    onClick={() => removeUrl(url)}
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Additional Options */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="hashtags" className="text-sm font-medium text-gray-700">
              Target Hashtags (optional)
            </Label>
            <Textarea
              id="hashtags"
              placeholder="HPZCREW, HPZ, RideToThrive"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              className="mt-1"
              rows={2}
            />
            <p className="mt-1 text-xs text-gray-500">
              Comma-separated hashtags (with or without #)
            </p>
          </div>

          <div>
            <Label htmlFor="results-limit" className="text-sm font-medium text-gray-700">
              Results Limit
            </Label>
            <Input
              id="results-limit"
              type="number"
              min="1"
              max="1000"
              value={resultsLimit}
              onChange={(e) => setResultsLimit(parseInt(e.target.value))}
              className="mt-1 w-32"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="time-range" className="text-sm font-medium text-gray-700">
                Time Range
              </Label>
              <select
                id="time-range"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="1 day">Last 1 day</option>
                <option value="3 days">Last 3 days</option>
                <option value="1 week">Last 1 week</option>
                <option value="2 weeks">Last 2 weeks</option>
                <option value="1 month">Last 1 month</option>
              </select>
            </div>

            <div>
              <Label htmlFor="search-type" className="text-sm font-medium text-gray-700">
                Search Type
              </Label>
              <select
                id="search-type"
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="hashtag">Hashtag Search</option>
                <option value="profile">Profile Posts</option>
                <option value="location">Location Posts</option>
              </select>
            </div>
          </div>
        </div>

        <Separator />

  
        <Button
          onClick={handleRunActor}
          disabled={!isValid || runActorMutation.isPending}
          className="w-full"
        >
          {runActorMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running Scraper...
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Run Instagram Scraper
            </>
          )}
        </Button>

        {/* Progress Display */}
        {progress && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{progress.step}</span>
              <span>{progress.percentage}%</span>
            </div>
            <Progress value={progress.percentage} className="w-full" />
            {progress.current && progress.total && (
              <div className="text-center text-xs text-muted-foreground">
                {progress.current} of {progress.total} items
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Current Task Status */}
        {currentStatus && (
          <div className="rounded-lg border p-4">
            <h5 className="mb-3 text-sm font-medium text-gray-700">Task Status</h5>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {getTaskStatusIcon(currentStatus.status)}
                <Badge variant="outline" className={getTaskStatusColor(currentStatus.status)}>
                  {currentStatus.status}
                </Badge>
                {isCheckingStatus && (
                  <span className="text-xs text-gray-500">Checking status...</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Task ID:</span>
                  <span className="ml-2 text-xs font-medium">{currentStatus.id}</span>
                </div>
                <div>
                  <span className="text-gray-600">Results:</span>
                  <span className="ml-2 font-medium">{currentStatus.resultCount || 0}</span>
                </div>
              </div>

              {currentStatus.startedAt && (
                <div className="text-xs text-gray-500">
                  Started: {new Date(currentStatus.startedAt).toLocaleString()}
                </div>
              )}

              {currentStatus.finishedAt && (
                <div className="text-xs text-gray-500">
                  Finished: {new Date(currentStatus.finishedAt).toLocaleString()}
                </div>
              )}

              {currentStatus.error && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">{currentStatus.error}</AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
