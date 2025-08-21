import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { getSafeEnvironmentConfig } from "./env"

// Get environment configuration
const envConfig = getSafeEnvironmentConfig()

export const isSupabaseConfigured = envConfig.supabase.isConfigured

export const supabase = (() => {
  if (!envConfig.supabase.isConfigured) {
    if (envConfig.validation.errors.length > 0) {
      console.warn("⚠️ Supabase not configured due to environment errors:")
      envConfig.validation.errors.forEach(error => console.warn(`  - ${error}`))
    }
    return null
  }

  try {
    return createClientComponentClient({
      supabaseUrl: envConfig.supabase.url!,
      supabaseKey: envConfig.supabase.anonKey!,
    })
  } catch (error) {
    console.error("❌ Failed to create Supabase client:", error)
    return null
  }
})()

// Legacy function for backward compatibility
export async function getSupabaseClient() {
  if (!isSupabaseConfigured) {
    console.warn("⚠️ Supabase not configured. Please check environment variables.")
    return null
  }
  return supabase
}

export function getSupabaseClientSync() {
  return isSupabaseConfigured ? supabase : null
}

export async function clearSupabaseCache() {
  console.log("🗑️ Supabase cache cleared")
}

export async function requireSupabase() {
  return isSupabaseConfigured
}

// Database types - updated to match new schema
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name?: string
          role?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: string
          created_at?: string
          updated_at?: string
        }
      }
      app_settings: {
        Row: {
          id: string
          key: string
          value: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          value: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          value?: any
          created_at?: string
          updated_at?: string
        }
      }
      survey_responses: {
        Row: {
          id: string
          session_id: string
          user_agent?: string
          ip_address?: string
          role?: string
          other_role?: string
          seniority?: string
          company_type?: string
          company_size?: string
          industry?: string
          product_type?: string
          customer_segment?: string
          main_challenge?: string
          daily_tools?: string[]
          other_tool?: string
          learning_methods?: string[]
          salary_currency?: string
          salary_min?: string
          salary_max?: string
          salary_average?: string
          email?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          session_id: string
          user_agent?: string
          ip_address?: string
          role?: string
          other_role?: string
          seniority?: string
          company_type?: string
          company_size?: string
          industry?: string
          product_type?: string
          customer_segment?: string
          main_challenge?: string
          daily_tools?: string[]
          other_tool?: string
          learning_methods?: string[]
          salary_currency?: string
          salary_min?: string
          salary_max?: string
          salary_average?: string
          email?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          user_agent?: string
          ip_address?: string
          role?: string
          other_role?: string
          seniority?: string
          company_type?: string
          company_size?: string
          industry?: string
          product_type?: string
          customer_segment?: string
          main_challenge?: string
          daily_tools?: string[]
          other_tool?: string
          learning_methods?: string[]
          salary_currency?: string
          salary_min?: string
          salary_max?: string
          salary_average?: string
          email?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
