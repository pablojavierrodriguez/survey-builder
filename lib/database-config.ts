// Database configuration based on environment/branch
export interface DatabaseConfig {
  supabaseUrl: string
  anonKey: string
  tableName: string
  environment: 'dev' | 'main'
  isConfigured: boolean
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
  
  // Check if we have actual Supabase configuration
  const hasSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 
                         (typeof window !== 'undefined' && localStorage.getItem('supabase_url'))
  const hasSupabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                         (typeof window !== 'undefined' && localStorage.getItem('supabase_anon_key'))
  
  const baseConfig = {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 
                  (typeof window !== 'undefined' ? localStorage.getItem('supabase_url') : null) ||
                  "https://your-project.supabase.co",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
             (typeof window !== 'undefined' ? localStorage.getItem('supabase_anon_key') : null) ||
             "your_supabase_anon_key_here",
    isConfigured: !!(hasSupabaseUrl && hasSupabaseKey)
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
            environment: settings.database.tableName.includes('_dev') ? 'dev' : 'main',
            supabaseUrl: settings.database?.url || baseConfig.supabaseUrl,
            anonKey: settings.database?.apiKey || baseConfig.anonKey,
            isConfigured: !!(settings.database?.url && settings.database?.apiKey)
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
      tableName: "pc_survey_data_dev",
      environment: 'dev'
    }
  } else {
    return {
      ...baseConfig, 
      tableName: "pc_survey_data",
      environment: 'main'
    }
  }
}

// Helper function to get the API endpoint
export function getDatabaseEndpoint(path: string = ""): string {
  const config = getDatabaseConfig()
  
  // If not configured, return a placeholder that will fail gracefully
  if (!config.isConfigured) {
    return `${config.supabaseUrl}/rest/v1/${config.tableName}${path}`
  }
  
  return `${config.supabaseUrl}/rest/v1/${config.tableName}${path}`
}

// Helper function to get headers for Supabase requests
export function getDatabaseHeaders(): HeadersInit {
  const config = getDatabaseConfig()
  
  // If not configured, return headers that will fail gracefully
  if (!config.isConfigured) {
    return {
      "Content-Type": "application/json",
      "Accept": "application/json"
    }
  }
  
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
