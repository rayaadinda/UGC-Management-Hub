import { useState } from 'react'
import {
  Loader2,
  Users,
  Search,
  FileSpreadsheet,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Phone,
  Instagram,
  Calendar,
  MoreHorizontal,
  Filter,
  ExternalLink,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ApplicationDetailDialog } from '@/components/ApplicationDetailDialog'
import { useTDRApplications, useUpdateApplicationStatus } from '@/hooks/useTDRApplications'
import { TDRApplication, TDRApplicationFilters } from '@/types'
import { ProfileScraperPanel } from '@/components/ProfileScraperPanel'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function TDRApplicationsPage() {
  const [filters, setFilters] = useState<TDRApplicationFilters>({})
  const [selectedApplication, setSelectedApplication] = useState<TDRApplication | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false)
  const [showScraperPanel, setShowScraperPanel] = useState(false)
  const [scraperApplicant, setScraperApplicant] = useState<TDRApplication | null>(null)

  const { data: applications, isLoading, error } = useTDRApplications(filters)
  const updateStatus = useUpdateApplicationStatus()

  const handleViewDetails = (application: TDRApplication) => {
    setSelectedApplication(application)
    setIsDetailDialogOpen(true)
  }

  const handleOpenScraper = (application: TDRApplication) => {
    setScraperApplicant(application)
    setShowScraperPanel(true)
  }

  const handleStatusUpdate = async (id: string, status: TDRApplication['status']) => {
    try {
      await updateStatus.mutateAsync({ id, status })
      toast.success(`Application ${status} successfully`)
    } catch (error) {
      toast.error('Failed to update application status')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <Clock className="mr-1 h-3 w-3" />
            <span className="hidden sm:inline">Pending</span>
          </Badge>
        )
      case 'approved':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="mr-1 h-3 w-3" />
            <span className="hidden sm:inline">Approved</span>
          </Badge>
        )
      case 'rejected':
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800">
            <XCircle className="mr-1 h-3 w-3" />
            <span className="hidden sm:inline">Rejected</span>
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const stats = applications
    ? {
        total: applications.length,
        pending: applications.filter((app) => app.status === 'pending').length,
        approved: applications.filter((app) => app.status === 'approved').length,
        rejected: applications.filter((app) => app.status === 'rejected').length,
        withMotorcycle: applications.filter((app) => app.owns_motorcycle === 'Yes').length,
      }
    : null

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin" />
          <p className="text-gray-600">Loading applications...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-red-600">Error loading applications</p>
          <p className="text-gray-600">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-full space-y-4 overflow-hidden p-4 sm:space-y-6 sm:p-6">
      {/* Header - Responsive */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-semibold text-gray-900 sm:text-3xl">
            TDR Applications
          </h1>
          <p className="mt-1 text-sm text-gray-600 sm:text-base">
            Manage HPZ Crew content creator applications
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="w-full gap-2 sm:w-auto">
            <FileSpreadsheet className="h-4 w-4" />
            <span className="hidden sm:inline">Export Data</span>
            <span className="sm:hidden">Export</span>
          </Button>
          <Dialog open={showScraperPanel} onOpenChange={setShowScraperPanel}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full gap-2 sm:w-auto">
                <Zap className="h-4 w-4" />
                <span className="hidden sm:inline">Profile Scraper</span>
                <span className="sm:hidden">Scraper</span>
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards - Modern Clean Design */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-5">
          <Card className="border-0 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md">
            <CardContent className="p-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-violet-100">
                <Users className="h-8 w-8 text-violet-600" />
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-semibold text-gray-900">{stats.total}+</p>
                <p className="text-sm font-medium text-gray-500">Total Applications</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md">
            <CardContent className="p-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal-100">
                <Clock className="h-8 w-8 text-teal-600" />
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-semibold text-gray-900">{stats.pending}+</p>
                <p className="text-sm font-medium text-gray-500">Pending Review</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md">
            <CardContent className="p-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
                <CheckCircle className="h-8 w-8 text-orange-600" />
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-semibold text-gray-900">{stats.approved}+</p>
                <p className="text-sm font-medium text-gray-500">Applications Approved</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md">
            <CardContent className="p-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <XCircle className="h-8 w-8 text-blue-600" />
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-semibold text-gray-900">{stats.rejected}+</p>
                <p className="text-sm font-medium text-gray-500">Applications Rejected</p>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-2 border-0 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md sm:col-span-1">
            <CardContent className="p-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cyan-100">
                <Users className="h-8 w-8 text-cyan-600" />
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-semibold text-gray-900">{stats.withMotorcycle}+</p>
                <p className="text-sm font-medium text-gray-500">Riders with Bike</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters - Mobile-responsive */}
      <Card>
        <CardContent className="p-4 sm:pt-6">
          {/* Mobile Filter Toggle */}
          <div className="mb-4 flex items-center justify-between sm:hidden">
            <h3 className="text-sm font-medium">Filters</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
            >
              <Filter className="mr-2 h-4 w-4" />
              {isMobileFiltersOpen ? 'Hide' : 'Show'}
            </Button>
          </div>

          {/* Filter Controls */}
          <div
            className={cn(
              'space-y-4 sm:flex sm:flex-row sm:gap-4 sm:space-y-0',
              !isMobileFiltersOpen && 'hidden sm:flex'
            )}
          >
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                <Input
                  placeholder="Search by name, email, or Instagram..."
                  value={filters.search || ''}
                  onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value as any }))}
            >
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.owns_motorcycle || 'all'}
              onValueChange={(value) => setFilters((prev) => ({ ...prev, owns_motorcycle: value }))}
            >
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Motorcycle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Riders</SelectItem>
                <SelectItem value="Yes">Owns Motorcycle</SelectItem>
                <SelectItem value="No">No Motorcycle</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Data Table - Responsive */}
      {applications && applications.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Applicant</TableHead>
                    <TableHead className="hidden min-w-[150px] md:table-cell">Contact</TableHead>
                    <TableHead className="hidden min-w-[140px] lg:table-cell">
                      Social Media
                    </TableHead>
                    <TableHead className="hidden min-w-[120px] xl:table-cell">Experience</TableHead>
                    <TableHead className="min-w-[100px]">Status</TableHead>
                    <TableHead className="hidden min-w-[100px] sm:table-cell">Applied</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((application) => (
                    <TableRow key={application.id}>
                      <TableCell className="p-3 sm:p-4">
                        <div className="space-y-1">
                          <div className="text-sm font-medium sm:text-base">
                            {application.full_name}
                          </div>
                          <div className="max-w-[180px] truncate text-xs text-gray-500 sm:text-sm">
                            {application.why_partner?.substring(0, 50)}...
                          </div>
                          {/* Mobile-only contact info */}
                          <div className="space-y-1 text-xs md:hidden">
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3 text-gray-400" />
                              <span className="max-w-[120px] truncate">{application.email}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3 text-gray-400" />
                              <span>{application.phone}</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden p-3 sm:p-4 md:table-cell">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-3 w-3 text-gray-400" />
                            <span className="max-w-[120px] truncate">{application.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-3 w-3 text-gray-400" />
                            <span>{application.phone}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden p-3 sm:p-4 lg:table-cell">
                        <div className="space-y-1">
                          {application.instagram_handle && (
                            <div className="flex items-center gap-2 text-sm">
                              <Instagram className="h-3 w-3 text-pink-500" />
                              <span className="max-w-[100px] truncate">
                                @{application.instagram_handle}
                              </span>
                            </div>
                          )}
                          {application.follower_count && (
                            <div className="text-xs text-gray-500">
                              {application.follower_count} followers
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden p-3 sm:p-4 xl:table-cell">
                        <div className="space-y-1">
                          <Badge
                            variant={
                              application.owns_motorcycle === 'Yes' ? 'default' : 'secondary'
                            }
                            className="text-xs"
                          >
                            {application.owns_motorcycle === 'Yes' ? 'Has Bike' : 'No Bike'}
                          </Badge>
                          <div className="max-w-[100px] truncate text-xs text-gray-500">
                            {application.racing_experience || 'No experience'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="p-3 sm:p-4">
                        {getStatusBadge(application.status)}
                      </TableCell>
                      <TableCell className="hidden p-3 sm:table-cell sm:p-4">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="h-3 w-3" />
                          <span className="text-xs">
                            {new Date(application.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="p-3 sm:p-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-6 w-6 p-0 sm:h-8 sm:w-8">
                              <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleViewDetails(application)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            {application.status === 'pending' && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleStatusUpdate(application.id, 'approved')}
                                  className="text-green-600"
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleStatusUpdate(application.id, 'rejected')}
                                  className="text-red-600"
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Reject
                                </DropdownMenuItem>
                              </>
                            )}
                            {application.status === 'approved' && application.instagram_handle && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleOpenScraper(application)}
                                  className="text-blue-600"
                                >
                                  <Zap className="mr-2 h-4 w-4" />
                                  Scrape Profile
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="py-12 text-center">
          <div className="mb-4 text-gray-400">
            <Users className="mx-auto h-12 w-12 sm:h-16 sm:w-16" />
          </div>
          <h3 className="mb-2 text-base font-medium text-gray-900 sm:text-lg">
            No applications found
          </h3>
          <p className="text-sm text-gray-600 sm:text-base">
            No applications match your current filters.
          </p>
        </div>
      )}

      {/* Detail Dialog */}
      <ApplicationDetailDialog
        application={selectedApplication}
        open={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
      />

      {/* Profile Scraper Dialog */}
      <Dialog open={showScraperPanel} onOpenChange={setShowScraperPanel}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-600" />
              Profile Scraper Management
            </DialogTitle>
            <DialogDescription>
              {scraperApplicant
                ? `Manage Instagram scraping for ${scraperApplicant.full_name} (@${scraperApplicant.instagram_handle})`
                : 'Manage Instagram profile scraping jobs'}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <ProfileScraperPanel
              applicantId={scraperApplicant?.id}
              applicantName={scraperApplicant?.full_name}
              instagramHandle={scraperApplicant?.instagram_handle}
              showControls={true}
              compact={false}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
