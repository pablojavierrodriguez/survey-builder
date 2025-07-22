// src/app/admin/layout.tsx
"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ModeToggle } from "@/components/mode-toggle" 

import {
  BarChart3,
  Database,
  Settings,
  LogOut,
  Menu,
  X,
  Info,
  FileText,
  HelpCircle,
  Shield,
  Eye,
  LayoutDashboard,
} from "lucide-react"

interface AdminUser {
  username: string
  role: "admin" | "viewer"
  timestamp?: number
  sessionId?: string
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const authStr = localStorage.getItem("survey_auth")
    if (authStr) {
      try {
        const auth = JSON.parse(authStr)
        
        // Security: Check session validity (8 hours)
        if (auth.timestamp && Date.now() - auth.timestamp > 8 * 60 * 60 * 1000) {
          localStorage.removeItem("survey_auth")
          router.push("/auth/login")
          return
        }
        
        setUser(auth)
      } catch (error) {
        console.error("Error parsing auth:", error)
        localStorage.removeItem("survey_auth")
        router.push("/auth/login")
      }
    } else {
      router.push("/auth/login")
    }
    setIsLoading(false)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("survey_auth")
    router.push("/auth/login")
  }

  const navigation = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, adminOnly: true },
    { name: "Analytics", href: "/admin/analytics", icon: BarChart3, adminOnly: false },
    { name: "Survey Config", href: "/admin/survey-config", icon: FileText, adminOnly: true },
    { name: "Database", href: "/admin/database", icon: Database, adminOnly: true },
    { name: "Settings", href: "/admin/settings", icon: Settings, adminOnly: true },
  ]

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const filteredNavigation = navigation.filter((item) => !item.adminOnly || user.role === "admin")

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
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
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-card shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 border-r border-border ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-border bg-card">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-foreground">Survey Admin</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setSidebarOpen(false)} 
            className="lg:hidden text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <nav className="flex-1 px-4 py-6">
          <div className="space-y-1">
            {filteredNavigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? "text-primary-foreground" : "group-hover:text-accent-foreground"}`} />
                  {item.name}
                </Link>
              )
            })}
          </div>
        </nav>

        <div className="border-t border-border bg-card p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center border">
              <span className="text-sm font-medium text-muted-foreground">
                {user?.username?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground truncate">{user?.username}</div>
              <div className="text-xs text-muted-foreground capitalize">
                {user?.role === "admin" ? "Administrator" : "Analytics Viewer"}
              </div>
            </div>
          </div>
          <Button 
            onClick={handleLogout} 
            variant="outline" 
            size="sm" 
            className="w-full bg-transparent text-foreground border-border hover:bg-accent hover:text-accent-foreground"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        {/* Top bar */}
        <header className="bg-background shadow-sm border-b border-border shrink-0 z-30">
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <Menu className="h-6 w-6" />
              </Button>
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-foreground truncate">
                  Product Community Survey
                </h2>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <ModeToggle />
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    <Info className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-5xl max-h-[85vh] w-[95vw] bg-card border-border overflow-hidden">
                  <DialogHeader className="pb-4">
                    <DialogTitle className="text-foreground">Information & Help</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                      Release notes, FAQs, and other important information
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Tabs defaultValue="release-notes" className="flex-1">
                    <TabsList className="grid w-full grid-cols-5 bg-muted/30 mb-4">
                      <TabsTrigger
                        value="release-notes"
                        className="text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm"
                      >
                        Release Notes
                      </TabsTrigger>
                      <TabsTrigger
                        value="faqs"
                        className="text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm"
                      >
                        FAQs
                      </TabsTrigger>
                      <TabsTrigger
                        value="terms"
                        className="text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm"
                      >
                        Terms
                      </TabsTrigger>
                      <TabsTrigger
                        value="privacy"
                        className="text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm"
                        >
                        Privacy
                      </TabsTrigger>
                      <TabsTrigger
                        value="about"
                        className="text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm"
                        >
                        About
                      </TabsTrigger>
                    </TabsList>
                    
                    <ScrollArea className="h-[400px] pr-4">
                      <TabsContent value="release-notes" className="space-y-4 mt-0">
                        <Card className="bg-card border-border">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-foreground">
                              <FileText className="h-5 w-5" />
                              Version 1.4.0 - Latest
                            </CardTitle>
                            <CardDescription className="text-muted-foreground">
                              Released: {new Date().toLocaleDateString()}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="text-foreground">
                            <ul className="list-disc list-inside space-y-2 text-sm mb-4">
                              <li>Enhanced security with session management and rate limiting</li>
                              <li>Fixed login page styling and default light mode</li>
                              <li>Improved admin sidebar layout and z-index issues</li>
                              <li>Better responsive design for mobile and desktop</li>
                              <li>Fixed Information & Help dialog container issues</li>
                              <li>Unified color palette across all components</li>
                              <li>Enhanced maintenance mode integration</li>
                              <li>Improved survey question visibility controls</li>
                              <li>Fixed browser tab title display</li>
                              <li>Enhanced dashboard refresh functionality</li>
                              <li>Improved database connection status display</li>
                              <li>Optimized screen scaling for desktop resolutions</li>
                            </ul>
                          </CardContent>
                        </Card>
                        <Card className="bg-card border-border">
                          <CardHeader>
                            <CardTitle className="text-foreground">Version 1.3.0</CardTitle>
                            <CardDescription className="text-muted-foreground">Previous Release</CardDescription>
                          </CardHeader>
                          <CardContent className="text-foreground pb-6">
                            <ul className="list-disc list-inside space-y-2 text-sm mb-6">
                              <li>Fixed login button text display issue</li>
                              <li>Login page now defaults to light mode</li>
                              <li>Dark mode toggle available on all pages</li>
                              <li>Improved main challenges display with actual responses</li>
                              <li>Dashboard restricted to admin users only</li>
                              <li>Response timeline cleaned up for admin view</li>
                              <li>Enhanced cursor pointer consistency across UI</li>
                            </ul>
                          </CardContent>
                        </Card>
                      </TabsContent>
                      
                      <TabsContent value="faqs" className="space-y-4 mt-0">
                        <Card className="bg-card border-border">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-foreground">
                              <HelpCircle className="h-5 w-5" />
                              Frequently Asked Questions
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4 text-foreground">
                            <div>
                              <h4 className="font-semibold text-foreground mb-2">
                                How do I make a question visible/invisible?
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                Go to Survey Config and use the toggle switch next to each question to control
                                visibility.
                              </p>
                            </div>
                            <div>
                              <h4 className="font-semibold text-foreground mb-2">Can I export analytics data?</h4>
                              <p className="text-sm text-muted-foreground">
                                Yes! Admins can export data in both JSON and CSV formats from the Analytics page.
                              </p>
                            </div>
                            <div>
                              <h4 className="font-semibold text-foreground mb-2">
                                What's the difference between Admin and Viewer roles?
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                Admins have full access to all features including Dashboard. Viewers can only see
                                Analytics data.
                              </p>
                            </div>
                            <div>
                              <h4 className="font-semibold text-foreground mb-2">
                                How do I switch between light and dark mode?
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                Click the sun/moon icon in the top right corner and select your preferred theme.
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>
                      
                      <TabsContent value="terms" className="space-y-4 mt-0">
                        <Card className="bg-card border-border">
                          <CardHeader>
                            <CardTitle className="text-foreground">Terms and Conditions</CardTitle>
                          </CardHeader>
                          <CardContent className="text-foreground">
                            <div className="space-y-4 text-sm">
                              <p>
                                By using this survey platform, you agree to our terms of service. This platform is
                                designed for collecting product community feedback and should be used responsibly and
                                ethically.
                              </p>
                              <p>
                                All data collected through surveys is handled according to our privacy policy and
                                applicable data protection regulations.
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>
                      
                      <TabsContent value="privacy" className="space-y-4 mt-0">
                        <Card className="bg-card border-border">
                          <CardHeader>
                            <CardTitle className="text-foreground">Privacy Policy</CardTitle>
                          </CardHeader>
                          <CardContent className="text-foreground">
                            <div className="space-y-4 text-sm">
                              <p>
                                We take your privacy seriously. Survey responses are collected anonymously unless
                                participants voluntarily provide contact information.
                              </p>
                              <p>
                                Data is stored securely and is only accessible to authorized administrators. We do not
                                sell or share personal information with third parties.
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>
                      
                      <TabsContent value="about" className="space-y-4 mt-0">
                        <Card className="bg-card border-border">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-foreground">
                              <Eye className="h-5 w-5" />
                              About This Application
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="text-foreground">
                            <div className="space-y-4 text-sm">
                              <p>
                                Product Community Survey Builder is a comprehensive platform for collecting and analyzing
                                feedback from product communities.
                              </p>
                              <div className="space-y-2">
                                <p>
                                  <strong className="text-foreground">Author:</strong> Pablo Javier Rodriguez
                                </p>
                                <p>
                                  <strong className="text-foreground">Contact:</strong>{" "}
                                  <a
                                    href="https://www.linkedin.com/in/pablojavierrodriguez"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:text-primary/80 transition-colors"
                                  >
                                    LinkedIn Profile
                                  </a>
                                </p>
                                <p>
                                  <strong className="text-foreground">Version:</strong> 1.4.0
                                </p>
                                <p>
                                  <strong className="text-foreground">Built with:</strong> Next.js, React, Tailwind CSS,
                                  Supabase
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>
                    </ScrollArea>
                  </Tabs>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto bg-background">
          <div className="container mx-auto p-4 lg:p-6 xl:p-8 max-w-8xl">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
