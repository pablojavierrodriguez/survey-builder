import { createClient } from '@supabase/supabase-js'

// Supabase client will be created dynamically from database settings
export const supabase = null

// Check if Supabase is configured (will be set dynamically)
export const isSupabaseConfigured = false

// Function to get Supabase client with dynamic config from database
export async function getSupabaseClient() {
  try {
    // Check if we're on the server side
    if (typeof window === 'undefined') {
      // Server-side: try local config first, then database
      try {
        // Dynamic import only on server side with proper error handling
        const localConfigModule = await import('./local-config')
        if (localConfigModule && typeof localConfigModule.readLocalConfig === 'function') {
          const localConfig = localConfigModule.readLocalConfig()
          if (localConfig) {
            console.log('🔧 [Supabase] Using local configuration for bootstrap')
            return createClient<Database>(localConfig.supabaseUrl, localConfig.supabaseKey)
          }
        }
      } catch (error) {
        // Silently handle import errors on server side
        // Don't log anything to avoid client-side warnings
      }
    }

    // Client-side: Re-enabled for auth operations
    if (typeof window !== 'undefined') {
      // Only allow requests for auth operations, not for settings loading
      const isAuthOperation = typeof window !== 'undefined' && 
        (window.location.pathname.includes('/auth') || 
         window.location.pathname.includes('/login') ||
         window.location.pathname.includes('/signup'))
      
      if (!isAuthOperation) {
        console.log('🔧 [Supabase] Skipping non-auth request to prevent loops')
        return null
      }

      try {
        console.log('🔧 [Supabase] Fetching configuration for auth operation')
        
        // Simple fetch with timeout - no caching, no deadlocks
        const fetchTimeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Fetch timeout')), 5000)
        })
        
        const response = await Promise.race([
          fetch('/api/admin/settings'),
          fetchTimeoutPromise
        ]) as Response
        
        const result = await response.json()
        
        if (result.success && result.data?.database?.url && result.data?.database?.apiKey) {
          const { url, apiKey } = result.data.database
          const client = createClient<Database>(url, apiKey)
          
          console.log('🔧 [Supabase] Configuration fetched for auth')
          return client
        }
        return null
      } catch (error) {
        console.error('Error fetching Supabase config for auth:', error)
        return null
      }
    }
  } catch (error) {
    console.error('Error in getSupabaseClient:', error)
  }
  
  return null
}

// Function to clear the client cache (useful after configuration changes)
export function clearSupabaseCache() {
  // No cache to clear anymore - function kept for compatibility
  console.log('🔧 [Supabase] Cache clear requested (no cache to clear)')
}

// Helper function to check if we can use Supabase features
export async function requireSupabase() {
  const client = await getSupabaseClient()
  return !!client
}

// Database types for better TypeScript support
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          created_at?: string
          updated_at?: string
        }
      }
      app_settings: {
        Row: {
          id: number
          created_at: string
          updated_at: string
          environment: string
          survey_table_name: string
          app_name: string
          settings: any
        }
        Insert: {
          id?: number
          created_at?: string
          updated_at?: string
          environment: string
          survey_table_name: string
          app_name: string
          settings?: any
        }
        Update: {
          id?: number
          created_at?: string
          updated_at?: string
          environment?: string
          survey_table_name?: string
          app_name?: string
          settings?: any
        }
      }
      survey_data: {
        Row: {
          id: number
          created_at: string
          updated_at: string
          response_data: any
          session_id?: string
          user_agent?: string
          ip_address?: string
        }
        Insert: {
          id?: number
          created_at?: string
          updated_at?: string
          response_data: any
          session_id?: string
          user_agent?: string
          ip_address?: string
        }
        Update: {
          id?: number
          created_at?: string
          updated_at?: string
          response_data?: any
          session_id?: string
          user_agent?: string
          ip_address?: string
        }
      }
    }
  }
}
