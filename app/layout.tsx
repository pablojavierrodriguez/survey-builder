import type { Metadata } from "next"
import { Inter as FontSans } from "next/font/google"
import "./globals.css" // Importa CSS global aquí y SOLO AQUÍ

import { cn } from "@/lib/utils"
import { ThemeProvider } from "@/components/theme-provider"

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "Product Community Survey",
  description: "Manage product community surveys and analytics.",
    generator: 'v0.dev'
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
                  // Obtener el tema guardado en localStorage
                  const theme = localStorage.getItem('theme');
                  // Obtener la preferencia del sistema
                  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                  if (theme === 'dark' || (theme === 'system' && systemPrefersDark)) {
                    document.documentElement.classList.add('dark');
                    document.documentElement.style.setProperty('color-scheme', 'dark');
                  } else if (theme === 'light' || (theme === 'system' && !systemPrefersDark)) {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.style.setProperty('color-scheme', 'light');
                  }
                  // Si no hay tema guardado o es inválido, no hacemos nada y dejamos que next-themes
                  // establezca el defaultTheme (system/light) en la hidratación.

                } catch (e) {
                  // En caso de error (ej. localStorage no disponible), no hace nada.
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
          defaultTheme="system" // O "light" si quieres que por defecto sea claro
          enableSystem // Permite que next-themes detecte la preferencia del sistema
          disableTransitionOnChange // Evita transiciones de tema al cambiar, útil para evitar parpadeos
        >
          {children} {/* Aquí se renderiza TODO el contenido de tu aplicación, incluyendo /admin */}
        </ThemeProvider>
      </body>
    </html>
  )
}
