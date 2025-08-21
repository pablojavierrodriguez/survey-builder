// =====================================================================================
// ENVIRONMENT CONFIGURATION - Centralized environment variable management
// =====================================================================================

/**
 * Standard environment variable names for Supabase configuration.
 * These are the canonical names that should be used throughout the application.
 */
export const ENV_VARS = {
  SUPABASE_URL: 'NEXT_PUBLIC_SUPABASE_URL',
  SUPABASE_ANON_KEY: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  SUPABASE_SERVICE_ROLE_KEY: 'SUPABASE_SERVICE_ROLE_KEY',
  NODE_ENV: 'NODE_ENV',
  APP_NAME: 'NEXT_PUBLIC_APP_NAME',
  APP_URL: 'NEXT_PUBLIC_APP_URL',
  MAINTENANCE_MODE: 'NEXT_PUBLIC_MAINTENANCE_MODE',
  ANALYTICS_ENABLED: 'NEXT_PUBLIC_ANALYTICS_ENABLED',
} as const

/**
 * Legacy environment variable names for backward compatibility.
 * These will be checked as fallbacks but should be migrated to standard names.
 */
export const LEGACY_ENV_VARS = {
  POSTGRES_SUPABASE_URL: 'POSTGRES_NEXT_PUBLIC_SUPABASE_URL',
  POSTGRES_SUPABASE_ANON_KEY: 'POSTGRES_NEXT_PUBLIC_SUPABASE_ANON_KEY',
  POSTGRES_SUPABASE_SERVICE_ROLE_KEY: 'POSTGRES_SUPABASE_SERVICE_ROLE_KEY',
  POSTGRES_SUPABASE_URL_ALT: 'POSTGRES_SUPABASE_URL',
  POSTGRES_SUPABASE_ANON_KEY_ALT: 'POSTGRES_SUPABASE_ANON_KEY',
} as const

export interface EnvironmentConfig {
  supabase: {
    url: string | null
    anonKey: string | null
    serviceRoleKey: string | null
    isConfigured: boolean
  }
  app: {
    name: string
    url: string
    environment: string
    maintenanceMode: boolean
    analyticsEnabled: boolean
  }
  validation: {
    errors: string[]
    warnings: string[]
  }
}

/**
 * Safely gets an environment variable with fallback support
 */
function getEnvVar(primaryKey: string, fallbackKeys: string[] = []): string | null {
  // Check primary key first
  const primaryValue = process.env[primaryKey]
  if (primaryValue && primaryValue.length > 0) {
    return primaryValue
  }

  // Check fallback keys
  for (const fallbackKey of fallbackKeys) {
    const fallbackValue = process.env[fallbackKey]
    if (fallbackValue && fallbackValue.length > 0) {
      return fallbackValue
    }
  }

  return null
}

/**
 * Validates that a value is a non-empty string
 */
function isValidString(value: string | null): value is string {
  return typeof value === 'string' && value.length > 0
}

/**
 * Validates a URL format
 */
function isValidUrl(value: string | null): boolean {
  if (!isValidString(value)) return false
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

/**
 * Gets the complete environment configuration with validation
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  const errors: string[] = []
  const warnings: string[] = []

  // Get Supabase configuration with fallbacks
  const supabaseUrl = getEnvVar(ENV_VARS.SUPABASE_URL, [
    LEGACY_ENV_VARS.POSTGRES_SUPABASE_URL,
    LEGACY_ENV_VARS.POSTGRES_SUPABASE_URL_ALT,
  ])

  const supabaseAnonKey = getEnvVar(ENV_VARS.SUPABASE_ANON_KEY, [
    LEGACY_ENV_VARS.POSTGRES_SUPABASE_ANON_KEY,
    LEGACY_ENV_VARS.POSTGRES_SUPABASE_ANON_KEY_ALT,
  ])

  const supabaseServiceRoleKey = getEnvVar(ENV_VARS.SUPABASE_SERVICE_ROLE_KEY, [
    LEGACY_ENV_VARS.POSTGRES_SUPABASE_SERVICE_ROLE_KEY,
  ])

  // Validate Supabase URL
  if (!isValidString(supabaseUrl)) {
    errors.push(`Missing required environment variable: ${ENV_VARS.SUPABASE_URL}`)
  } else if (!isValidUrl(supabaseUrl)) {
    errors.push(`Invalid URL format for ${ENV_VARS.SUPABASE_URL}: ${supabaseUrl}`)
  }

  // Validate Supabase Anon Key
  if (!isValidString(supabaseAnonKey)) {
    errors.push(`Missing required environment variable: ${ENV_VARS.SUPABASE_ANON_KEY}`)
  } else if (supabaseAnonKey.length < 100) {
    warnings.push(`${ENV_VARS.SUPABASE_ANON_KEY} seems too short (expected ~100+ characters)`)
  }

  // Service role key is optional for basic functionality
  if (!isValidString(supabaseServiceRoleKey)) {
    warnings.push(`Missing optional environment variable: ${ENV_VARS.SUPABASE_SERVICE_ROLE_KEY} (required for admin features)`)
  }

  // Check for legacy variables and warn about migration
  const legacyVarsFound: string[] = []
  Object.entries(LEGACY_ENV_VARS).forEach(([key, envVar]) => {
    if (process.env[envVar]) {
      legacyVarsFound.push(envVar)
    }
  })

  if (legacyVarsFound.length > 0) {
    warnings.push(
      `Legacy environment variables detected: ${legacyVarsFound.join(', ')}. ` +
      'Consider migrating to standard naming convention.'
    )
  }

  // Get app configuration
  const nodeEnv = getEnvVar(ENV_VARS.NODE_ENV) || 'development'
  const appName = getEnvVar(ENV_VARS.APP_NAME) || 'Product Survey App'
  const appUrl = getEnvVar(ENV_VARS.APP_URL) || 'http://localhost:3000'
  const maintenanceMode = getEnvVar(ENV_VARS.MAINTENANCE_MODE) === 'true'
  const analyticsEnabled = getEnvVar(ENV_VARS.ANALYTICS_ENABLED) !== 'false'

  const isSupabaseConfigured = isValidString(supabaseUrl) && isValidString(supabaseAnonKey)

  return {
    supabase: {
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
      serviceRoleKey: supabaseServiceRoleKey,
      isConfigured: isSupabaseConfigured,
    },
    app: {
      name: appName,
      url: appUrl,
      environment: nodeEnv,
      maintenanceMode,
      analyticsEnabled,
    },
    validation: {
      errors,
      warnings,
    },
  }
}

/**
 * Gets a safe environment config that won't throw errors
 */
export function getSafeEnvironmentConfig(): EnvironmentConfig {
  try {
    return getEnvironmentConfig()
  } catch (error) {
    console.error('Error getting environment configuration:', error)
    return {
      supabase: {
        url: null,
        anonKey: null,
        serviceRoleKey: null,
        isConfigured: false,
      },
      app: {
        name: 'Product Survey App',
        url: 'http://localhost:3000',
        environment: 'development',
        maintenanceMode: false,
        analyticsEnabled: true,
      },
      validation: {
        errors: ['Failed to load environment configuration'],
        warnings: [],
      },
    }
  }
}

/**
 * Validates environment configuration and logs issues
 */
export function validateEnvironment(): { isValid: boolean; hasWarnings: boolean } {
  const config = getSafeEnvironmentConfig()
  
  if (config.validation.errors.length > 0) {
    console.error('❌ Environment Configuration Errors:')
    config.validation.errors.forEach(error => console.error(`  - ${error}`))
  }
  
  if (config.validation.warnings.length > 0) {
    console.warn('⚠️ Environment Configuration Warnings:')
    config.validation.warnings.forEach(warning => console.warn(`  - ${warning}`))
  }
  
  if (config.validation.errors.length === 0 && config.validation.warnings.length === 0) {
    console.log('✅ Environment configuration is valid')
  }
  
  return {
    isValid: config.validation.errors.length === 0,
    hasWarnings: config.validation.warnings.length > 0,
  }
}

/**
 * Logs environment status for debugging
 */
export function logEnvironmentStatus(): void {
  const config = getSafeEnvironmentConfig()
  
  console.log('🔧 Environment Configuration Status:')
  console.log(`  Supabase URL: ${config.supabase.url ? '✅ Set' : '❌ Missing'}`)
  console.log(`  Supabase Anon Key: ${config.supabase.anonKey ? '✅ Set' : '❌ Missing'}`)
  console.log(`  Supabase Service Role: ${config.supabase.serviceRoleKey ? '✅ Set' : '⚠️ Missing'}`)
  console.log(`  App Environment: ${config.app.environment}`)
  console.log(`  App Name: ${config.app.name}`)
  console.log(`  Maintenance Mode: ${config.app.maintenanceMode ? '🔒 Enabled' : '🟢 Disabled'}`)
}