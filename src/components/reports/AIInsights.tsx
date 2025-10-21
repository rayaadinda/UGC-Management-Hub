import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Brain, Lightbulb, TrendingUp, ChevronDown, ChevronUp, CheckCircle, Clock, AlertCircle, Target } from 'lucide-react'
import { AIRecommendation } from '@/types'
import { aiRecommendationsService } from '@/services/aiRecommendations'
import { cn } from '@/lib/utils'

interface AIInsightsProps {
  reportId: string
  className?: string
}

export function AIInsights({ reportId, className }: AIInsightsProps) {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [insights, setInsights] = useState<any>(null)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchRecommendations()
  }, [reportId])

  const fetchRecommendations = async () => {
    try {
      setLoading(true)
      const [recommendationsData, insightsData] = await Promise.all([
        aiRecommendationsService.getRecommendations(reportId),
        aiRecommendationsService.getRecommendationInsights(reportId)
      ])

      setRecommendations(recommendationsData)
      setInsights(insightsData)
    } catch (error) {
      console.error('Error fetching AI insights:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (recommendationId: string, status: AIRecommendation['status']) => {
    try {
      await aiRecommendationsService.updateRecommendationStatus(recommendationId, status)
      fetchRecommendations()
    } catch (error) {
      console.error('Error updating recommendation status:', error)
    }
  }

  const handleDismiss = async (recommendationId: string) => {
    try {
      await aiRecommendationsService.dismissRecommendation(recommendationId)
      fetchRecommendations()
    } catch (error) {
      console.error('Error dismissing recommendation:', error)
    }
  }

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedItems(newExpanded)
  }

  const getCategoryIcon = (category: AIRecommendation['category']) => {
    switch (category) {
      case 'content_strategy':
        return <Target className="h-4 w-4" />
      case 'engagement_optimization':
        return <TrendingUp className="h-4 w-4" />
      case 'hashtag_strategy':
        return <Lightbulb className="h-4 w-4" />
      default:
        return <Brain className="h-4 w-4" />
    }
  }

  const getPriorityColor = (priority: AIRecommendation['priority_level']) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: AIRecommendation['status']) => {
    switch (status) {
      case 'implemented':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />
      case 'dismissed':
        return <AlertCircle className="h-4 w-4 text-gray-500" />
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600'
    if (confidence >= 0.6) return 'text-blue-600'
    if (confidence >= 0.4) return 'text-yellow-600'
    return 'text-red-600'
  }

  const groupRecommendationsByCategory = () => {
    return recommendations.reduce((groups, rec) => {
      if (!groups[rec.category]) {
        groups[rec.category] = []
      }
      groups[rec.category].push(rec)
      return groups
    }, {} as Record<AIRecommendation['category'], AIRecommendation[]>)
  }

  const getHighPriorityRecommendations = () => {
    return recommendations.filter(r => r.priority_level === 'critical' || r.priority_level === 'high')
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Insights & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Brain className="h-8 w-8 text-muted-foreground mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground">Analyzing data and generating insights...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (recommendations.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Insights & Recommendations
          </CardTitle>
          <CardDescription>
            AI-powered recommendations to improve your content strategy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Recommendations Yet</h3>
            <p className="text-muted-foreground">
              Generate a report to receive AI-powered insights and recommendations.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const categoryGroups = groupRecommendationsByCategory()
  const highPriorityRecs = getHighPriorityRecommendations()

  return (
    <div className={cn('space-y-6', className)}>
      {/* Summary Stats */}
      {insights && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Insights</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{insights.total_recommendations}</div>
              <p className="text-xs text-muted-foreground">
                AI recommendations generated
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Priority</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{insights.high_priority_count}</div>
              <p className="text-xs text-muted-foreground">
                Actions requiring immediate attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(insights.average_confidence * 100).toFixed(0)}%
              </div>
              <p className="text-xs text-muted-foreground">
                AI confidence level
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Potential Impact</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {insights.total_potential_impact.toFixed(1)}
              </div>
              <p className="text-xs text-muted-foreground">
                Estimated improvement potential
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* High Priority Alert */}
      {highPriorityRecs.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            You have {highPriorityRecs.length} high-priority recommendation{highPriorityRecs.length > 1 ? 's' : ''} that may significantly improve your content performance.
          </AlertDescription>
        </Alert>
      )}

      {/* Recommendations */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Recommendations</TabsTrigger>
          <TabsTrigger value="priority">High Priority</TabsTrigger>
          <TabsTrigger value="categories">By Category</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {recommendations.map((recommendation) => (
            <RecommendationCard
              key={recommendation.id}
              recommendation={recommendation}
              isExpanded={expandedItems.has(recommendation.id)}
              onToggleExpand={() => toggleExpanded(recommendation.id)}
              onUpdateStatus={handleUpdateStatus}
              onDismiss={handleDismiss}
              getCategoryIcon={getCategoryIcon}
              getPriorityColor={getPriorityColor}
              getStatusIcon={getStatusIcon}
              getConfidenceColor={getConfidenceColor}
            />
          ))}
        </TabsContent>

        <TabsContent value="priority" className="space-y-4">
          {highPriorityRecs.map((recommendation) => (
            <RecommendationCard
              key={recommendation.id}
              recommendation={recommendation}
              isExpanded={expandedItems.has(recommendation.id)}
              onToggleExpand={() => toggleExpanded(recommendation.id)}
              onUpdateStatus={handleUpdateStatus}
              onDismiss={handleDismiss}
              getCategoryIcon={getCategoryIcon}
              getPriorityColor={getPriorityColor}
              getStatusIcon={getStatusIcon}
              getConfidenceColor={getConfidenceColor}
            />
          ))}
          {highPriorityRecs.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
                <p className="text-muted-foreground">
                  No high-priority recommendations at the moment.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          {Object.entries(categoryGroups).map(([category, recs]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getCategoryIcon(category as AIRecommendation['category'])}
                  {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  <Badge variant="outline">{recs.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recs.map((recommendation) => (
                  <RecommendationCard
                    key={recommendation.id}
                    recommendation={recommendation}
                    isExpanded={expandedItems.has(recommendation.id)}
                    onToggleExpand={() => toggleExpanded(recommendation.id)}
                    onUpdateStatus={handleUpdateStatus}
                    onDismiss={handleDismiss}
                    getCategoryIcon={getCategoryIcon}
                    getPriorityColor={getPriorityColor}
                    getStatusIcon={getStatusIcon}
                    getConfidenceColor={getConfidenceColor}
                  />
                ))}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface RecommendationCardProps {
  recommendation: AIRecommendation
  isExpanded: boolean
  onToggleExpand: () => void
  onUpdateStatus: (id: string, status: AIRecommendation['status']) => void
  onDismiss: (id: string) => void
  getCategoryIcon: (category: AIRecommendation['category']) => React.ReactNode
  getPriorityColor: (priority: AIRecommendation['priority_level']) => string
  getStatusIcon: (status: AIRecommendation['status']) => React.ReactNode
  getConfidenceColor: (confidence: number) => string
}

function RecommendationCard({
  recommendation,
  isExpanded,
  onToggleExpand,
  onUpdateStatus,
  onDismiss,
  getCategoryIcon,
  getPriorityColor,
  getStatusIcon,
  getConfidenceColor
}: RecommendationCardProps) {
  return (
    <Card className={cn('transition-all duration-200', getPriorityColor(recommendation.priority_level))}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            {getCategoryIcon(recommendation.category)}
            <div className="flex-1">
              <CardTitle className="text-lg">{recommendation.title}</CardTitle>
              <CardDescription className="mt-1">
                {recommendation.description}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getPriorityColor(recommendation.priority_level)}>
              {recommendation.priority_level}
            </Badge>
            {getStatusIcon(recommendation.status)}
          </div>
        </div>
      </CardHeader>

      <Collapsible open={isExpanded} onOpenChange={onToggleExpand}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between">
            <span className="text-sm">
              {isExpanded ? 'Show less' : 'Show more details'}
            </span>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2">Impact & Confidence</h4>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Estimated Impact</span>
                    <span className={getConfidenceColor(recommendation.estimated_impact)}>
                      {(recommendation.estimated_impact * 100).toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={recommendation.estimated_impact * 100} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm">
                    <span>AI Confidence</span>
                    <span className={getConfidenceColor(recommendation.confidence_score)}>
                      {(recommendation.confidence_score * 100).toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={recommendation.confidence_score * 100} className="h-2" />
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Supporting Data</h4>
              <div className="text-sm text-muted-foreground">
                {Object.keys(recommendation.supporting_data).length > 0 ? (
                  <div className="space-y-1">
                    {Object.entries(recommendation.supporting_data).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span>{key.replace(/_/g, ' ')}:</span>
                        <span>{typeof value === 'number' ? value.toFixed(2) : value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No supporting data available</p>
                )}
              </div>
            </div>
          </div>

          {recommendation.actionable_steps.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Actionable Steps</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                {recommendation.actionable_steps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </div>
          )}

          <div className="flex gap-2 pt-4 border-t">
            {recommendation.status === 'pending' && (
              <>
                <Button
                  size="sm"
                  onClick={() => onUpdateStatus(recommendation.id, 'in_progress')}
                >
                  Mark in Progress
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onUpdateStatus(recommendation.id, 'implemented')}
                >
                  Mark Implemented
                </Button>
              </>
            )}
            {recommendation.status === 'in_progress' && (
              <Button
                size="sm"
                onClick={() => onUpdateStatus(recommendation.id, 'implemented')}
              >
                Mark Implemented
              </Button>
            )}
            {recommendation.status !== 'dismissed' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDismiss(recommendation.id)}
              >
                Dismiss
              </Button>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}