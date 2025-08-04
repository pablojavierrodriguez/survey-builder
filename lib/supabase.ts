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
        const { readLocalConfig } = await import('./local-config')
        const localConfig = readLocalConfig()
        if (localConfig) {
          console.log('🔧 [Supabase] Using local configuration for bootstrap')
          return createClient<Database>(localConfig.supabaseUrl, localConfig.supabaseKey)
        }
      } catch (error) {
        console.log('🔧 [Supabase] No local config available')
      }
    }

    // Client-side: only try to get from database via API if we're not in a setup context
    if (typeof window !== 'undefined') {
      // Avoid calling API during setup process
      const isSetupPage = window.location.pathname === '/setup'
      if (isSetupPage) {
        console.log('🔧 [Supabase] Skipping API call during setup')
        return null
      }

      const response = await fetch('/api/admin/settings')
      const result = await response.json()
      
      if (result.success && result.data?.database?.url && result.data?.database?.apiKey) {
        const { url, apiKey } = result.data.database
        console.log('🔧 [Supabase] Using database configuration')
        return createClient<Database>(url, apiKey)
      }
    }
  } catch (error) {
    console.error('Error fetching Supabase config:', error)
  }
  
  return null
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
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: string
          created_at?: string
          updated_at?: string
        }
      }
      survey_data: {
        Row: {
          id: string
          role: string
          seniority_level: string
          company_type: string
          industry: string
          product_type: string
          customer_segment: string
          main_challenge: string
          tools: string[]
          learning_methods: string[]
          salary_range?: string
          email?: string
          created_at: string
        }
        Insert: {
          id?: string
          role: string
          seniority_level: string
          company_type: string
          industry: string
          product_type: string
          customer_segment: string
          main_challenge: string
          tools: string[]
          learning_methods: string[]
          salary_range?: string
          email?: string
          created_at?: string
        }
        Update: {
          id?: string
          role?: string
          seniority_level?: string
          company_type?: string
          industry?: string
          product_type?: string
          customer_segment?: string
          main_challenge?: string
          tools?: string[]
          learning_methods?: string[]
          salary_range?: string
          email?: string
          created_at?: string
        }
      }
    }
  }
}
