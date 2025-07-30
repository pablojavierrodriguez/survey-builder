import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Product Community Survey',
  description: 'Help us understand the product community better',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Expose environment variables to the client
  const envVars = {
    // App configuration
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_DB_TABLE: process.env.NEXT_PUBLIC_DB_TABLE,
    NEXT_PUBLIC_NODE_ENV: process.env.NEXT_PUBLIC_NODE_ENV,
    NEXT_PUBLIC_ENABLE_EXPORT: process.env.NEXT_PUBLIC_ENABLE_EXPORT,
    NEXT_PUBLIC_ENABLE_EMAIL_NOTIFICATIONS: process.env.NEXT_PUBLIC_ENABLE_EMAIL_NOTIFICATIONS,
    NEXT_PUBLIC_ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS,
  }

  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__ENV__ = ${JSON.stringify(envVars)};`,
          }}
        />
      </body>
    </html>
  )
}
