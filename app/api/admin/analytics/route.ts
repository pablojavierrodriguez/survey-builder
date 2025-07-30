import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, getClientIP } from '@/lib/rate-limit'
import { createClient } from '@supabase/supabase-js'

// Get Supabase client for server-side operations
function getSupabaseClient() {
  const supabaseUrl = process.env.POSTGRES_NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.POSTGRES_NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    return null
  }
  
  return createClient(supabaseUrl, supabaseKey)
}

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request)
    const rateLimitResult = await rateLimit(
      clientIP,
      '/api/admin/analytics',
      'ADMIN'
    )

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          success: false, 
          error: rateLimitResult.error || 'Rate limit exceeded',
          timestamp: new Date().toISOString()
        },
        { status: 429 }
      )
    }

    const client = getSupabaseClient()
    if (!client) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database not configured',
          timestamp: new Date().toISOString()
        },
        { status: 503 }
      )
    }

    // Get table name from query params or use default
    const { searchParams } = new URL(request.url)
    const tableName = searchParams.get('table') || 'survey_data'

    // Fetch analytics data
    const { data: responses, error: responsesError } = await client
      .from(tableName)
      .select('*')

    if (responsesError) {
      console.error('Error fetching survey responses:', responsesError)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch analytics data',
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }

    // Process analytics data
    const analytics = {
      totalResponses: responses?.length || 0,
      roles: {},
      seniorityLevels: {},
      companyTypes: {},
      industries: {},
      productTypes: {},
      customerSegments: {},
      tools: {},
      learningMethods: {},
      salaryRanges: {},
      challenges: []
    }

    if (responses) {
      responses.forEach(response => {
        // Count roles
        analytics.roles[response.role] = (analytics.roles[response.role] || 0) + 1
        
        // Count seniority levels
        analytics.seniorityLevels[response.seniority_level] = (analytics.seniorityLevels[response.seniority_level] || 0) + 1
        
        // Count company types
        analytics.companyTypes[response.company_type] = (analytics.companyTypes[response.company_type] || 0) + 1
        
        // Count industries
        analytics.industries[response.industry] = (analytics.industries[response.industry] || 0) + 1
        
        // Count product types
        analytics.productTypes[response.product_type] = (analytics.productTypes[response.product_type] || 0) + 1
        
        // Count customer segments
        analytics.customerSegments[response.customer_segment] = (analytics.customerSegments[response.customer_segment] || 0) + 1
        
        // Count tools
        if (response.tools && Array.isArray(response.tools)) {
          response.tools.forEach(tool => {
            analytics.tools[tool] = (analytics.tools[tool] || 0) + 1
          })
        }
        
        // Count learning methods
        if (response.learning_methods && Array.isArray(response.learning_methods)) {
          response.learning_methods.forEach(method => {
            analytics.learningMethods[method] = (analytics.learningMethods[method] || 0) + 1
          })
        }
        
        // Count salary ranges
        if (response.salary_range) {
          analytics.salaryRanges[response.salary_range] = (analytics.salaryRanges[response.salary_range] || 0) + 1
        }
        
        // Collect challenges
        if (response.main_challenge) {
          analytics.challenges.push(response.main_challenge)
        }
      })
    }

    return NextResponse.json(
      { 
        success: true, 
        data: analytics,
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}