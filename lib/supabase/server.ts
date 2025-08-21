import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { cache } from "react"
import type { Database } from "../supabase"
import { getSafeEnvironmentConfig } from "../env.server"

// Check if Supabase environment variables are available
const envConfig = getSafeEnvironmentConfig()
export const isSupabaseConfigured = envConfig.supabase.isConfigured

// Create a cached version of the Supabase client for Server Components
export const createClient = cache(() => {
  const cookieStore = cookies()

  if (!isSupabaseConfigured) {
    console.warn("⚠️ Supabase not configured. Server-side features will be limited.")
    if (envConfig.validation.errors.length > 0) {
      console.warn("Environment errors:", envConfig.validation.errors)
    }
    return null
  }

  try {
    return createServerComponentClient<Database>({ cookies: () => cookieStore })
  } catch (error) {
    console.error("❌ Failed to create server Supabase client:", error)
    return null
  }
})