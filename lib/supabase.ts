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

    // Client-side: use cache to prevent multiple simultaneous requests
    if (typeof window !== 'undefined') {
      // Avoid calling API during setup process
      const isSetupPage = window.location.pathname === '/setup'
      if (isSetupPage) {
        console.log('🔧 [Supabase] Skipping API call during setup')
        return null
      }

      // Check cache first
      const now = Date.now()
      if (clientCache && (now - lastFetchTime) < CACHE_DURATION) {
        console.log('🔧 [Supabase] Using cached client')
        return clientCache
      }

      // If there's already a request in progress, wait for it with timeout
      if (clientPromise) {
        console.log('🔧 [Supabase] Waiting for existing request')
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Client request timeout')), 5000)
        })
        return await Promise.race([clientPromise, timeoutPromise])
      }

      // Make new request
      clientPromise = (async () => {
        try {
          console.log('🔧 [Supabase] Fetching configuration from API')
          
          // Add timeout to fetch
          const fetchTimeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Fetch timeout')), 10000)
          })
          
          const response = await Promise.race([
            fetch('/api/admin/settings'),
            fetchTimeoutPromise
          ]) as Response
          
          const result = await response.json()
          
          if (result.success && result.data?.database?.url && result.data?.database?.apiKey) {
            const { url, apiKey } = result.data.database
            const client = createClient<Database>(url, apiKey)
            
            // Update cache
            clientCache = client
            lastFetchTime = now
            
            console.log('🔧 [Supabase] Configuration fetched and cached')
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

// Function to clear the client cache (useful after configuration changes)
export function clearSupabaseCache() {
  clientCache = null
  clientPromise = null
  lastFetchTime = 0
  console.log('🔧 [Supabase] Cache cleared')
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
