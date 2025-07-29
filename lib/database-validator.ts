import { getDatabaseConfig, checkDatabaseConnection } from './database-config'
import { getAppSettings, isMaintenanceMode } from './app-settings'

export interface DatabaseValidationResult {
  isValid: boolean
  isConfigured: boolean
  isConnected: boolean
  isMaintenanceMode: boolean
  error?: string
  details: {
    environment: string
    tableName: string
    supabaseUrl: string
    hasValidConfig: boolean
  }
}

/**
 * Comprehensive database validation
 * Checks if database is properly configured and working
 */
export async function validateDatabase(): Promise<DatabaseValidationResult> {
  const result: DatabaseValidationResult = {
    isValid: false,
    isConfigured: false,
    isConnected: false,
    isMaintenanceMode: false,
    details: {
      environment: 'unknown',
      tableName: 'unknown',
      supabaseUrl: 'unknown',
      hasValidConfig: false
    }
  }

  try {
    // 1. Check if maintenance mode is enabled
    const maintenanceMode = await isMaintenanceMode()
    result.isMaintenanceMode = maintenanceMode

    // 2. Get database configuration
    const config = await getDatabaseConfig()
    result.details.environment = config.environment
    result.details.tableName = config.tableName
    result.details.supabaseUrl = config.supabaseUrl

    // 3. Check if Supabase is configured
    const hasValidConfig = !!(config.supabaseUrl && 
                              config.anonKey && 
                              config.supabaseUrl !== 'https://your-project.supabase.co' &&
                              config.supabaseUrl !== '')
    
    result.details.hasValidConfig = hasValidConfig
    result.isConfigured = hasValidConfig

    if (!hasValidConfig) {
      result.error = 'Database not configured. Please configure Supabase settings.'
      return result
    }

    // 4. Test database connection
    const connectionTest = await checkDatabaseConnection()
    result.isConnected = connectionTest.connected

    if (!connectionTest.connected) {
      result.error = `Database connection failed: ${connectionTest.error}`
      return result
    }

    // 5. All checks passed
    result.isValid = true
    return result

  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown validation error'
    return result
  }
}

/**
 * Check if survey submission should be allowed
 * Returns true if database is valid OR user is admin
 */
export async function canSubmitSurvey(isAdmin: boolean = false): Promise<{
  allowed: boolean
  reason?: string
  validation: DatabaseValidationResult
}> {
  const validation = await validateDatabase()
  
  // If database is valid, allow submission
  if (validation.isValid) {
    return {
      allowed: true,
      validation
    }
  }

  // If user is admin, allow submission for testing
  if (isAdmin) {
    return {
      allowed: true,
      reason: 'Admin user - allowed for testing purposes',
      validation
    }
  }

  // Otherwise, block submission
  return {
    allowed: false,
    reason: validation.error || 'Database not properly configured',
    validation
  }
}

/**
 * Get database status for display
 */
export async function getDatabaseStatus(): Promise<{
  status: 'healthy' | 'configured' | 'unconfigured' | 'error'
  message: string
  details: DatabaseValidationResult
}> {
  const validation = await validateDatabase()

  if (validation.isValid) {
    return {
      status: 'healthy',
      message: 'Database is properly configured and connected',
      details: validation
    }
  }

  if (validation.isConfigured && !validation.isConnected) {
    return {
      status: 'error',
      message: 'Database configured but connection failed',
      details: validation
    }
  }

  if (!validation.isConfigured) {
    return {
      status: 'unconfigured',
      message: 'Database not configured',
      details: validation
    }
  }

  return {
    status: 'error',
    message: validation.error || 'Unknown database error',
    details: validation
  }
}