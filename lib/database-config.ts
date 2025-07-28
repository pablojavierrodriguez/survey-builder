// Database configuration for Vercel + Supabase native integration
export interface DatabaseConfig {
  supabaseUrl: string
  anonKey: string
  tableName: string
  environment: 'dev' | 'main'
}

// Get current branch/environment from various sources
function getCurrentEnvironment(): 'dev' | 'main' {
  // Check if we're in a specific environment
  if (typeof window !== 'undefined') {
    // Client-side detection
    const hostname = window.location.hostname
    
    // If hostname contains 'dev' or we're on localhost, consider it dev
    if (hostname.includes('dev') || hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
      return 'dev'
    }
    
    // Default to main for client-side
    return 'main'
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
  
  // Default to main for production
  return 'main'
}

export function getDatabaseConfig(): DatabaseConfig {
  const environment = getCurrentEnvironment()
  
  // Use Vercel's native Supabase integration environment variables
  const baseConfig = {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ""
  }
  
  // Check if user has manually configured a table name in localStorage
  if (typeof window !== 'undefined') {
    const savedSettings = localStorage.getItem("app_settings")
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings)
        if (settings.database?.tableName) {
          return {
            ...baseConfig,
            tableName: settings.database.tableName,
            environment: settings.database.tableName.includes('_dev') ? 'dev' : 'main'
          }
        }
      } catch (error) {
        console.warn('Error parsing saved database settings:', error)
      }
    }
  }
  
  // Default behavior based on environment
  if (environment === 'dev') {
    return {
      ...baseConfig,
      tableName: process.env.NEXT_PUBLIC_DB_TABLE_DEV || "pc_survey_data_dev",
      environment: 'dev'
    }
  } else {
    return {
      ...baseConfig, 
      tableName: process.env.NEXT_PUBLIC_DB_TABLE_PROD || "pc_survey_data",
      environment: 'main'
    }
  }
}

// Helper function to get the API endpoint
export function getDatabaseEndpoint(path: string = ""): string {
  const config = getDatabaseConfig()
  return `${config.supabaseUrl}/rest/v1/${config.tableName}${path}`
}

// Helper function to get headers for Supabase requests
export function getDatabaseHeaders(): HeadersInit {
  const config = getDatabaseConfig()
  return {
    "apikey": config.anonKey,
    "Authorization": `Bearer ${config.anonKey}`,
    "Content-Type": "application/json",
    "Prefer": "return=representation"
  }
}

// Function to check if any table exists
export async function ensureTableExists(tableName?: string): Promise<boolean> {
  const config = getDatabaseConfig()
  const targetTable = tableName || config.tableName
  
  try {
    // Try to fetch from the specified table
    const response = await fetch(`${config.supabaseUrl}/rest/v1/${targetTable}?limit=1`, {
      headers: getDatabaseHeaders()
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
  const config = getDatabaseConfig()
  
  try {
    const response = await fetch(`${config.supabaseUrl}/rest/v1/${config.tableName}`, {
      method: 'POST',
      headers: getDatabaseHeaders(),
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
  const config = getDatabaseConfig()
  
  try {
    const response = await fetch(`${config.supabaseUrl}/rest/v1/${config.tableName}?limit=1`, {
      headers: getDatabaseHeaders()
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
