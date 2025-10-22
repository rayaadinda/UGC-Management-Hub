import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { DashboardStats } from './DashboardStats'
import { UGCFilterControls } from './UGCFilterControls'
import { UGCCard } from './UGCCard'
import { UGCDetailDialog } from './UGCDetailDialog'
import { InstagramCollectionPage } from '@/pages/InstagramCollectionPage'
import { TDRApplicationsPage } from '@/pages/TDRApplicationsPage'
import { AffiliateSalesPage } from '@/pages/AffiliateSalesPage'
import ReportsPage from '@/pages/ReportsPage'
import { useUGCContent } from '@/hooks/useUGCContent'
import { UGCContent, UGCContentFilters } from '@/types'

export function UGCDashboard() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [activePage, setActivePage] = useState('dashboard')
  const [filters, setFilters] = useState<UGCContentFilters>({})
  const [selectedContent, setSelectedContent] = useState<UGCContent | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)

    useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarCollapsed(true)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const { data: content, isLoading, error } = useUGCContent(filters)

  const handleViewDetails = (contentItem: UGCContent) => {
    setSelectedContent(contentItem)
    setIsDetailDialogOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin" />
          <p className="text-gray-600">Loading content...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="mb-4 text-red-600">Error loading content</p>
          <p className="text-gray-600">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        activePage={activePage}
        onPageChange={setActivePage}
      />

      <main
        className={`flex min-w-0 flex-1 flex-col transition-all duration-300 ${
          isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        } ml-0`}
      >
        {/* Only show this header for UGC content pages, not applications, affiliate sales, or reports */}
        {activePage !== 'applications' && activePage !== 'collection' && activePage !== 'affiliate-sales' && activePage !== 'reports' && (
          <div className="sticky top-0 z-10 flex-shrink-0 border-b bg-white shadow-sm dark:bg-gray-800">
            <div className="px-4 py-3 sm:px-6 sm:py-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <h1 className="truncate text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
                    UGC Management Hub
                  </h1>
                  <p className="truncate text-sm text-gray-600 dark:text-gray-400 sm:text-base">
                    Manage and curate user-generated content from social media platforms
                  </p>
                </div>
              </div>
            </div>
            <UGCFilterControls filters={filters} onFiltersChange={setFilters} />
          </div>
        )}

        <div className="flex-1 overflow-auto p-4 sm:p-6">
          {activePage === 'dashboard' && content && (
            <div className="space-y-6">
              <DashboardStats content={content} />
            </div>
          )}

          {activePage === 'collection' && <InstagramCollectionPage />}

          {activePage === 'applications' && <TDRApplicationsPage />}

          {activePage === 'affiliate-sales' && <AffiliateSalesPage />}

          {activePage === 'reports' && <ReportsPage />}

          {activePage !== 'collection' &&
          activePage !== 'applications' &&
          activePage !== 'affiliate-sales' &&
          activePage !== 'reports' &&
          content &&
          content.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
              {content
                .filter((item) => {
                  if (activePage === 'videos') return item.media_type === 'video'
                  if (activePage === 'approved') return item.status === 'approved_for_repost'
                  return true
                })
                .map((item) => (
                  <UGCCard key={item.id} content={item} onViewDetails={handleViewDetails} />
                ))}
            </div>
          ) : (
            activePage !== 'collection' &&
            activePage !== 'applications' &&
            activePage !== 'affiliate-sales' &&
            activePage !== 'reports' && (
              <div className="py-12 text-center">
                <div className="mb-4 text-gray-400">
                  <svg
                    className="mx-auto h-16 w-16"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
                  No content found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Try adjusting your filters or check back later for new content.
                </p>
              </div>
            )
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
