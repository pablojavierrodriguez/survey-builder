/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_DB_TABLE: process.env.NEXT_PUBLIC_DB_TABLE,
    NEXT_PUBLIC_NODE_ENV: process.env.NEXT_PUBLIC_NODE_ENV,
    NEXT_PUBLIC_ENABLE_EXPORT: process.env.NEXT_PUBLIC_ENABLE_EXPORT,
    NEXT_PUBLIC_ENABLE_EMAIL_NOTIFICATIONS: process.env.NEXT_PUBLIC_ENABLE_EMAIL_NOTIFICATIONS,
    NEXT_PUBLIC_ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS,
  },
  images: {
    domains: ['localhost', '127.0.0.1'],
  },
  serverExternalPackages: ['@prisma/client'],
}

export default nextConfig
