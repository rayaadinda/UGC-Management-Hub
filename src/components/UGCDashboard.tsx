import { useState } from 'react'
import { Loader2, Grid, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sidebar } from './Sidebar'
import { DashboardStats } from './DashboardStats'
import { UGCFilterControls } from './UGCFilterControls'
import { UGCCard } from './UGCCard'
import { UGCDetailDialog } from './UGCDetailDialog'
import { InstagramCollectionPage } from './InstagramCollectionPage'
import { useUGCContent } from '@/hooks/useUGCContent'
import { UGCContent, UGCContentFilters } from '@/types'

export function UGCDashboard() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [activePage, setActivePage] = useState('dashboard')
  const [filters, setFilters] = useState<UGCContentFilters>({})
  const [selectedContent, setSelectedContent] = useState<UGCContent | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const { data: content, isLoading, error } = useUGCContent(filters)

  const handleViewDetails = (contentItem: UGCContent) => {
    setSelectedContent(contentItem)
    setIsDetailDialogOpen(true)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading content...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading content</p>
          <p className="text-gray-600">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        activePage={activePage}
        onPageChange={setActivePage}
      />

      <main className={`flex-1 transition-all duration-300 ${
        isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
      } ml-0`}>
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b shadow-sm">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  UGC Management Hub
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Manage and curate user-generated content from social media platforms
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <UGCFilterControls filters={filters} onFiltersChange={setFilters} />
        </div>

        <div className="p-6">
          {activePage === 'dashboard' && content && (
            <div className="space-y-6">
              <DashboardStats content={content} />
            </div>
          )}

          {activePage === 'collection' && (
            <InstagramCollectionPage />
          )}

          {activePage !== 'collection' && content && content.length > 0 ? (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-4'}>
              {content
                .filter(item => {
                  if (activePage === 'videos') return item.media_type === 'video'
                  if (activePage === 'approved') return item.status === 'approved_for_repost'
                  return true
                })
                .map((item) => (
                  <UGCCard
                    key={item.id}
                    content={item}
                    onViewDetails={handleViewDetails}
                  />
                ))}
            </div>
          ) : activePage !== 'collection' && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No content found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Try adjusting your filters or check back later for new content.
              </p>
            </div>
          )}
        </div>

        <UGCDetailDialog
          content={selectedContent}
          open={isDetailDialogOpen}
          onOpenChange={setIsDetailDialogOpen}
        />
      </main>
    </div>
  )
}