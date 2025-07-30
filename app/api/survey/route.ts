import { NextRequest, NextResponse } from 'next/server'
import { validateSurveyResponse, sanitizeInput } from '@/lib/validation'
import { rateLimit, getClientIP, RATE_LIMITS } from '@/lib/rate-limit'
import { submitSurveyToDatabase } from '@/lib/database-config'
import { logger, getClientIP as getIP } from '@/lib/logger'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const clientIP = getClientIP(request)
  const userAgent = request.headers.get('user-agent') || 'unknown'
  
  try {
    // Log request
    logger.logRequest('POST', '/api/survey', clientIP, userAgent)
    
    // Rate limiting
    const rateLimitResult = await rateLimit(
      clientIP,
      '/api/survey',
      'SURVEY_SUBMISSION'
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
      return NextResponse.json(
        { 
          success: false, 
          error: validation.error,
          details: validation.details,
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    // Submit to database
    const result = await submitSurveyToDatabase(validation.data)
    
    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || 'Failed to save survey response',
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }

    const responseTime = Date.now() - startTime
    logger.logResponse('POST', '/api/survey', 201, responseTime)
    
    return NextResponse.json(
      { 
        success: true, 
        message: 'Survey submitted successfully',
        timestamp: new Date().toISOString()
      },
      { status: 201 }
    )

  } catch (error) {
    const responseTime = Date.now() - startTime
    logger.logResponse('POST', '/api/survey', 500, responseTime)
    logger.error('Survey submission error', error as Error)
    
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