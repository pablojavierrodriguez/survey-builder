import { createClient } from '@supabase/supabase-js'
import { configManager } from './config-manager'

// Dynamic Supabase client that uses ConfigManager
let supabaseClient: any = null
let isInitialized = false

// Initialize Supabase client
async function initializeSupabase() {
  if (isInitialized) return supabaseClient

  try {
    supabaseClient = await configManager.getSupabaseClient()
    isInitialized = true
    return supabaseClient
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error)
    return null
  }
}

// Get Supabase client (async)
export async function getSupabaseClient() {
  return await initializeSupabase()
}

// Get Supabase client (sync - returns null if not ready)
export function getSupabaseClientSync() {
  return supabaseClient
}

// Check if Supabase is configured
export async function isSupabaseConfigured() {
  return await configManager.isConfigured()
}

// Clear cache and reinitialize
export async function clearSupabaseCache() {
  configManager.clearCache()
  supabaseClient = null
  isInitialized = false
  console.log('🗑️ Supabase cache cleared')
}

// Legacy exports for backward compatibility
export const supabase = {
  get: async () => await getSupabaseClient(),
  getSync: () => getSupabaseClientSync()
}

export async function requireSupabase() {
  return await isSupabaseConfigured()
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
