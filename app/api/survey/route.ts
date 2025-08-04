import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, getClientIP } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'
import { supabase } from '@/lib/supabase'
// Get table name from database settings
async function getTableName(): Promise<string> {
  if (!supabase) {
    return 'survey_responses' // fallback
  }
  
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('settings')
      .eq('environment', 'dev')
      .single()
    
    if (error || !data?.settings?.database?.tableName) {
      return 'survey_responses' // fallback
    }
    
    return data.settings.database.tableName
  } catch (error) {
    return 'survey_responses' // fallback
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const ip = getClientIP(request)
  
  logger.logRequest(requestId, 'POST', '/api/survey', ip)
  
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(ip, '/api/survey', 'SURVEY_SUBMISSION')
    if (!rateLimitResult.allowed) {
      logger.warn('Rate limit exceeded for survey submission', {
        requestId,
        ip,
        error: rateLimitResult.error
      })
      
      return NextResponse.json(
        { success: false, error: rateLimitResult.error || 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    // Check if Supabase is configured
    if (!supabase) {
      logger.error('Supabase not configured for survey submission', {
        requestId,
        ip
      })
      
      return NextResponse.json(
        { success: false, error: 'Survey system not available' },
        { status: 503 }
      )
    }

    // Parse request body
    const body = await request.json()
    
    if (!body || typeof body !== 'object') {
      logger.warn('Invalid survey data received', {
        requestId,
        ip,
        data: body
      })
      
      return NextResponse.json(
        { success: false, error: 'Invalid survey data' },
        { status: 400 }
      )
    }

    // Get dynamic table name from settings
    const tableName = await getTableName()

    // Prepare survey data
    const surveyData = {
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      session_id: requestId,
      source: 'web',
      user_agent: request.headers.get('user-agent') || '',
      ip_address: ip
    }

    // Insert survey response
    const dbStartTime = Date.now()
    const { data, error } = await supabase
      .from(tableName)
      .insert([surveyData])
      .select()
      .single()

    const dbDuration = Date.now() - dbStartTime

    if (error) {
      logger.error('Database error inserting survey response', {
        requestId,
        ip,
        error: error.message,
        duration: dbDuration
      })
      
      return NextResponse.json(
        { success: false, error: 'Failed to save survey response' },
        { status: 500 }
      )
    }

    logger.logDatabaseOperation('INSERT', tableName, true, dbDuration)
    logger.info('Survey response saved successfully', {
      requestId,
      ip,
      responseId: data?.id,
      tableName
    })

    const totalDuration = Date.now() - startTime
    logger.logResponse(requestId, 201, totalDuration)

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        message: 'Survey response saved successfully'
      }
    }, { status: 201 })

  } catch (error) {
    const totalDuration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    logger.error('Unexpected error in survey submission', {
      requestId,
      ip,
      error: errorMessage,
      duration: totalDuration
    }, error instanceof Error ? error : undefined)

    logger.logResponse(requestId, 500, totalDuration)

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const ip = getClientIP(request)
  
  logger.logRequest(requestId, 'GET', '/api/survey', ip)
  
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(ip, '/api/survey', 'API')
    if (!rateLimitResult.allowed) {
      logger.warn('Rate limit exceeded for survey config request', {
        requestId,
        ip,
        error: rateLimitResult.error
      })
      
      return NextResponse.json(
        { success: false, error: rateLimitResult.error || 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    // Return survey configuration
    const config = {
      title: "Product Community Survey",
      description: "Help us understand the product community better",
      thankYouMessage: "Thank you for your valuable feedback!",
      questions: [
        {
          id: "1",
          type: "single-choice",
          title: "What's your current role?",
          description: "Help us understand your background",
          options: [
            "Product Manager",
            "Product Owner",
            "Product Designer / UX/UI Designer (UXer)",
            "Product Engineer / Software Engineer (Developer)",
            "Data Analyst / Product Analyst",
            "Product Marketing Manager",
            "Engineering Manager / Tech Lead",
            "Design Manager / Design Lead",
            "QA Engineer / Test Engineer",
            "DevOps Engineer / Platform Engineer",
            "Technical Writer / Documentation",
            "Customer Success Manager",
            "Sales Engineer / Solutions Engineer",
            "Other"
          ],
          required: true,
          order: 1,
          isVisible: true
        },
        {
          id: "2",
          type: "single-choice",
          title: "What's your seniority level?",
          description: "Help us understand your experience",
          options: [
            "Junior (0-2 years)",
            "Mid-level (2-5 years)",
            "Senior (5-8 years)",
            "Staff/Principal (8+ years)",
            "Manager/Lead",
            "Director/VP",
            "C-level/Founder"
          ],
          required: true,
          order: 2,
          isVisible: true
        },
        {
          id: "3",
          type: "single-choice",
          title: "What type of company do you work for?",
          description: "Tell us about your company size and stage",
          options: [
            "Early-stage Startup (Pre-seed/Seed)",
            "Growth-stage Startup (Series A-C)",
            "Scale-up (Series D+)",
            "SME (Small/Medium Enterprise)",
            "Large Corporate (1000+ employees)",
            "Enterprise (10,000+ employees)",
            "Consultancy/Agency",
            "Freelance/Independent"
          ],
          required: true,
          order: 3,
          isVisible: true
        },
        {
          id: "4",
          type: "single-choice",
          title: "What industry do you work in?",
          description: "Help us understand your market",
          options: [
            "Technology/Software",
            "Financial Services/Fintech",
            "Healthcare/Medtech",
            "E-commerce/Retail",
            "Education/Edtech",
            "Media/Entertainment",
            "Manufacturing/Industrial",
            "Consulting/Professional Services",
            "Government/Public Sector",
            "Non-profit/NGO",
            "Other"
          ],
          required: true,
          order: 4,
          isVisible: true
        },
        {
          id: "5",
          type: "single-choice",
          title: "What type of product do you work on?",
          description: "Tell us about your product category",
          options: [
            "SaaS (B2B)",
            "SaaS (B2C)",
            "Mobile App",
            "Web Application",
            "E-commerce Platform",
            "API/Developer Tools",
            "Hardware + Software",
            "Services/Consulting",
            "Internal Tools",
            "Other"
          ],
          required: true,
          order: 5,
          isVisible: true
        },
        {
          id: "6",
          type: "single-choice",
          title: "What's your customer segment?",
          description: "Who do you build products for?",
          options: [
            "B2B Product",
            "B2C Product",
            "B2B2C Product",
            "Internal Product",
            "Mixed (B2B + B2C)"
          ],
          required: true,
          order: 6,
          isVisible: true
        },
        {
          id: "7",
          type: "text",
          title: "What's your main product-related challenge?",
          description: "Share what you're struggling with most",
          required: true,
          order: 7,
          isVisible: true
        },
        {
          id: "8",
          type: "multiple-choice",
          title: "What tools do you use daily?",
          description: "Select all that apply",
          options: [
            "Jira",
            "Figma",
            "Notion",
            "Miro",
            "Trello",
            "Asana",
            "Monday.com",
            "ClickUp",
            "Linear",
            "Slack",
            "Microsoft Teams",
            "Zoom",
            "Google Workspace",
            "Microsoft 365",
            "Confluence",
            "GitHub",
            "GitLab",
            "Bitbucket",
            "Sketch",
            "Adobe XD",
            "InVision",
            "Framer",
            "Webflow",
            "Airtable",
            "Coda",
            "Obsidian",
            "Roam Research",
            "Mural",
            "FigJam",
            "Whimsical",
            "Lucidchart",
            "Draw.io",
            "Canva",
            "Loom",
            "Other"
          ],
          required: true,
          order: 8,
          isVisible: true
        },
        {
          id: "9",
          type: "multiple-choice",
          title: "How do you learn about product?",
          description: "Select all that apply",
          options: [
            "Books",
            "Podcasts",
            "Courses",
            "Community",
            "Mentors",
            "Other"
          ],
          required: true,
          order: 9,
          isVisible: true
        },
        {
          id: "10",
          type: "salary-range",
          title: "What's your salary range?",
          description: "Help us understand compensation in the product community (optional)",
          required: false,
          order: 10,
          isVisible: true
        },
        {
          id: "11",
          type: "email",
          title: "Your email",
          description: "Optional - only if you'd like us to follow up",
          required: false,
          order: 11,
          isVisible: true
        }
      ],
      isActive: true
    }

    const totalDuration = Date.now() - startTime
    logger.logResponse(requestId, 200, totalDuration)

    return NextResponse.json({
      success: true,
      data: config
    })

  } catch (error) {
    const totalDuration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    logger.error('Unexpected error in survey config request', {
      requestId,
      ip,
      error: errorMessage,
      duration: totalDuration
    }, error instanceof Error ? error : undefined)

    logger.logResponse(requestId, 500, totalDuration)

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}