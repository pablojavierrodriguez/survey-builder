import { getDatabaseConfig, checkDatabaseConnection } from './database-config'
import { getConfig } from './config-manager'

export interface DatabaseValidationResult {
  isValid: boolean
  status: 'connected' | 'not_configured' | 'connection_failed'
  environment: string
  tableName: string
  error?: string
}

export async function validateDatabase(): Promise<DatabaseValidationResult> {
  try {
    // Get database configuration
    const config = getDatabaseConfig()
    
    if (!config.supabaseUrl || !config.anonKey) {
      return {
        isValid: false,
        status: 'not_configured',
        environment: config.environment,
        tableName: config.tableName,
        error: 'Database not configured'
      }
    }

    // Check database connection
    const connectionResult = await checkDatabaseConnection()
    
    if (connectionResult.connected) {
      return {
        isValid: true,
        status: 'connected',
        environment: config.environment,
        tableName: connectionResult.tableName
      }
    } else {
      return {
        isValid: false,
        status: 'connection_failed',
        environment: config.environment,
        tableName: connectionResult.tableName,
        error: connectionResult.error
      }
    }
  } catch (error) {
    return {
      isValid: false,
      status: 'connection_failed',
      environment: 'unknown',
      tableName: 'unknown',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function isMaintenanceMode(): Promise<boolean> {
  try {
    const config = await getConfig()
    return config.general.maintenanceMode
  } catch (error) {
    console.error('Error checking maintenance mode:', error)
    return false
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

  if (validation.status === 'not_configured') {
    return {
      status: 'unconfigured',
      message: 'Database not configured',
      details: validation
    }
  }

  if (validation.status === 'connection_failed') {
    return {
      status: 'error',
      message: 'Database configured but connection failed',
      details: validation
    }
  }

  return {
    status: 'error',
    message: validation.error || 'Unknown database error',
    details: validation
  }
}