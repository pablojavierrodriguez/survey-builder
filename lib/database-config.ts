// Database configuration using Supabase app settings
import { getAppSettings, getSurveyTableName } from './app-settings'

export interface DatabaseConfig {
  supabaseUrl: string
  anonKey: string
  tableName: string
  environment: 'dev' | 'prod'
}

// Get current branch/environment from various sources
function getCurrentEnvironment(): 'dev' | 'prod' {
  // Check if we're in a specific environment
  if (typeof window !== 'undefined') {
    // Client-side detection
    const hostname = window.location.hostname
    
    // If hostname contains 'dev' or we're on localhost, consider it dev
    if (hostname.includes('dev') || hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
      return 'dev'
    }
    
    // Default to prod for client-side
    return 'prod'
  }
  
  // Server-side environment detection
  try {
    const nodeEnv = process.env.NODE_ENV
    const branch = process.env.BRANCH || process.env.VERCEL_GIT_COMMIT_REF
    
    // If we detect dev branch or development environment
    if (branch === 'dev' || nodeEnv === 'development') {
      return 'dev'
    }
  } catch (error) {
    // Fallback if environment variables are not accessible
    console.warn('Could not access environment variables:', error)
  }
  
  // Default to prod for production
  return 'prod'
}

// Get Supabase configuration
function getSupabaseConfig() {
  return {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ""
  }
}

export async function getDatabaseConfig(): Promise<DatabaseConfig> {
  const environment = getCurrentEnvironment()
  const baseConfig = getSupabaseConfig()
  
  try {
    // Get app settings from Supabase
    const appSettings = await getAppSettings()
    const tableName = await getSurveyTableName()
    
    return {
      ...baseConfig,
      tableName: tableName,
      environment: environment
    }
  } catch (error) {
    console.warn('⚠️ Could not fetch app settings, using fallback configuration:', error)
    
    // Fallback configuration
    const fallbackTableName = environment === 'dev' ? 'pc_survey_data_dev' : 'pc_survey_data'
    
    return {
      ...baseConfig,
      tableName: fallbackTableName,
      environment: environment
    }
  }
}

// Helper function to get the API endpoint
export async function getDatabaseEndpoint(path: string = ""): Promise<string> {
  const config = await getDatabaseConfig()
  return `${config.supabaseUrl}/rest/v1/${config.tableName}${path}`
}

// Helper function to get headers for Supabase requests
export async function getDatabaseHeaders(): Promise<HeadersInit> {
  const config = await getDatabaseConfig()
  return {
    "apikey": config.anonKey,
    "Authorization": `Bearer ${config.anonKey}`,
    "Content-Type": "application/json",
    "Prefer": "return=representation"
  }
}

// Function to check if any table exists
export async function ensureTableExists(tableName?: string): Promise<boolean> {
  const config = await getDatabaseConfig()
  const targetTable = tableName || config.tableName
  
  try {
    // Try to fetch from the specified table
    const response = await fetch(`${config.supabaseUrl}/rest/v1/${targetTable}?limit=1`, {
      headers: await getDatabaseHeaders()
    })
    
    if (response.ok) {
      return true // Table exists
    }
    
    // If table doesn't exist, log warning
    console.warn(`Table ${targetTable} may not exist. Status: ${response.status}`)
    return false
    
  } catch (error) {
    console.error(`Error checking table ${targetTable}:`, error)
    return false
  }
}

// Function to create dev table if it doesn't exist (backward compatibility)
export async function ensureDevTableExists(): Promise<boolean> {
  return ensureTableExists('pc_survey_data_dev')
}

// Function to submit survey data to Supabase
export async function submitSurveyToDatabase(surveyData: any): Promise<{ success: boolean; error?: string; data?: any }> {
  const config = await getDatabaseConfig()
  
  try {
    const response = await fetch(`${config.supabaseUrl}/rest/v1/${config.tableName}`, {
      method: 'POST',
      headers: await getDatabaseHeaders(),
      body: JSON.stringify({
        ...surveyData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Survey submission failed:', errorText)
      return { 
        success: false, 
        error: `HTTP ${response.status}: ${errorText}` 
      }
    }

    const data = await response.json()
    console.log('✅ Survey submitted to database:', data)
    return { success: true, data }
    
  } catch (error) {
    console.error('❌ Error submitting survey to database:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// Function to get database connection status
export async function checkDatabaseConnection(): Promise<{ 
  connected: boolean; 
  environment: string; 
  tableName: string; 
  error?: string 
}> {
  const config = await getDatabaseConfig()
  
  try {
    const response = await fetch(`${config.supabaseUrl}/rest/v1/${config.tableName}?limit=1`, {
      headers: await getDatabaseHeaders()
    })
    
    if (response.ok) {
      return {
        connected: true,
        environment: config.environment,
        tableName: config.tableName
      }
    } else {
      return {
        connected: false,
        environment: config.environment,
        tableName: config.tableName,
        error: `HTTP ${response.status}: ${await response.text()}`
      }
    }
  } catch (error) {
    return {
      connected: false,
      environment: config.environment,
      tableName: config.tableName,
      error: error instanceof Error ? error.message : 'Connection failed'
    }
  }
}

// Legacy synchronous functions for backward compatibility
export function getDatabaseConfigSync(): DatabaseConfig {
  const environment = getCurrentEnvironment()
  const baseConfig = getSupabaseConfig()
  
  // Use environment variables for table names
  const devTableName = process.env.NEXT_PUBLIC_DB_TABLE_DEV || 'pc_survey_data_dev'
  const prodTableName = process.env.NEXT_PUBLIC_DB_TABLE_PROD || 'pc_survey_data'
  
  // Select table name based on environment
  const tableName = environment === 'dev' ? devTableName : prodTableName
  
  return {
    ...baseConfig,
    tableName: tableName,
    environment: environment
  }
}

export function getDatabaseEndpointSync(path: string = ""): string {
  const config = getDatabaseConfigSync()
  return `${config.supabaseUrl}/rest/v1/${config.tableName}${path}`
}

export function getDatabaseHeadersSync(): HeadersInit {
  const config = getDatabaseConfigSync()
  return {
    "apikey": config.anonKey,
    "Authorization": `Bearer ${config.anonKey}`,
    "Content-Type": "application/json",
    "Prefer": "return=representation"
  }
}
