// Environment variables configuration
export const env = {
  // Supabase configuration
  SUPABASE_ANON_KEY: process.env.POSTGRES_NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "",
  
  // App configuration
  APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || "Product Community Survey",
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || "https://productcommunitysurvey.vercel.app",
  DB_TABLE: process.env.NEXT_PUBLIC_DB_TABLE || "survey_data",
  NODE_ENV: process.env.NEXT_PUBLIC_NODE_ENV || process.env.NODE_ENV || "production",
  DEBUG: process.env.NEXT_PUBLIC_DEBUG || "false",
  
  // Security settings
  MAX_LOGIN_ATTEMPTS: process.env.NEXT_PUBLIC_MAX_LOGIN_ATTEMPTS || "10",
  SESSION_TIMEOUT: process.env.NEXT_PUBLIC_SESSION_TIMEOUT || "3600000",
  
  // Feature flags
  ENABLE_EXPORT: process.env.NEXT_PUBLIC_ENABLE_EXPORT || "true",
  ENABLE_EMAIL_NOTIFICATIONS: process.env.NEXT_PUBLIC_ENABLE_EMAIL_NOTIFICATIONS || "true",
  ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS || "true",
}

// Client-side environment variables (exposed via window.__ENV__)
export const clientEnv = {
  // Supabase configuration (client-side)
  SUPABASE_ANON_KEY: typeof window !== 'undefined' ?
    (window as any).__ENV__?.POSTGRES_NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    (window as any).__ENV__?.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    (window as any).__ENV__?.SUPABASE_ANON_KEY || "" : "",
  
  // App configuration
  APP_NAME: typeof window !== 'undefined' ? (window as any).__ENV__?.NEXT_PUBLIC_APP_NAME || "" : "",
  APP_URL: typeof window !== 'undefined' ? (window as any).__ENV__?.NEXT_PUBLIC_APP_URL || "" : "",
  DB_TABLE: typeof window !== 'undefined' ? (window as any).__ENV__?.NEXT_PUBLIC_DB_TABLE || "" : "",
  NODE_ENV: typeof window !== 'undefined' ? (window as any).__ENV__?.NEXT_PUBLIC_NODE_ENV || "" : "",
  DEBUG: typeof window !== 'undefined' ? (window as any).__ENV__?.NEXT_PUBLIC_DEBUG || "" : "",
  
  // Security settings
  MAX_LOGIN_ATTEMPTS: typeof window !== 'undefined' ? (window as any).__ENV__?.NEXT_PUBLIC_MAX_LOGIN_ATTEMPTS || "" : "",
  SESSION_TIMEOUT: typeof window !== 'undefined' ? (window as any).__ENV__?.NEXT_PUBLIC_SESSION_TIMEOUT || "" : "",
  
  // Feature flags
  ENABLE_EXPORT: typeof window !== 'undefined' ? (window as any).__ENV__?.NEXT_PUBLIC_ENABLE_EXPORT || "" : "",
  ENABLE_EMAIL_NOTIFICATIONS: typeof window !== 'undefined' ? (window as any).__ENV__?.NEXT_PUBLIC_ENABLE_EMAIL_NOTIFICATIONS || "" : "",
  ENABLE_ANALYTICS: typeof window !== 'undefined' ? (window as any).__ENV__?.NEXT_PUBLIC_ENABLE_ANALYTICS || "" : "",
}

// Validation function
export function validateEnv() {
  const required = ["SUPABASE_ANON_KEY"]
  const missing = required.filter(key => !env[key as keyof typeof env])
  
  if (missing.length > 0) {
    console.warn(`Missing required environment variables: ${missing.join(', ')}`)
    return false
  }
  
  return true
}

// Get environment variable with fallback
export function getEnv(key: keyof typeof env, fallback: string = ""): string {
  return env[key] || fallback
}

// SSL/Security headers configuration
export const securityHeaders = {
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
}
