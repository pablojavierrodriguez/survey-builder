import { createClient } from '@supabase/supabase-js'

// Legacy exports for backward compatibility
export const supabase = null
export const isSupabaseConfigured = false

// Server-side Supabase client using database config
export async function getSupabaseClient() {
  try {
    // Server-side: fetch config from database
    if (typeof window === 'undefined') {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/settings`)
      const result = await response.json()
      
      if (result.success && result.data?.database?.url && result.data?.database?.apiKey) {
        const { url, apiKey } = result.data.database
        return createClient<Database>(url, apiKey)
      }
    }

    // Client-side: return null (use context instead)
    return null
  } catch (error) {
    console.error('Error in getSupabaseClient:', error)
    return null
  }
}

export function clearSupabaseCache() {
  // Function kept for backward compatibility
}

export async function requireSupabase() {
  // Function kept for backward compatibility
  return false
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
