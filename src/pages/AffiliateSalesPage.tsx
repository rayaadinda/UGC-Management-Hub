import { useState } from 'react'
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  ShoppingCart,
  Target,
  Filter,
  Download,
  ExternalLink,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  MoreHorizontal,
  Award,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { pdfExportService } from '@/services/pdfExportService'
import { WeeklyReport } from '@/types'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  useAffiliateSales,
  useAffiliateStats,
  useUpdateSaleStatus,
  useBrandAmbassadors,
} from '@/hooks/useAffiliateSales'
import { useProductCategories } from '@/hooks/useAffiliateSales'
import { AffiliateSale, AffiliateSaleFilters, AffiliateSaleStatus } from '@/types'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Stats Card Component
interface StatsCardProps {
  title: string
  value: string | number
  change?: number
  changeType?: 'increase' | 'decrease'
  icon: React.ReactNode
  description?: string
}

function StatsCard({ title, value, change, changeType, icon, description }: StatsCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-8 w-8 text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
        {change !== undefined && (
          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            {changeType === 'increase' ? (
              <TrendingUp className="h-3 w-3 text-green-500" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500" />
            )}
            <span className={cn(changeType === 'increase' ? 'text-green-500' : 'text-red-500')}>
              {change}%
            </span>
            <span>from last month</span>
          </div>
        )}
        {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  )
}

// Sale Status Badge
function getStatusBadge(status: AffiliateSaleStatus) {
  switch (status) {
    case 'pending':
      return (
        <Badge
          variant="secondary"
          className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
        >
          <Clock className="mr-1 h-3 w-3" />
          Pending
        </Badge>
      )
    case 'confirmed':
      return (
        <Badge
          variant="secondary"
          className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
        >
          <CheckCircle className="mr-1 h-3 w-3" />
          Confirmed
        </Badge>
      )
    case 'paid':
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          <CheckCircle className="mr-1 h-3 w-3" />
          Paid
        </Badge>
      )
    case 'cancelled':
      return (
        <Badge variant="destructive">
          <XCircle className="mr-1 h-3 w-3" />
          Cancelled
        </Badge>
      )
    case 'disputed':
      return (
        <Badge
          variant="secondary"
          className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
        >
          <AlertCircle className="mr-1 h-3 w-3" />
          Disputed
        </Badge>
      )
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

// Format currency to Indonesian Rupiah
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function AffiliateSalesPage() {
  const [filters, setFilters] = useState<AffiliateSaleFilters>({})
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [selectedSale, setSelectedSale] = useState<AffiliateSale | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'brand_ambassador' | 'regular'>('all')

  const {
    data: sales,
    isLoading: salesLoading,
    error: salesError,
  } = useAffiliateSales({
    ...filters,
    affiliate_type: activeTab === 'all' ? 'all' : activeTab,
  })
  const { data: stats, isLoading: statsLoading } = useAffiliateStats({
    ...filters,
    affiliate_type: activeTab === 'all' ? 'all' : activeTab,
  })
  const { data: productCategories } = useProductCategories()
  const { data: brandAmbassadors } = useBrandAmbassadors()
  const updateStatus = useUpdateSaleStatus()

  const handleStatusUpdate = async (id: string, status: AffiliateSaleStatus) => {
    try {
      await updateStatus.mutateAsync({ id, status })
      toast.success(`Sale status updated to ${status}`)
    } catch (error) {
      toast.error('Failed to update sale status')
    }
  }

  const handleExportData = () => {
    // Export functionality would go here
    toast.success('Exporting sales data...')
  }

  const handleTestPDF = async () => {
    try {
      // Create a mock report for testing
      const mockReport: WeeklyReport = {
        id: 'test-affiliate-report',
        title: 'Affiliate Sales Performance Report',
        description:
          'Comprehensive analysis of affiliate sales performance and revenue generation.',
        report_period_start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        report_period_end: new Date().toISOString(),
        status: 'completed',
        generated_at: new Date().toISOString(),
        generated_by: 'system',
        template_id: undefined,
        file_url: undefined,
        metrics_summary: {
          total_content: stats?.total_affiliates || 0,
          average_engagement_rate: stats?.conversion_rate || 0,
          top_performing_content: [],
          hashtag_performance: [
            { hashtag: 'affiliatemarketing', usage_count: 25, avg_engagement_rate: 5.2 },
            { hashtag: 'sales', usage_count: 18, avg_engagement_rate: 4.8 },
          ],
          platform_comparison: [
            {
              platform: 'tiktok',
              content_count: Math.floor((stats?.total_affiliates || 0) * 0.7),
              avg_performance: 4.5,
            },
            {
              platform: 'instagram',
              content_count: Math.floor((stats?.total_affiliates || 0) * 0.3),
              avg_performance: 3.8,
            },
          ],
          time_based_insights: {
            best_posting_times: [18, 19, 20],
            peak_engagement_days: ['Monday', 'Wednesday', 'Friday'],
          },
        },
        ai_recommendations: [
          {
            id: 'test-rec-1',
            report_id: 'test-affiliate-report',
            category: 'engagement_optimization',
            title: 'Optimize TikTok Content Strategy',
            description:
              'Focus on creating more engaging video content during peak hours to increase conversion rates.',
            actionable_steps: [
              'Schedule posts between 6-8 PM for maximum visibility',
              'Use trending audio tracks to boost discoverability',
              'Include clear call-to-action for affiliate links',
              'Create before/after content to showcase product benefits',
            ],
            priority_level: 'high',
            estimated_impact: 0.8,
            confidence_score: 0.9,
            supporting_data: {
              current_engagement: 3.2,
              target_engagement: 5.5,
              best_hours: [18, 19, 20],
            },
            status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      toast.loading('Generating test PDF...', { id: 'test-pdf' })
      await pdfExportService.generateReportPDF(mockReport)
      toast.success('Test PDF downloaded successfully!', { id: 'test-pdf' })
    } catch (error) {
      console.error('Test PDF generation failed:', error)
      toast.error('Failed to generate test PDF', { id: 'test-pdf' })
    }
  }

  const handleViewDetails = (sale: AffiliateSale) => {
    setSelectedSale(sale)
    setIsDetailDialogOpen(true)
  }

  const clearFilters = () => {
    setFilters({})
  }

  if (salesError) {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-center">
        <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
        <h3 className="text-lg font-semibold">Failed to load affiliate sales</h3>
        <p className="text-muted-foreground">Please try again later</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Affiliate Sales</h1>
          <p className="text-muted-foreground">
            Track and manage affiliate sales performance across TikTok and Instagram
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsFiltersOpen(!isFiltersOpen)}>
            <Filter className="mr-2 h-4 w-4" />
            Filters
            {Object.values(filters).some((v) => v && v !== 'all') && (
              <Badge className="ml-2 flex h-5 w-5 items-center justify-center rounded-full p-0">
                {Object.values(filters).filter((v) => v && v !== 'all').length}
              </Badge>
            )}
          </Button>
          <Button onClick={handleExportData}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" onClick={handleTestPDF}>
            <Download className="mr-2 h-4 w-4" />
            Test PDF
          </Button>
        </div>
      </div>

      {/* Affiliate Type Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as 'all' | 'brand_ambassador' | 'regular')}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            All Affiliates
          </TabsTrigger>
          <TabsTrigger value="brand_ambassador" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Brand Ambassadors
            {brandAmbassadors && (
              <Badge
                variant="secondary"
                className="ml-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
              >
                {brandAmbassadors.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="regular" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Regular Affiliates
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6 space-y-6">
          {isFiltersOpen && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Search</label>
                    <Input
                      placeholder="Search sales..."
                      value={filters.search || ''}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <Select
                      value={filters.status || 'all'}
                      onValueChange={(value) => setFilters({ ...filters, status: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="disputed">Disputed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Platform</label>
                    <Select
                      value={filters.platform || 'all'}
                      onValueChange={(value) => setFilters({ ...filters, platform: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All platforms" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All platforms</SelectItem>
                        <SelectItem value="tiktok">TikTok</SelectItem>
                        <SelectItem value="instagram">Instagram</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Product Category</label>
                    <Select
                      value={filters.product_category || 'all'}
                      onValueChange={(value) =>
                        setFilters({ ...filters, product_category: value as any })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All categories</SelectItem>
                        {productCategories?.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={clearFilters}>
                    Clear filters
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats Cards */}
          {!statsLoading && stats && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              <StatsCard
                title="Total Sales"
                value={formatCurrency(stats.total_sales)}
                change={15.3}
                changeType="increase"
                icon={<DollarSign className="h-4 w-4" />}
                description="Revenue from affiliate sales"
              />
              <StatsCard
                title="Total Commission"
                value={formatCurrency(stats.total_commission)}
                change={12.1}
                changeType="increase"
                icon={<Award className="h-4 w-4" />}
                description="Commission paid to affiliates"
              />
              <StatsCard
                title="Active Affiliates"
                value={stats.total_affiliates}
                change={8.7}
                changeType="increase"
                icon={<Users className="h-4 w-4" />}
                description="Active affiliate partners"
              />
              <StatsCard
                title="Conversion Rate"
                value={`${stats.conversion_rate.toFixed(2)}%`}
                change={-2.4}
                changeType="decrease"
                icon={<Target className="h-4 w-4" />}
                description="Click-to-sale conversion rate"
              />
            </div>
          )}

          {/* Sales Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShoppingCart className="h-5 w-5" />
                Recent Sales
                {sales && (
                  <Badge variant="secondary" className="ml-auto">
                    {sales.length} sales
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {salesLoading ? (
                <div className="flex h-32 items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : sales && sales.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Affiliate</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Platform</TableHead>
                        <TableHead>Sale Amount</TableHead>
                        <TableHead>Commission</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="w-[70px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sales.slice(0, 10).map((sale) => (
                        <TableRow key={sale.id} className="hover:bg-muted/50">
                          <TableCell>
                            <div>
                              <div className="flex items-center gap-2 font-medium">
                                {sale.affiliate_name}
                                {sale.affiliate_type === 'brand_ambassador' && (
                                  <Badge variant="secondary" className="text-xs">
                                    <Award className="mr-1 h-3 w-3" />
                                    BA
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                @{sale.affiliate_username}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{sale.product_name}</div>
                              <div className="text-sm text-muted-foreground">
                                {sale.product_category}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {sale.platform}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(sale.sale_amount)}
                          </TableCell>
                          <TableCell className="font-medium text-green-600">
                            {formatCurrency(sale.commission_earned)}
                          </TableCell>
                          <TableCell>{getStatusBadge(sale.status)}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {format(new Date(sale.sale_date), 'MMM dd, yyyy')}
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleViewDetails(sale)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => window.open(sale.content_url, '_blank')}
                                >
                                  <ExternalLink className="mr-2 h-4 w-4" />
                                  View content
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                                {sale.status !== 'confirmed' && (
                                  <DropdownMenuItem
                                    onClick={() => handleStatusUpdate(sale.id, 'confirmed')}
                                  >
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Mark as confirmed
                                  </DropdownMenuItem>
                                )}
                                {sale.status !== 'paid' && (
                                  <DropdownMenuItem
                                    onClick={() => handleStatusUpdate(sale.id, 'paid')}
                                  >
                                    <DollarSign className="mr-2 h-4 w-4" />
                                    Mark as paid
                                  </DropdownMenuItem>
                                )}
                                {sale.status !== 'cancelled' && (
                                  <DropdownMenuItem
                                    onClick={() => handleStatusUpdate(sale.id, 'cancelled')}
                                    className="text-destructive"
                                  >
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Cancel sale
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <ShoppingCart className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-semibold">No sales found</h3>
                  <p className="text-muted-foreground">
                    {Object.values(filters).some((v) => v && v !== 'all')
                      ? 'Try adjusting your filters'
                      : 'Sales will appear here when affiliates generate revenue'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sale Detail Dialog */}
          <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Sale Details</DialogTitle>
                <DialogDescription>
                  Complete information about this affiliate sale
                </DialogDescription>
              </DialogHeader>
              {selectedSale && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Affiliate</label>
                      <p className="font-medium">{selectedSale.affiliate_name}</p>
                      <p className="text-sm text-muted-foreground">
                        @{selectedSale.affiliate_username}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Order ID</label>
                      <p className="font-medium">{selectedSale.order_id}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Product</label>
                      <p className="font-medium">{selectedSale.product_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedSale.product_category}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <div className="mt-1">{getStatusBadge(selectedSale.status)}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Sale Amount
                      </label>
                      <p className="text-lg font-semibold">
                        {formatCurrency(selectedSale.sale_amount)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Commission Rate
                      </label>
                      <p className="text-lg font-semibold">{selectedSale.commission_rate}%</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Commission Earned
                      </label>
                      <p className="text-lg font-semibold text-green-600">
                        {formatCurrency(selectedSale.commission_earned)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Content Views
                      </label>
                      <p className="font-medium">{selectedSale.content_views.toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Clicks</label>
                      <p className="font-medium">{selectedSale.click_count.toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Conversion Rate
                      </label>
                      <p className="font-medium">{selectedSale.conversion_rate.toFixed(4)}%</p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between">
                      <Button
                        variant="outline"
                        onClick={() => window.open(selectedSale.content_url, '_blank')}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View Content
                      </Button>
                      <div className="flex gap-2">
                        {selectedSale.status !== 'confirmed' && (
                          <Button onClick={() => handleStatusUpdate(selectedSale.id, 'confirmed')}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Confirm
                          </Button>
                        )}
                        {selectedSale.status === 'confirmed' && (
                          <Button onClick={() => handleStatusUpdate(selectedSale.id, 'paid')}>
                            <DollarSign className="mr-2 h-4 w-4" />
                            Mark as Paid
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  )
}
