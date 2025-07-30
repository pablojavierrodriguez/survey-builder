import { checkDatabaseConnection } from './database-config'
import { getAppConfig } from './config-manager'

// Check if database is properly configured and accessible
export async function isDatabaseConfigured(): Promise<boolean> {
  try {
    const connection = await checkDatabaseConnection()
    return connection.success
  } catch (error) {
    console.error('Error checking database configuration:', error)
    return false
  }
}

// Check if user has admin privileges
export async function isUserAdmin(userId?: string): Promise<boolean> {
  if (!userId) return false
  
  try {
    const { supabase } = await import('./supabase')
    if (!supabase) return false

    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error checking admin status:', error)
      return false
    }

    return data?.role === 'admin'
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}

// Check if app is in maintenance mode
export async function isMaintenanceMode(): Promise<boolean> {
  try {
    const config = await getAppConfig()
    // Since we removed maintenance mode from the new config structure,
    // we'll return false for now
    return false
  } catch (error) {
    console.error('Error checking maintenance mode:', error)
    return false
  }
}

// Validate database connection and return detailed status
export async function validateDatabaseStatus(): Promise<{
  configured: boolean
  connected: boolean
  error?: string
  tableName?: string
}> {
  try {
    const connection = await checkDatabaseConnection()
    
    return {
      configured: true,
      connected: connection.success,
      error: connection.error,
      tableName: 'survey_data' // Default table name
    }
  } catch (error) {
    return {
      configured: false,
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}