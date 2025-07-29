/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@prisma/client'],
  env: {
    // Expose environment variables to the client
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_DB_TABLE: process.env.NEXT_PUBLIC_DB_TABLE,
    NEXT_PUBLIC_NODE_ENV: process.env.NEXT_PUBLIC_NODE_ENV,
    NEXT_PUBLIC_DEBUG: process.env.NEXT_PUBLIC_DEBUG,
    NEXT_PUBLIC_MAX_LOGIN_ATTEMPTS: process.env.NEXT_PUBLIC_MAX_LOGIN_ATTEMPTS,
    NEXT_PUBLIC_SESSION_TIMEOUT: process.env.NEXT_PUBLIC_SESSION_TIMEOUT,
    NEXT_PUBLIC_ENABLE_EXPORT: process.env.NEXT_PUBLIC_ENABLE_EXPORT,
    NEXT_PUBLIC_ENABLE_EMAIL_NOTIFICATIONS: process.env.NEXT_PUBLIC_ENABLE_EMAIL_NOTIFICATIONS,
    NEXT_PUBLIC_ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS,
    // Note: POSTGRES_* variables are server-side only and cannot be exposed to client
  },
  images: {
    domains: ['localhost', '127.0.0.1'],
  },
}

export default nextConfig
