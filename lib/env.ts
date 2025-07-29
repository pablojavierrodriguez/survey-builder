// Environment variables configuration
export const env = {
  // Supabase Configuration
  SUPABASE_URL: process.env.POSTGRES_NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "",
  SUPABASE_ANON_KEY: process.env.POSTGRES_NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "",

  // App Configuration
  APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || "",
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || "",

  // Database Configuration
  DB_TABLE: process.env.NEXT_PUBLIC_DB_TABLE || "",

  // Security Configuration
  SESSION_TIMEOUT: Number.parseInt(process.env.NEXT_PUBLIC_SESSION_TIMEOUT || "3600"),
  MAX_LOGIN_ATTEMPTS: Number.parseInt(process.env.NEXT_PUBLIC_MAX_LOGIN_ATTEMPTS || "10"),

  // Feature Flags
  ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === "true",
  ENABLE_EMAIL_NOTIFICATIONS: process.env.NEXT_PUBLIC_ENABLE_EMAIL_NOTIFICATIONS === "true",
  ENABLE_EXPORT: process.env.NEXT_PUBLIC_ENABLE_EXPORT === "true",

  // Development
  NODE_ENV: process.env.NEXT_PUBLIC_NODE_ENV || "development",
  IS_PRODUCTION: process.env.NEXT_PUBLIC_NODE_ENV === "production",
  DEBUG: process.env.NEXT_PUBLIC_DEBUG === "true",
}

// Client-side environment variables (for browser access)
export const clientEnv = {
  // Supabase Configuration
  SUPABASE_URL: typeof window !== 'undefined' ? 
    (window as any).__ENV__?.POSTGRES_NEXT_PUBLIC_SUPABASE_URL ||
    (window as any).__ENV__?.NEXT_PUBLIC_SUPABASE_URL ||
    (window as any).__ENV__?.SUPABASE_URL || "" : "",
  SUPABASE_ANON_KEY: typeof window !== 'undefined' ? 
    (window as any).__ENV__?.POSTGRES_NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    (window as any).__ENV__?.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    (window as any).__ENV__?.SUPABASE_ANON_KEY || "" : "",

  // App Configuration
  APP_NAME: typeof window !== 'undefined' ? 
    (window as any).__ENV__?.NEXT_PUBLIC_APP_NAME || "" : "",
  APP_URL: typeof window !== 'undefined' ? 
    (window as any).__ENV__?.NEXT_PUBLIC_APP_URL || "" : "",

  // Database Configuration
  DB_TABLE: typeof window !== 'undefined' ? 
    (window as any).__ENV__?.NEXT_PUBLIC_DB_TABLE || "" : "",

  // Security Configuration
  SESSION_TIMEOUT: typeof window !== 'undefined' ? 
    Number.parseInt((window as any).__ENV__?.NEXT_PUBLIC_SESSION_TIMEOUT || "3600") : 3600,
  MAX_LOGIN_ATTEMPTS: typeof window !== 'undefined' ? 
    Number.parseInt((window as any).__ENV__?.NEXT_PUBLIC_MAX_LOGIN_ATTEMPTS || "10") : 10,

  // Feature Flags
  ENABLE_ANALYTICS: typeof window !== 'undefined' ? 
    (window as any).__ENV__?.NEXT_PUBLIC_ENABLE_ANALYTICS === "true" : false,
  ENABLE_EMAIL_NOTIFICATIONS: typeof window !== 'undefined' ? 
    (window as any).__ENV__?.NEXT_PUBLIC_ENABLE_EMAIL_NOTIFICATIONS === "true" : false,
  ENABLE_EXPORT: typeof window !== 'undefined' ? 
    (window as any).__ENV__?.NEXT_PUBLIC_ENABLE_EXPORT === "true" : false,

  // Development
  NODE_ENV: typeof window !== 'undefined' ? 
    (window as any).__ENV__?.NEXT_PUBLIC_NODE_ENV || "development" : "development",
  IS_PRODUCTION: typeof window !== 'undefined' ? 
    (window as any).__ENV__?.NEXT_PUBLIC_NODE_ENV === "production" : false,
  DEBUG: typeof window !== 'undefined' ? 
    (window as any).__ENV__?.NEXT_PUBLIC_DEBUG === "true" : false,
}

// Get environment variables (server-side or client-side)
export function getEnv() {
  return typeof window !== 'undefined' ? clientEnv : env
}

// Validate required environment variables
export function validateEnv() {
  const currentEnv = getEnv()
  const required = ["SUPABASE_URL", "SUPABASE_ANON_KEY"]

  const missing = required.filter((key) => !currentEnv[key as keyof typeof currentEnv])

  if (missing.length > 0) {
    console.warn(`Missing required environment variables: ${missing.join(", ")}`)
    return false
  }
  return true
}

// SSL/Security headers configuration
export const securityHeaders = {
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
}
