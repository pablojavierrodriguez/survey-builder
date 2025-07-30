// Comprehensive error handling system with consistent error responses
import { NextRequest, NextResponse } from 'next/server'
import { logger, LogLevel } from './logger'
import { rateLimit, getClientIP, RATE_LIMITS } from './rate-limit'
import { validateSurveyResponse, validateLogin, validateSignUp, validateAdminSettings } from './validation'

export interface ApiError {
  code: string
  message: string
  details?: any
  timestamp: string
  requestId?: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: ApiError
  timestamp: string
  requestId?: string
}

export class AppError extends Error {
  public statusCode: number
  public code: string
  public details?: any

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR', details?: any) {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
    this.code = code
    this.details = details
  }
}

// Common error types
export const ErrorTypes = {
  VALIDATION_ERROR: { code: 'VALIDATION_ERROR', statusCode: 400 },
  AUTHENTICATION_ERROR: { code: 'AUTHENTICATION_ERROR', statusCode: 401 },
  AUTHORIZATION_ERROR: { code: 'AUTHORIZATION_ERROR', statusCode: 403 },
  NOT_FOUND_ERROR: { code: 'NOT_FOUND_ERROR', statusCode: 404 },
  RATE_LIMIT_ERROR: { code: 'RATE_LIMIT_ERROR', statusCode: 429 },
  DATABASE_ERROR: { code: 'DATABASE_ERROR', statusCode: 500 },
  CONFIGURATION_ERROR: { code: 'CONFIGURATION_ERROR', statusCode: 500 },
  EXTERNAL_SERVICE_ERROR: { code: 'EXTERNAL_SERVICE_ERROR', statusCode: 502 },
  INTERNAL_ERROR: { code: 'INTERNAL_ERROR', statusCode: 500 }
} as const

// Error factory functions
export const createValidationError = (message: string, details?: any) => 
  new AppError(message, ErrorTypes.VALIDATION_ERROR.statusCode, ErrorTypes.VALIDATION_ERROR.code, details)

export const createAuthenticationError = (message: string = 'Authentication required') => 
  new AppError(message, ErrorTypes.AUTHENTICATION_ERROR.statusCode, ErrorTypes.AUTHENTICATION_ERROR.code)

export const createAuthorizationError = (message: string = 'Insufficient permissions') => 
  new AppError(message, ErrorTypes.AUTHORIZATION_ERROR.statusCode, ErrorTypes.AUTHORIZATION_ERROR.code)

export const createNotFoundError = (message: string = 'Resource not found') => 
  new AppError(message, ErrorTypes.NOT_FOUND_ERROR.statusCode, ErrorTypes.NOT_FOUND_ERROR.code)

export const createRateLimitError = (message: string = 'Rate limit exceeded') => 
  new AppError(message, ErrorTypes.RATE_LIMIT_ERROR.statusCode, ErrorTypes.RATE_LIMIT_ERROR.code)

export const createDatabaseError = (message: string, details?: any) => 
  new AppError(message, ErrorTypes.DATABASE_ERROR.statusCode, ErrorTypes.DATABASE_ERROR.code, details)

export const createConfigurationError = (message: string, details?: any) => 
  new AppError(message, ErrorTypes.CONFIGURATION_ERROR.statusCode, ErrorTypes.CONFIGURATION_ERROR.code, details)

export const createExternalServiceError = (message: string, details?: any) => 
  new AppError(message, ErrorTypes.EXTERNAL_SERVICE_ERROR.statusCode, ErrorTypes.EXTERNAL_SERVICE_ERROR.code, details)

// Error response formatter
export function formatErrorResponse(error: Error | AppError, requestId?: string): ApiResponse {
  const timestamp = new Date().toISOString()
  
  if (error instanceof AppError) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        timestamp,
        requestId
      },
      timestamp,
      requestId
    }
  }

  // Handle unknown errors
  return {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : error.message,
      details: process.env.NODE_ENV === 'production' ? undefined : { stack: error.stack },
      timestamp,
      requestId
    },
    timestamp,
    requestId
  }
}

// Success response formatter
export function formatSuccessResponse<T>(data: T, requestId?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
    requestId
  }
}

// Error handler middleware
export async function handleApiError(
  error: Error | AppError,
  request: NextRequest,
  userId?: string
): Promise<NextResponse> {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // Log the error
  await logger.error('API Error occurred', {
    requestId,
    error: error.message,
    stack: error.stack,
    url: request.url,
    method: request.method,
    userId
  }, error)

  // Format error response
  const errorResponse = formatErrorResponse(error, requestId)
  
  // Determine status code
  const statusCode = error instanceof AppError ? error.statusCode : 500

  return NextResponse.json(errorResponse, { status: statusCode })
}

// Rate limiting middleware
export async function withRateLimit(
  request: NextRequest,
  rateLimitType: keyof typeof RATE_LIMITS
): Promise<{ allowed: boolean; error?: AppError }> {
  const clientIP = getClientIP(request)
  const endpoint = new URL(request.url).pathname

  try {
    const result = await rateLimit(clientIP, endpoint, rateLimitType)
    
    if (!result.allowed) {
      return {
        allowed: false,
        error: createRateLimitError(result.error || 'Rate limit exceeded')
      }
    }

    return { allowed: true }
  } catch (error) {
    // If rate limiting fails, allow the request but log the error
    await logger.warn('Rate limiting failed, allowing request', {
      clientIP,
      endpoint,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, error instanceof Error ? error : undefined)
    
    return { allowed: true }
  }
}

// Validation middleware
export async function withValidation<T>(
  request: NextRequest,
  validator: (data: unknown) => { success: boolean; data?: T; error?: string; details?: any }
): Promise<{ valid: boolean; data?: T; error?: AppError }> {
  try {
    const body = await request.json()
    const result = validator(body)

    if (!result.success) {
      return {
        valid: false,
        error: createValidationError(result.error || 'Validation failed', result.details)
      }
    }

    return { valid: true, data: result.data }
  } catch (error) {
    return {
      valid: false,
      error: createValidationError('Invalid request body')
    }
  }
}

// Database connection middleware
export async function withDatabaseConnection(
  request: NextRequest,
  operation: () => Promise<any>
): Promise<{ success: boolean; data?: any; error?: AppError }> {
  const startTime = Date.now()
  
  try {
    const result = await operation()
    const duration = Date.now() - startTime

    await logger.logDatabaseOperation(
      'query',
      'unknown',
      true,
      duration
    )

    return { success: true, data: result }
  } catch (error) {
    const duration = Date.now() - startTime
    
    await logger.logDatabaseOperation(
      'query',
      'unknown',
      false,
      duration,
      error instanceof Error ? error : undefined
    )

    const message = error instanceof Error ? error.message : 'Database operation failed'
    return {
      success: false,
      error: createDatabaseError(message, { 
        operation: 'database_query',
        duration 
      })
    }
  }
}

// Authentication middleware
export async function withAuthentication(
  request: NextRequest,
  supabaseClient: any
): Promise<{ authenticated: boolean; user?: any; error?: AppError }> {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        authenticated: false,
        error: createAuthenticationError('Missing or invalid authorization header')
      }
    }

    const token = authHeader.substring(7)
    const { data: { user }, error } = await supabaseClient.auth.getUser(token)

    if (error || !user) {
      return {
        authenticated: false,
        error: createAuthenticationError('Invalid or expired token')
      }
    }

    return { authenticated: true, user }
  } catch (error) {
    return {
      authenticated: false,
      error: createAuthenticationError('Authentication failed')
    }
  }
}

// Authorization middleware
export async function withAuthorization(
  user: any,
  requiredRole: string = 'admin'
): Promise<{ authorized: boolean; error?: AppError }> {
  try {
    if (!user) {
      return {
        authorized: false,
        error: createAuthenticationError('User not authenticated')
      }
    }

    // Check if user has the required role
    if (user.role !== requiredRole) {
      return {
        authorized: false,
        error: createAuthorizationError(`Access denied. Required role: ${requiredRole}`)
      }
    }

    return { authorized: true }
  } catch (error) {
    return {
      authorized: false,
      error: createAuthorizationError('Authorization check failed')
    }
  }
}

// API wrapper for consistent error handling
export function withErrorHandling<T extends any[], R>(
  handler: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await handler(...args)
    } catch (error) {
      // Re-throw AppError instances
      if (error instanceof AppError) {
        throw error
      }

      // Convert other errors to AppError
      const message = error instanceof Error ? error.message : 'An unexpected error occurred'
      throw new AppError(message, 500, 'INTERNAL_ERROR', { 
        originalError: error instanceof Error ? error.stack : error 
      })
    }
  }
}

// Request validation helpers
export const validateSurveyRequest = (data: unknown) => validateSurveyResponse(data)
export const validateLoginRequest = (data: unknown) => validateLogin(data)
export const validateSignUpRequest = (data: unknown) => validateSignUp(data)
export const validateAdminSettingsRequest = (data: unknown) => validateAdminSettings(data)

// Utility function to check if response is an error
export function isErrorResponse(response: ApiResponse): response is ApiResponse & { error: ApiError } {
  return !response.success && response.error !== undefined
}

// Utility function to extract error from response
export function extractError(response: ApiResponse): ApiError | null {
  return isErrorResponse(response) ? response.error : null
}