import { NextRequest, NextResponse } from 'next/server'
import { validateSurveyResponse, sanitizeInput } from '@/lib/validation'
import { rateLimit, getClientIP, RATE_LIMITS } from '@/lib/rate-limit'
import { logger, generateRequestId, withLogging } from '@/lib/logger'
import { supabase } from '@/lib/supabase'

async function handleSurveySubmission(request: NextRequest) {
  const requestId = generateRequestId()
  const clientIP = getClientIP(request)
  const requestLogger = logger.request(requestId, 'POST /api/survey')

  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(clientIP, '/api/survey', 'SURVEY_SUBMISSION')
    if (!rateLimitResult.allowed) {
      requestLogger.warn('Rate limit exceeded', { 
        ip: clientIP, 
        remaining: rateLimitResult.remaining,
        resetTime: rateLimitResult.resetTime 
      })
      return NextResponse.json(
        { 
          success: false, 
          error: rateLimitResult.error || 'Rate limit exceeded' 
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
      requestLogger.warn('Survey validation failed', { 
        errors: validation.details,
        ip: clientIP 
      })
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid survey data',
          details: validation.details 
        },
        { status: 400 }
      )
    }

    // Check if Supabase is configured
    if (!supabase) {
      requestLogger.error('Supabase not configured', { ip: clientIP })
      return NextResponse.json(
        { success: false, error: 'Survey submission temporarily unavailable' },
        { status: 503 }
      )
    }

    // Submit to database
    const { data, error } = await supabase
      .from('survey_data')
      .insert([validation.data])
      .select()

    if (error) {
      requestLogger.error('Database submission failed', error, { 
        ip: clientIP,
        surveyData: { ...validation.data, email: '[REDACTED]' }
      })
      return NextResponse.json(
        { success: false, error: 'Failed to submit survey' },
        { status: 500 }
      )
    }

    requestLogger.info('Survey submitted successfully', { 
      ip: clientIP,
      surveyId: data[0]?.id,
      hasEmail: !!validation.data.email
    })

    return NextResponse.json(
      { 
        success: true, 
        message: 'Survey submitted successfully',
        data: { id: data[0]?.id }
      },
      { status: 201 }
    )

  } catch (error) {
    requestLogger.error('Unexpected error in survey submission', error as Error, { 
      ip: clientIP 
    })
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Export the wrapped handler
export const POST = withLogging(handleSurveySubmission)