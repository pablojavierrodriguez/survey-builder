import { createClient } from '@supabase/supabase-js'

// Hardcoded Supabase client
export const supabase = createClient(
  'https://pzfujrbrsfcevektarjv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6ZnVqcmJyc2ZjZXZla3Rhcmp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MzY5NTIsImV4cCI6MjA2OTMxMjk1Mn0.g5TLxNdpbCjisIX88hRwpAJglwT8xC3NibtS4InO5YY'
)

export const isSupabaseConfigured = true

// Legacy exports for backward compatibility
export function getSupabaseClient() {
  return supabase
}

export function clearSupabaseCache() {
  // No cache to clear
}

export async function requireSupabase() {
  return true
}

// Database types
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
