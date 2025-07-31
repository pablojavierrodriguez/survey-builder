// src/app/admin/layout.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { getPermissions, getUserRole } from "@/lib/permissions"
import { Button } from "@/components/ui/button"
import { 
  LayoutDashboard, 
  BarChart3, 
  FileText, 
  Database, 
  Settings, 
  Menu, 
  X,
  LogOut,
  User
} from "lucide-react"
import Link from "next/link"

interface AdminUser {
  id: string
  email: string
  role: string
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, profile, signOut, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login")
    }
  }, [user, loading, router])

  // Role-based redirection logic
  useEffect(() => {
    if (!loading && user && profile) {
      const currentUserRole = profile.role || 'viewer'
      
      // If user is viewer and trying to access dashboard, redirect to analytics
      if (currentUserRole === 'viewer' && pathname === '/admin/dashboard') {
        console.log('[AdminLayout] Viewer accessing dashboard, redirecting to analytics')
        router.push('/admin/analytics')
        return
      }
      
      // If user is admin/admin-demo and accessing analytics as default, redirect to dashboard
      if ((currentUserRole === 'admin' || currentUserRole === 'admin-demo') && pathname === '/admin/analytics') {
        // Only redirect if they're on the root admin path
        if (pathname === '/admin' || pathname === '/admin/') {
          console.log('[AdminLayout] Admin accessing root admin, redirecting to dashboard')
          router.push('/admin/dashboard')
          return
        }
      }
    }
  }, [user, profile, loading, pathname, router])

  const handleLogout = async () => {
    await signOut()
    router.push("/auth/login")
  }

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Don't render if not authenticated
  if (!user) {
    return null
  }

  // Get current user role and permissions
  const currentUserRole = profile?.role || 'viewer'
  const permissions = getPermissions(currentUserRole as any)

  const navigation = [
    { 
      name: "Dashboard", 
      href: "/admin/dashboard", 
      icon: LayoutDashboard, 
      show: permissions.canViewDashboard 
    },
    { 
      name: "Analytics", 
      href: "/admin/analytics", 
      icon: BarChart3, 
      show: permissions.canViewAnalytics 
    },
    { 
      name: "Survey Config", 
      href: "/admin/survey-config", 
      icon: FileText, 
      show: permissions.canEditSurveys 
    },
    { 
      name: "Database", 
      href: "/admin/database", 
      icon: Database, 
      show: permissions.canModifyDatabase 
    },
    { 
      name: "Settings", 
      href: "/admin/settings", 
      icon: Settings, 
      show: permissions.canViewSettings 
    },
  ]

  const filteredNavigation = navigation.filter((item) => item.show)

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden mobile-safe">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div 
            className="fixed inset-0 bg-black/50 dark:bg-black/70" 
            onClick={() => setSidebarOpen(false)} 
          />
        </div>
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-border">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">PC</span>
              </div>
              <span className="font-semibold text-lg">Admin Panel</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-md hover:bg-accent"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.email}</p>
                <p className="text-xs text-muted-foreground capitalize">{currentUserRole}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {filteredNavigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${isActive 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }
                  `}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-border">
            <Button
              variant="outline"
              onClick={handleLogout}
              className="w-full justify-start"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="flex h-16 items-center justify-between px-6 border-b border-border bg-background">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-md hover:bg-accent"
          >
            <Menu className="h-5 w-5" />
          </button>
          
          <div className="flex items-center space-x-4">
            <div className="hidden sm:block">
              <h1 className="text-lg font-semibold">Product Community Survey</h1>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
