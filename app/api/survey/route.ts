import { NextRequest, NextResponse } from 'next/server'
import { validateSurveyResponse, sanitizeInput } from '@/lib/validation'
import { rateLimit, getClientIP } from '@/lib/rate-limit'
import { submitSurveyToDatabase } from '@/lib/database-config'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const clientIP = getClientIP(request)
  
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(clientIP, '/api/survey', 'SURVEY_SUBMISSION')
    if (!rateLimitResult.allowed) {
      console.warn(`Rate limit exceeded for IP ${clientIP}: ${rateLimitResult.error}`)
      return NextResponse.json({
        success: false,
        error: rateLimitResult.error,
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
      console.warn(`Survey validation failed for IP ${clientIP}:`, validation.error)
      return NextResponse.json({
        success: false,
        error: 'Invalid survey data',
        details: validation.details,
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    // Submit to database
    const result = await submitSurveyToDatabase(validation.data)
    
    if (!result.success) {
      console.error(`Survey submission failed for IP ${clientIP}:`, result.error)
      return NextResponse.json({
        success: false,
        error: 'Failed to save survey response',
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }

    const duration = Date.now() - startTime
    console.log(`Survey submitted successfully in ${duration}ms for IP ${clientIP}`)

    return NextResponse.json({
      success: true,
      message: 'Survey submitted successfully',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`Survey API error for IP ${clientIP} after ${duration}ms:`, error)
    
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