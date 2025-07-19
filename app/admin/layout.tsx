"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Settings, BarChart3, Database, FileText, LogOut, Menu, X, Shield } from "lucide-react"
import { useRoleBasedAccess } from "./middleware"

interface AuthData {
  username: string
  role: string
  loginTime: number
  sessionId: string
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authData, setAuthData] = useState<AuthData | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useRoleBasedAccess()

  useEffect(() => {
    const checkAuth = () => {
      const authStr = localStorage.getItem("survey_auth")
      const sessionStr = sessionStorage.getItem("survey_session")

      if (!authStr || !sessionStr) {
        router.push("/auth/login")
        return
      }

      try {
        const auth = JSON.parse(authStr)
        const now = Date.now()
        const sessionAge = now - auth.loginTime

        // Session expires after 8 hours
        if (sessionAge > 8 * 60 * 60 * 1000) {
          handleLogout()
          return
        }

        setAuthData(auth)
        setIsAuthenticated(true)

        // Redirect viewers to analytics if they try to access admin pages
        if (auth.role === "viewer" && !pathname.includes("/admin/analytics")) {
          router.push("/admin/analytics")
          return
        }
      } catch (error) {
        console.error("Auth validation error:", error)
        router.push("/auth/login")
      }
    }

    checkAuth()
  }, [router, pathname])

  const handleLogout = () => {
    localStorage.removeItem("survey_auth")
    sessionStorage.removeItem("survey_session")
    router.push("/auth/login")
  }

  const getNavigationForRole = (role: string) => {
    const allNavigation = [
      { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, roles: ["admin"] },
      { name: "Survey Config", href: "/admin/survey-config", icon: FileText, roles: ["admin"] },
      { name: "Database", href: "/admin/database", icon: Database, roles: ["admin"] },
      { name: "Analytics", href: "/admin/analytics", icon: BarChart3, roles: ["admin", "viewer"] },
      { name: "Settings", href: "/admin/settings", icon: Settings, roles: ["admin"] },
    ]

    return allNavigation.filter((item) => item.roles.includes(role))
  }

  const navigation = getNavigationForRole(authData?.role || "viewer")

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900">Survey Admin</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)} className="lg:hidden">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <nav className="mt-6 px-3">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <a
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-1 ${
                  isActive
                    ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </a>
            )
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-gray-600">{authData?.username.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">{authData?.username}</div>
              <div className="text-xs text-gray-500 capitalize">
                {authData?.role === "admin" ? "Administrator" : "Analytics Viewer"}
              </div>
            </div>
          </div>
          <Button onClick={handleLogout} variant="outline" size="sm" className="w-full bg-transparent">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="bg-white shadow-sm border-b h-16 flex items-center justify-between px-6">
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)} className="lg:hidden">
            <Menu className="w-5 h-5" />
          </Button>

          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              Last login: {authData ? new Date(authData.loginTime).toLocaleString() : ""}
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
