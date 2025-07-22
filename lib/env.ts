// Environment variables configuration
export const env = {
  // Supabase Configuration
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "https://qaauhwulohxeeacexrav.supabase.co",
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "...",

  // App Configuration
  APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || "Product Survey Builder",
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || "https://your-domain.com",

  // Security Configuration
  SESSION_TIMEOUT: Number.parseInt(process.env.NEXT_PUBLIC_SESSION_TIMEOUT || "28800000"),
  MAX_LOGIN_ATTEMPTS: Number.parseInt(process.env.NEXT_PUBLIC_MAX_LOGIN_ATTEMPTS || "3"),

  // Feature Flags
  ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS !== "false",
  ENABLE_EMAIL_NOTIFICATIONS: process.env.NEXT_PUBLIC_ENABLE_EMAIL_NOTIFICATIONS === "true",

  // Admin Configuration
  ADMIN_EMAIL: process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@example.com",

  // Development
  NODE_ENV: process.env.NEXT_PUBLIC_NODE_ENV || "development",
  IS_PRODUCTION: process.env.NEXT_PUBLIC_NODE_ENV === "production",
}

// Validate required environment variables
export function validateEnv() {
  const required = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"]

  const missing = required.filter((key) => !process.env[key])

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`)
  }
}

// SSL/Security headers configuration
export const securityHeaders = {
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
}
