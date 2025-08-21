import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export const isSupabaseConfigured = (() => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  return typeof url === "string" && url.length > 0 && typeof key === "string" && key.length > 0
})()

export const supabase = (() => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    console.warn("⚠️ Supabase environment variables are not set. Please configure Supabase variables")
    // Return null instead of dummy client to prevent misleading success responses
    return null
  }

  return createClientComponentClient({
    supabaseUrl: url,
    supabaseKey: key,
  })
})()

// Legacy function for backward compatibility
export async function getSupabaseClient() {
  if (!isSupabaseConfigured) {
    console.warn(
      "⚠️ Supabase environment variables are not set. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY",
    )
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
