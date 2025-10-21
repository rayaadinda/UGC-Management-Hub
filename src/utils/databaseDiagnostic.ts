import { supabase } from '@/lib/supabase'

/**
 * Database Diagnostic Utility
 * Helps identify and fix common database issues
 */

export interface DiagnosticResult {
  success: boolean
  tables: {
    ugc_content: { exists: boolean; count: number; sampleId?: string }
    scraped_instagram_posts: { exists: boolean; count: number }
    tdr_applications: { exists: boolean; count: number }
    weekly_reports: { exists: boolean; count: number }
  }
  issues: string[]
  recommendations: string[]
}

export async function runDatabaseDiagnostics(): Promise<DiagnosticResult> {
  const result: DiagnosticResult = {
    success: true,
    tables: {
      ugc_content: { exists: false, count: 0 },
      scraped_instagram_posts: { exists: false, count: 0 },
      tdr_applications: { exists: false, count: 0 },
      weekly_reports: { exists: false, count: 0 }
    },
    issues: [],
    recommendations: []
  }

  try {
    // Check ugc_content table
    try {
      const { data: ugcData, error: ugcError } = await supabase
        .from('ugc_content')
        .select('id, platform, author_username, status')
        .limit(1)

      if (ugcError) {
        result.issues.push(`ugc_content table error: ${ugcError.message}`)
        result.tables.ugc_content.exists = false
      } else {
        result.tables.ugc_content.exists = true
        result.tables.ugc_content.count = ugcData?.length || 0

        if (ugcData && ugcData.length > 0) {
          result.tables.ugc_content.sampleId = ugcData[0].id
        } else {
          result.issues.push('ugc_content table exists but has no records')
          result.recommendations.push('Add some sample UGC content to the database')
        }
      }
    } catch (error) {
      result.issues.push(`Failed to check ugc_content: ${error}`)
    }

    // Check scraped_instagram_posts table
    try {
      const { data: scrapedData, error: scrapedError } = await supabase
        .from('scraped_instagram_posts')
        .select('id, caption, media_type')
        .limit(1)

      if (scrapedError) {
        result.issues.push(`scraped_instagram_posts table error: ${scrapedError.message}`)
      } else {
        result.tables.scraped_instagram_posts.exists = true
        result.tables.scraped_instagram_posts.count = scrapedData?.length || 0
      }
    } catch (error) {
      result.issues.push(`Failed to check scraped_instagram_posts: ${error}`)
    }

    // Check tdr_applications table
    try {
      const { data: appData, error: appError } = await supabase
        .from('tdr_applications')
        .select('id, full_name, instagram_handle')
        .limit(1)

      if (appError) {
        result.issues.push(`tdr_applications table error: ${appError.message}`)
      } else {
        result.tables.tdr_applications.exists = true
        result.tables.tdr_applications.count = appData?.length || 0
      }
    } catch (error) {
      result.issues.push(`Failed to check tdr_applications: ${error}`)
    }

    // Check weekly_reports table
    try {
      const { data: reportData, error: reportError } = await supabase
        .from('weekly_reports')
        .select('id, title, status')
        .limit(1)

      if (reportError) {
        // This is expected if reporting system isn't set up yet
        result.tables.weekly_reports.exists = false
      } else {
        result.tables.weekly_reports.exists = true
        result.tables.weekly_reports.count = reportData?.length || 0
      }
    } catch (error) {
      result.issues.push(`Failed to check weekly_reports: ${error}`)
    }

    // Generate recommendations based on findings
    if (!result.tables.ugc_content.exists || result.tables.ugc_content.count === 0) {
      result.recommendations.push('Run the migration: 012_fix_ugc_content_and_migrations.sql')
      result.recommendations.push('This will create the ugc_content table with sample data')
    }

    if (!result.tables.scraped_instagram_posts.exists) {
      result.recommendations.push('The Instagram scraping functionality may not work properly')
    }

    if (!result.tables.tdr_applications.exists || result.tables.tdr_applications.count === 0) {
      result.recommendations.push('Add some sample TDR applications for testing')
    }

    // Determine overall success
    result.success = result.tables.ugc_content.exists && result.issues.length === 0

  } catch (error) {
    result.success = false
    result.issues.push(`Database diagnostic failed: ${error}`)
  }

  return result
}

/**
 * Create sample data for testing
 */
export async function createSampleData(): Promise<boolean> {
  try {
    // Create sample UGC content
    const { error: ugcError } = await supabase
      .from('ugc_content')
      .insert([
        {
          platform: 'instagram',
          author_username: 'testuser',
          content_url: 'https://instagram.com/p/sample',
          media_type: 'image',
          media_url: 'https://picsum.photos/600/400?random=1',
          caption: 'Test content for development #test',
          likes_count: 10,
          comments_count: 5,
          hashtags: ['test', 'development'],
          status: 'new'
        }
      ])

    if (ugcError) {
      console.error('Failed to create sample UGC content:', ugcError)
      return false
    }

    // Create sample TDR application
    const { error: appError } = await supabase
      .from('tdr_applications')
      .insert([
        {
          full_name: 'Test User',
          email: 'test@example.com',
          phone: '+1234567890',
          instagram_handle: 'testuser',
          status: 'approved'
        }
      ])

    if (appError) {
      console.error('Failed to create sample application:', appError)
      return false
    }

    return true
  } catch (error) {
    console.error('Failed to create sample data:', error)
    return false
  }
}

/**
 * Test a specific record by ID
 */
export async function testRecordAccess(table: string, id: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error(`Failed to access ${table} with ID ${id}:`, error)
      return false
    }

    console.log(`Successfully accessed ${table} record:`, data)
    return true
  } catch (error) {
    console.error(`Error testing ${table} access:`, error)
    return false
  }
}