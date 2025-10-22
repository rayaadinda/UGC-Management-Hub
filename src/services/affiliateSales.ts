import type {
  AffiliateSale,
  AffiliateSaleFilters,
  AffiliateStats,
  AffiliatePerformance,
  AffiliateSaleStatus
} from '../types'

// Mock data generation utilities
const generateId = () => Math.random().toString(36).substr(2, 9)
const randomDate = (start: Date, end: Date) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
const randomFloat = (min: number, max: number) => Math.random() * (max - min) + min
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min

// Sample affiliate names and products - Straw Hat Pirates Crew
const affiliateNames = [
  'Monkey D. Luffy', 'Roronoa Zoro', 'Nami', 'Usopp', 'Sanji', 'Tony Tony Chopper',
  'Nico Robin', 'Franky', 'Brook', 'Jinbe', 'Portgas D. Ace', 'Trafalgar D. Law',
  'Boa Hancock', 'Dracule Mihawk', 'Shanks'
]

const affiliateUsernames = [
  'king_of_pirates', 'pirate_hunter_zoro', 'cat_burglar_nami', 'god_usopp', 'black_leg_sanji',
  'doctor_chopper', 'devil_child_robin', 'iron_man_franky', 'soul_king_brook', 'first_mate_jinbe',
  'fire_fist_ace', 'surgeon_of_death', 'pirate_empress', 'hawk_eye_mihawk', 'red_haired_shanks'
]

const productNames = [
  'TDR Racing Helmet Pro', 'TDR Leather Jacket', 'TDR Sports Bike', 'TDR Racing Gloves',
  'TDR Motorcycle Boots', 'TDR Performance Exhaust', 'TDR Brake System', 'TDR Suspension Kit',
  'TDR Riding Jeans', 'TDR Racing Suit', 'TDR Street Helmet', 'TDR Casual Wear'
]

const productCategories = [
  'Helmets', 'Apparel', 'Motorcycles', 'Protection', 'Accessories', 'Performance Parts'
]

const statuses: AffiliateSaleStatus[] = ['pending', 'confirmed', 'paid', 'cancelled', 'disputed']

// Generate mock sales data
export const generateMockAffiliateSales = (count: number = 150, brandAmbassadors: string[] = []): AffiliateSale[] => {
  const sales: AffiliateSale[] = []
  const now = new Date()
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())

  // Create combined affiliate list with real brand ambassadors
  const allAffiliateNames = [...affiliateNames]
  const allAffiliateUsernames = [...affiliateUsernames]

  // Add real brand ambassadors to the list if they don't already exist
  brandAmbassadors.forEach((baName) => {
    if (!allAffiliateNames.includes(baName)) {
      allAffiliateNames.push(baName)
      // Generate username from name
      const username = baName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
      allAffiliateUsernames.push(username)
    }
  })

  for (let i = 0; i < count; i++) {
    const affiliateIndex = randomInt(0, allAffiliateNames.length - 1)
    const affiliateName = allAffiliateNames[affiliateIndex]
    const affiliateUsername = allAffiliateUsernames[affiliateIndex]
    const productIndex = randomInt(0, productNames.length - 1)
    const saleAmount = randomFloat(500000, 15000000) // IDR 500K - 15M
    const commissionRate = randomFloat(5, 15) / 100
    const commissionEarned = saleAmount * commissionRate
    const clickCount = randomInt(10, 500)
    const contentViews = randomInt(100, 10000)
    const saleDate = randomDate(sixMonthsAgo, now)

    const sale: AffiliateSale = {
      id: `sale_${generateId()}`,
      affiliate_name: affiliateName,
      affiliate_username: affiliateUsername,
      platform: Math.random() > 0.3 ? 'tiktok' : 'instagram',
      content_url: `https://tiktok.com/@${affiliateUsername}/video/${generateId()}`,
      product_name: productNames[productIndex],
      product_category: productCategories[productIndex % productCategories.length],
      sale_amount: parseFloat(saleAmount.toFixed(2)),
      commission_rate: parseFloat((commissionRate * 100).toFixed(2)),
      commission_earned: parseFloat(commissionEarned.toFixed(2)),
      sale_date: saleDate.toISOString(),
      status: statuses[randomInt(0, statuses.length - 1)],
      customer_id: `customer_${generateId()}`,
      order_id: `ORD-${randomInt(100000, 999999)}`,
      click_count: clickCount,
      conversion_rate: parseFloat(((1 / clickCount) * 100).toFixed(4)),
      content_views: contentViews,
      engagement_rate: parseFloat(randomFloat(1, 15).toFixed(2)),
      affiliate_type: brandAmbassadors.includes(affiliateName) ? 'brand_ambassador' : 'regular',
      created_at: saleDate.toISOString(),
      updated_at: saleDate.toISOString()
    }

    sales.push(sale)
  }

  // Ensure each brand ambassador has at least some sales
  brandAmbassadors.forEach((baName) => {
    const existingSales = sales.filter(s => s.affiliate_name === baName).length
    const minSales = Math.max(3, Math.floor(count * 0.1 / brandAmbassadors.length)) // At least 3 sales or 10% of total sales distributed

    for (let j = existingSales; j < minSales; j++) {
      const productIndex = randomInt(0, productNames.length - 1)
      const saleAmount = randomFloat(500000, 15000000)
      const commissionRate = randomFloat(8, 15) / 100 // Higher commission for brand ambassadors
      const commissionEarned = saleAmount * commissionRate
      const clickCount = randomInt(20, 800) // Higher engagement for brand ambassadors
      const contentViews = randomInt(200, 15000)
      const saleDate = randomDate(sixMonthsAgo, now)

      // Generate username for brand ambassador
      const username = baName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')

      const sale: AffiliateSale = {
        id: `sale_${generateId()}`,
        affiliate_name: baName,
        affiliate_username: username,
        platform: Math.random() > 0.4 ? 'tiktok' : 'instagram', // Slightly more TikTok for brand ambassadors
        content_url: `https://tiktok.com/@${username}/video/${generateId()}`,
        product_name: productNames[productIndex],
        product_category: productCategories[productIndex % productCategories.length],
        sale_amount: parseFloat(saleAmount.toFixed(2)),
        commission_rate: parseFloat((commissionRate * 100).toFixed(2)),
        commission_earned: parseFloat(commissionEarned.toFixed(2)),
        sale_date: saleDate.toISOString(),
        status: statuses[randomInt(0, statuses.length - 1)],
        customer_id: `customer_${generateId()}`,
        order_id: `ORD-${randomInt(100000, 999999)}`,
        click_count: clickCount,
        conversion_rate: parseFloat(((1 / clickCount) * 100).toFixed(4)),
        content_views: contentViews,
        engagement_rate: parseFloat(randomFloat(3, 18).toFixed(2)), // Higher engagement
        affiliate_type: 'brand_ambassador',
        created_at: saleDate.toISOString(),
        updated_at: saleDate.toISOString()
      }

      sales.push(sale)
    }
  })

  return sales.sort((a, b) => new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime())
}

// Calculate affiliate statistics
export const calculateAffiliateStats = (sales: AffiliateSale[]): AffiliateStats => {
  const confirmedSales = sales.filter(sale => sale.status === 'confirmed' || sale.status === 'paid')
  const totalSales = confirmedSales.reduce((sum, sale) => sum + sale.sale_amount, 0)
  const totalCommission = confirmedSales.reduce((sum, sale) => sum + sale.commission_earned, 0)
  const totalClicks = sales.reduce((sum, sale) => sum + sale.click_count, 0)
  const uniqueAffiliates = new Set(sales.map(sale => sale.affiliate_name)).size
  const averageOrderValue = confirmedSales.length > 0 ? totalSales / confirmedSales.length : 0
  const conversionRate = totalClicks > 0 ? (confirmedSales.length / totalClicks) * 100 : 0

  // Find top performer
  const affiliatePerformance = sales.reduce((acc, sale) => {
    if (!acc[sale.affiliate_name]) {
      acc[sale.affiliate_name] = {
        affiliate_name: sale.affiliate_name,
        affiliate_username: sale.affiliate_username,
        total_sales: 0,
        total_commission: 0,
        orders_count: 0
      }
    }

    if (sale.status === 'confirmed' || sale.status === 'paid') {
      acc[sale.affiliate_name].total_sales += sale.sale_amount
      acc[sale.affiliate_name].total_commission += sale.commission_earned
      acc[sale.affiliate_name].orders_count += 1
    }

    return acc
  }, {} as Record<string, any>)

  const topPerformer = Object.values(affiliatePerformance)
    .sort((a: any, b: any) => b.total_sales - a.total_sales)[0] as any || null

  // Monthly trend (last 6 months)
  const monthlyTrend = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const month = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthSales = confirmedSales.filter(sale => {
      const saleDate = new Date(sale.sale_date)
      return saleDate.getMonth() === month.getMonth() && saleDate.getFullYear() === month.getFullYear()
    })

    monthlyTrend.push({
      month: month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      sales: monthSales.reduce((sum, sale) => sum + sale.sale_amount, 0),
      commission: monthSales.reduce((sum, sale) => sum + sale.commission_earned, 0),
      orders: monthSales.length
    })
  }

  // Category performance
  const categoryPerformance = sales.reduce((acc, sale) => {
    if (!acc[sale.product_category]) {
      acc[sale.product_category] = {
        category: sale.product_category,
        sales: 0,
        commission: 0,
        orders: 0
      }
    }

    if (sale.status === 'confirmed' || sale.status === 'paid') {
      acc[sale.product_category].sales += sale.sale_amount
      acc[sale.product_category].commission += sale.commission_earned
      acc[sale.product_category].orders += 1
    }

    return acc
  }, {} as Record<string, any>)

  // Affiliate ranking
  const affiliateRanking = Object.values(affiliatePerformance)
    .map((perf: any) => ({
      ...perf,
      conversion_rate: 0 // Will be calculated based on clicks/sales ratio
    }))
    .sort((a: any, b: any) => b.total_sales - a.total_sales)
    .slice(0, 10)

  return {
    total_sales: parseFloat(totalSales.toFixed(2)),
    total_commission: parseFloat(totalCommission.toFixed(2)),
    average_order_value: parseFloat(averageOrderValue.toFixed(2)),
    conversion_rate: parseFloat(conversionRate.toFixed(2)),
    total_clicks: totalClicks,
    total_affiliates: uniqueAffiliates,
    top_performer: topPerformer,
    monthly_trend: monthlyTrend,
    category_performance: Object.values(categoryPerformance),
    affiliate_ranking: affiliateRanking
  }
}

// Filter sales data
export const filterAffiliateSales = (sales: AffiliateSale[], filters: AffiliateSaleFilters): AffiliateSale[] => {
  return sales.filter(sale => {
    // Status filter
    if (filters.status && filters.status !== 'all' && sale.status !== filters.status) {
      return false
    }

    // Platform filter
    if (filters.platform && filters.platform !== 'all' && sale.platform !== filters.platform) {
      return false
    }

    // Affiliate name filter
    if (filters.affiliate_name && !sale.affiliate_name.toLowerCase().includes(filters.affiliate_name.toLowerCase())) {
      return false
    }

    // Product category filter
    if (filters.product_category && filters.product_category !== 'all' && sale.product_category !== filters.product_category) {
      return false
    }

    // Affiliate type filter
    if (filters.affiliate_type && filters.affiliate_type !== 'all' && sale.affiliate_type !== filters.affiliate_type) {
      return false
    }

    // Date range filter
    if (filters.date_range) {
      const saleDate = new Date(sale.sale_date)
      const startDate = new Date(filters.date_range.start)
      const endDate = new Date(filters.date_range.end)

      if (saleDate < startDate || saleDate > endDate) {
        return false
      }
    }

    // Amount range filter
    if (filters.min_amount && sale.sale_amount < filters.min_amount) {
      return false
    }
    if (filters.max_amount && sale.sale_amount > filters.max_amount) {
      return false
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const searchableFields = [
        sale.affiliate_name,
        sale.affiliate_username,
        sale.product_name,
        sale.product_category,
        sale.order_id
      ].join(' ').toLowerCase()

      if (!searchableFields.includes(searchLower)) {
        return false
      }
    }

    return true
  })
}

// Mock service API functions
export const affiliateSalesService = {
  async getSales(filters?: AffiliateSaleFilters, brandAmbassadors: string[] = []): Promise<AffiliateSale[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))

    const allSales = generateMockAffiliateSales(150, brandAmbassadors)
    return filters ? filterAffiliateSales(allSales, filters) : allSales
  },

  async getStats(filters?: AffiliateSaleFilters, brandAmbassadors: string[] = []): Promise<AffiliateStats> {
    await new Promise(resolve => setTimeout(resolve, 300))

    const allSales = generateMockAffiliateSales(150, brandAmbassadors)
    const filteredSales = filters ? filterAffiliateSales(allSales, filters) : allSales
    return calculateAffiliateStats(filteredSales)
  },

  async updateSaleStatus(saleId: string, status: AffiliateSaleStatus): Promise<AffiliateSale> {
    await new Promise(resolve => setTimeout(resolve, 200))

    const allSales = generateMockAffiliateSales(150, [])
    const sale = allSales.find(s => s.id === saleId)

    if (!sale) {
      throw new Error('Sale not found')
    }

    sale.status = status
    sale.updated_at = new Date().toISOString()

    return sale
  },

  async getAffiliatePerformance(affiliateName: string): Promise<AffiliatePerformance | null> {
    await new Promise(resolve => setTimeout(resolve, 200))

    const allSales = generateMockAffiliateSales(150, [])
    const affiliateSales = allSales.filter(sale => sale.affiliate_name === affiliateName)

    if (affiliateSales.length === 0) {
      return null
    }

    const confirmedSales = affiliateSales.filter(sale => sale.status === 'confirmed' || sale.status === 'paid')
    const totalSales = confirmedSales.reduce((sum, sale) => sum + sale.sale_amount, 0)
    const totalCommission = confirmedSales.reduce((sum, sale) => sum + sale.commission_earned, 0)
    const totalClicks = affiliateSales.reduce((sum, sale) => sum + sale.click_count, 0)
    const totalViews = affiliateSales.reduce((sum, sale) => sum + sale.content_views, 0)
    const averageOrderValue = confirmedSales.length > 0 ? totalSales / confirmedSales.length : 0
    const conversionRate = totalClicks > 0 ? (confirmedSales.length / totalClicks) * 100 : 0
    const clickThroughRate = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0
    const avgEngagementRate = affiliateSales.reduce((sum, sale) => sum + sale.engagement_rate, 0) / affiliateSales.length

    return {
      affiliate_name: affiliateName,
      affiliate_username: affiliateSales[0].affiliate_username,
      total_sales: parseFloat(totalSales.toFixed(2)),
      total_commission: parseFloat(totalCommission.toFixed(2)),
      orders_count: confirmedSales.length,
      average_order_value: parseFloat(averageOrderValue.toFixed(2)),
      conversion_rate: parseFloat(conversionRate.toFixed(2)),
      click_through_rate: parseFloat(clickThroughRate.toFixed(2)),
      engagement_rate: parseFloat(avgEngagementRate.toFixed(2)),
      content_count: affiliateSales.length,
      trending_status: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'stable' : 'down',
      performance_score: parseFloat(randomFloat(60, 95).toFixed(1))
    }
  }
}