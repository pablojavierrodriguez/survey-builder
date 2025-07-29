import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/lib/auth-context"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || "Product Community Survey",
  description: "A comprehensive survey for product community insights",
}

// Expose environment variables to the client
const envVars = {
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
  // Supabase variables - map from Vercel's POSTGRES_* variables to NEXT_PUBLIC_*
  NEXT_PUBLIC_SUPABASE_URL: process.env.POSTGRES_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.POSTGRES_SUPABASE_ANON_KEY,
}

// Debug: Log environment variables (server-side only)
if (typeof window === 'undefined') {
  console.log('🔍 Server-side envVars:', envVars)
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__ENV__ = ${JSON.stringify(envVars)};`,
          }}
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
