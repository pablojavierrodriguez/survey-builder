import { NextRequest, NextResponse } from 'next/server'
import { 
  handleApiError, 
  withRateLimit, 
  withValidation, 
  withDatabaseConnection,
  formatSuccessResponse,
  validateSurveyRequest,
  withErrorHandling,
  createValidationError,
  createDatabaseError
} from '@/lib/error-handler'
import { sanitizeInput } from '@/lib/validation'
import { submitSurveyToDatabase } from '@/lib/database-config'
import logger from '@/lib/logger'

export async function POST(request: NextRequest) {
  const requestLogger = logger.createRequestLogger(request)
  
  try {
    await requestLogger.info('Survey submission request received', {
      method: request.method,
      url: request.url
    })

    // Rate limiting
    const rateLimitCheck = await withRateLimit(request, 'SURVEY_SUBMISSION')
    if (!rateLimitCheck.allowed) {
      await requestLogger.warn('Rate limit exceeded for survey submission', {
        clientIP: request.headers.get('x-forwarded-for') || 'unknown'
      })
      return NextResponse.json(rateLimitCheck.error, { status: 429 })
    }

    // Validate request body
    const validationResult = await withValidation(request, validateSurveyRequest)
    if (!validationResult.valid) {
      await requestLogger.warn('Survey validation failed', {
        error: validationResult.error?.message,
        details: validationResult.error?.details
      })
      return NextResponse.json(validationResult.error, { status: 400 })
    }

    // Sanitize text inputs
    const sanitizedData = {
      ...validationResult.data,
      main_challenge: validationResult.data?.main_challenge ? 
        sanitizeInput(validationResult.data.main_challenge) : '',
      email: validationResult.data?.email ? 
        sanitizeInput(validationResult.data.email) : ''
    }

    // Submit to database with error handling
    const dbResult = await withDatabaseConnection(request, async () => {
      return await submitSurveyToDatabase(sanitizedData)
    })

    if (!dbResult.success) {
      await requestLogger.error('Survey submission to database failed', {
        error: dbResult.error?.message,
        details: dbResult.error?.details
      }, dbResult.error)
      return NextResponse.json(dbResult.error, { status: 500 })
    }

    await requestLogger.info('Survey submitted successfully', {
      surveyId: dbResult.data?.id,
      duration: Date.now() - requestLogger.startTime
    })

    return NextResponse.json(formatSuccessResponse({
      message: 'Survey submitted successfully',
      surveyId: dbResult.data?.id
    }, requestLogger.requestId))

  } catch (error) {
    return await handleApiError(error, request)
  }
}

export async function GET() {
  const requestLogger = logger.createRequestLogger(new Request('GET', '/api/survey'))
  
  await requestLogger.warn('GET method not allowed on survey endpoint')
  
  return NextResponse.json({
    success: false,
    error: {
      code: 'METHOD_NOT_ALLOWED',
      message: 'GET method not allowed on this endpoint',
      timestamp: new Date().toISOString(),
      requestId: requestLogger.requestId
    },
    timestamp: new Date().toISOString(),
    requestId: requestLogger.requestId
  }, { status: 405 })
}