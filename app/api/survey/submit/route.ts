import { NextRequest, NextResponse } from 'next/server'
import { validateAndSanitize, surveyResponseSchema } from '@/lib/validation'
import { headers } from 'next/headers'

// Force Node.js runtime for survey submission
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Get client IP for logging and potential rate limiting
    const headersList = headers()
    const clientIP = headersList.get('x-forwarded-for') || 
                    headersList.get('x-real-ip') || 
                    request.ip || 
                    'unknown'

    // Parse and validate request body
    const body = await request.json()
    const validation = validateAndSanitize(surveyResponseSchema, body)
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid survey data',
          details: validation.errors 
        },
        { status: 400 }
      )
    }

    const surveyData = validation.data

    // Add metadata
    const surveyResponse = {
      ...surveyData,
      id: `survey_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      created_at: new Date().toISOString(),
      ip_address: clientIP, // Store for analytics (hash in production)
      user_agent: request.headers.get('user-agent') || 'unknown'
    }

    try {
      // Try to save to Supabase if available
      const supabaseUrl = process.env.SUPABASE_URL
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

      if (supabaseUrl && supabaseKey) {
        const response = await fetch(`${supabaseUrl}/rest/v1/pc_survey_data`, {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(surveyResponse)
        })

        if (!response.ok) {
          console.warn('Supabase save failed, falling back to local storage simulation')
        } else {
          console.log(`Survey response saved to Supabase for IP: ${clientIP}`)
          
          return NextResponse.json({
            success: true,
            message: 'Survey response submitted successfully',
            id: surveyResponse.id
          })
        }
      }
    } catch (error) {
      console.warn('Supabase save error:', error)
    }

    // Fallback: simulate local storage save (for demo)
    // In production, you'd want to save to a reliable database
    console.log(`Survey response received (demo mode) from IP: ${clientIP}:`, {
      id: surveyResponse.id,
      role: surveyData.role,
      seniority: surveyData.seniority,
      industry: surveyData.industry
    })

    return NextResponse.json({
      success: true,
      message: 'Survey response submitted successfully (demo mode)',
      id: surveyResponse.id
    })

  } catch (error) {
    console.error('Survey submission API error:', error)
    
    return NextResponse.json(
      { error: 'Failed to submit survey response' },
      { status: 500 }
    )
  }
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}