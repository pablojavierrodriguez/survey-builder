import { createClient } from '@supabase/supabase-js'

// Supabase client will be created dynamically from database settings
export const supabase = null

// Check if Supabase is configured (will be set dynamically)
export const isSupabaseConfigured = false

// Cache for client-side Supabase client
let clientCache: any = null
let clientPromise: Promise<any> | null = null
let lastFetchTime = 0
const CACHE_DURATION = 30000 // 30 seconds

// Function to get Supabase client with dynamic config from database
export async function getSupabaseClient() {
  try {
    // Server-side: use local config for bootstrap
    if (typeof window === 'undefined') {
      try {
        const localConfigModule = await import('./local-config')
        if (localConfigModule && typeof localConfigModule.readLocalConfig === 'function') {
          const localConfig = localConfigModule.readLocalConfig()
          if (localConfig) {
            return createClient<Database>(localConfig.supabaseUrl, localConfig.supabaseKey)
          }
        }
      } catch (error) {
        // Silently handle import errors
      }
    }

    // Client-side: use cached config or fetch from database
    if (typeof window !== 'undefined') {
      // Check cache first
      const now = Date.now()
      if (clientCache && (now - lastFetchTime) < CACHE_DURATION) {
        return clientCache
      }

      // If there's already a request in progress, wait for it
      if (clientPromise) {
        return await clientPromise
      }

      // Make new request
      clientPromise = (async () => {
        try {
          const response = await fetch('/api/admin/settings')
          const result = await response.json()
          
          if (result.success && result.data?.database?.url && result.data?.database?.apiKey) {
            const { url, apiKey } = result.data.database
            const client = createClient<Database>(url, apiKey)
            
            // Update cache
            clientCache = client
            lastFetchTime = now
            
            return client
          }
          return null
        } catch (error) {
          console.error('Error fetching Supabase config:', error)
          return null
        } finally {
          clientPromise = null
        }
      })()

      return await clientPromise
    }
  } catch (error) {
    console.error('Error in getSupabaseClient:', error)
  }
  
  return null
}

export function clearSupabaseCache() {
  clientCache = null
  clientPromise = null
  lastFetchTime = 0
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
