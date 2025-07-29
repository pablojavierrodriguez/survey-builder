"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"

interface Auth {
  username: string
  role: string
  loginTime?: number
  sessionId?: string
}

export function useRoleBasedAccess() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const checkAccess = () => {
      const authStr = localStorage.getItem("survey_auth")
      if (!authStr) return

      try {
        const auth: Auth = JSON.parse(authStr)

        // Define role-based access rules
        const roleAccess = {
          admin: ["/admin/dashboard", "/admin/survey-config", "/admin/database", "/admin/analytics", "/admin/settings"],
          viewer: ["/admin/analytics"],
        }

        const allowedPaths = roleAccess[auth.role as keyof typeof roleAccess] || []

        // Check if current path is allowed for user's role
        const isAllowed = allowedPaths.some((path) => pathname.startsWith(path))

        if (!isAllowed) {
          // Redirect to appropriate default page based on role
          const defaultPath = auth.role === "admin" ? "/admin/dashboard" : "/admin/analytics"
          router.push(defaultPath)
        }
      } catch (error) {
        console.error("Access check error:", error)
      }
    }

    checkAccess()
  }, [pathname, router])
}
