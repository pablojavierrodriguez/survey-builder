import { NextRequest, NextResponse } from 'next/server'
import { validateSurveyResponse, sanitizeInput } from '@/lib/validation'
import { rateLimit, getClientIP } from '@/lib/rate-limit'
import { submitSurveyToDatabase } from '@/lib/database-config'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const clientIP = getClientIP(request)
  
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(clientIP, '/api/survey', 'SURVEY_SUBMISSION')
    if (!rateLimitResult.allowed) {
      return NextResponse.json({
        success: false,
        error: rateLimitResult.error || 'Rate limit exceeded',
        timestamp: new Date().toISOString()
      }, { status: 429 })
    }

    // Parse and validate request body
    const body = await request.json()
    
    // Sanitize text inputs
    if (body.main_challenge) {
      body.main_challenge = sanitizeInput(body.main_challenge)
    }
    if (body.email) {
      body.email = sanitizeInput(body.email)
    }

    // Validate survey response
    const validation = validateSurveyResponse(body)
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid survey data',
        details: validation.details || validation.error,
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    // Submit to database
    const result = await submitSurveyToDatabase(validation.data)
    
    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to save survey response',
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }

    const responseTime = Date.now() - startTime
    
    return NextResponse.json({
      success: true,
      message: 'Survey submitted successfully',
      data: { id: result.id },
      timestamp: new Date().toISOString(),
      metadata: {
        responseTime: `${responseTime}ms`,
        rateLimitRemaining: rateLimitResult.remaining
      }
    })

  } catch (error) {
    const responseTime = Date.now() - startTime
    logger.error('Survey submission failed', {
      clientIP,
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, error instanceof Error ? error : undefined)

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed',
    timestamp: new Date().toISOString()
  }, { status: 405 })
}