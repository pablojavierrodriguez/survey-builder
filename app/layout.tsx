import type { Metadata } from "next"
import { Inter as FontSans } from "next/font/google"
import "./globals.css" // Importa CSS global aquí y SOLO AQUÍ

import { cn } from "@/lib/utils"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/auth-context"

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "Product Community Survey",
  description: "Manage product community surveys and analytics.",
  generator: 'Next.js',
  authors: [{ name: 'Pablo Javier Rodriguez' }],
  keywords: ['survey', 'product management', 'community', 'analytics'],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        )}
      >
        {/*
          Script para prevenir FOUC (Flash of Unstyled Content) al cargar la página.
          Debe ir justo después de la etiqueta <body> de apertura.
          Este script lee el tema guardado y lo aplica antes de la hidratación de React.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme');
                  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                  // Default to light mode unless explicitly set to dark
                  if (theme === 'dark' || (theme === 'system' && systemPrefersDark)) {
                    document.documentElement.classList.add('dark');
                    document.documentElement.style.setProperty('color-scheme', 'dark');
                  } else {
                    // Explicitly set light mode as default
                    document.documentElement.classList.remove('dark');
                    document.documentElement.style.setProperty('color-scheme', 'light');
                  }
                } catch (e) {
                  // Fallback to light mode on error
                  document.documentElement.classList.remove('dark');
                  document.documentElement.style.setProperty('color-scheme', 'light');
                  console.error("Failed to set theme on initial load:", e);
                }
              })();
            `,
          }}
        />
        {/*
          ThemeProvider de next-themes debe envolver todo el contenido (children)
          para proporcionar el contexto del tema a todos los componentes.
          'attribute="class"' asegura que next-themes añada o quite la clase 'dark' del <html>.
        */}
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children} {/* Aquí se renderiza TODO el contenido de tu aplicación, incluyendo /admin */}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
