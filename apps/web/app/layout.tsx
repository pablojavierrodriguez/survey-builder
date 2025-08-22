import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Open Survey - Build, share, and analyze surveys with ease',
  description: 'Open source survey platform for creating and managing surveys with powerful analytics',
  keywords: ['survey', 'forms', 'analytics', 'open-source', 'nextjs'],
  authors: [{ name: 'Open Survey Team' }],
  creator: 'Open Survey Team',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://opensurvey.dev',
    title: 'Open Survey',
    description: 'Open source survey platform',
    siteName: 'Open Survey',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Open Survey',
    description: 'Open source survey platform',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}