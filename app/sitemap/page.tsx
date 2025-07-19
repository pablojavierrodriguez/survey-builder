"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Home,
  Shield,
  LayoutDashboard,
  FileText,
  Database,
  BarChart3,
  Settings,
  TestTube,
  Map,
  Users,
  Lock,
  Eye,
} from "lucide-react"

interface PageInfo {
  path: string
  name: string
  description: string
  access: "public" | "admin" | "viewer" | "auth"
  icon: any
  features: string[]
}

const pages: PageInfo[] = [
  {
    path: "/",
    name: "Survey Form",
    description: "Main survey interface for collecting user responses",
    access: "public",
    icon: Home,
    features: [
      "Multi-step survey form",
      "Progress tracking",
      "Form validation",
      "Responsive design",
      "Data submission to Supabase",
    ],
  },
  {
    path: "/auth/login",
    name: "Admin Login",
    description: "Authentication page for admin and viewer access",
    access: "auth",
    icon: Shield,
    features: [
      "Role-based authentication",
      "Session management",
      "Demo credentials",
      "Security validation",
      "Auto-redirect based on role",
    ],
  },
  {
    path: "/admin/dashboard",
    name: "Admin Dashboard",
    description: "Main admin interface with overview and statistics",
    access: "admin",
    icon: LayoutDashboard,
    features: ["Real-time statistics", "Recent responses", "Quick insights", "System status", "Quick actions"],
  },
  {
    path: "/admin/survey-config",
    name: "Survey Configuration",
    description: "Dynamic survey builder and configuration panel",
    access: "admin",
    icon: FileText,
    features: [
      "Question builder",
      "Survey settings",
      "Question types management",
      "Preview functionality",
      "Enable/disable survey",
    ],
  },
  {
    path: "/admin/database",
    name: "Database Management",
    description: "View, filter, and manage survey responses",
    access: "admin",
    icon: Database,
    features: [
      "Response viewing",
      "Search and filtering",
      "Data export (CSV)",
      "Response deletion",
      "Connection monitoring",
    ],
  },
  {
    path: "/admin/analytics",
    name: "Analytics Dashboard",
    description: "Data visualization and insights from survey responses",
    access: "viewer",
    icon: BarChart3,
    features: [
      "Role distribution charts",
      "Company analysis",
      "Tools usage statistics",
      "Response timeline",
      "Export reports (admin only)",
    ],
  },
  {
    path: "/admin/settings",
    name: "System Settings",
    description: "Application configuration and security settings",
    access: "admin",
    icon: Settings,
    features: [
      "Database configuration",
      "Security settings",
      "Notification preferences",
      "General app settings",
      "Environment management",
    ],
  },
  {
    path: "/test-survey",
    name: "Production Testing",
    description: "Comprehensive system testing and validation",
    access: "public",
    icon: TestTube,
    features: [
      "Database connection tests",
      "Survey submission tests",
      "Authentication validation",
      "Analytics functionality",
      "Production readiness check",
    ],
  },
  {
    path: "/sitemap",
    name: "Application Sitemap",
    description: "Complete overview of all pages and features",
    access: "public",
    icon: Map,
    features: ["Page directory", "Feature overview", "Access control info", "Navigation guide", "System architecture"],
  },
]

const accessConfig = {
  public: { color: "bg-green-100 text-green-800", icon: Eye },
  auth: { color: "bg-blue-100 text-blue-800", icon: Shield },
  admin: { color: "bg-red-100 text-red-800", icon: Lock },
  viewer: { color: "bg-purple-100 text-purple-800", icon: Users },
}

export default function SitemapPage() {
  const publicPages = pages.filter((p) => p.access === "public")
  const authPages = pages.filter((p) => p.access === "auth")
  const adminPages = pages.filter((p) => p.access === "admin")
  const viewerPages = pages.filter((p) => p.access === "viewer")

  const renderPageCard = (page: PageInfo) => {
    const accessInfo = accessConfig[page.access]
    const IconComponent = page.icon

    return (
      <Card key={page.path} className="h-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconComponent className="w-5 h-5 text-gray-600" />
              <CardTitle className="text-lg">{page.name}</CardTitle>
            </div>
            <Badge className={accessInfo.color}>
              <accessInfo.icon className="w-3 h-3 mr-1" />
              {page.access}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">{page.description}</p>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded">{page.path}</code>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Features:</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                {page.features.map((feature, index) => (
                  <li key={index}>• {feature}</li>
                ))}
              </ul>
            </div>

            <Button onClick={() => window.open(page.path, "_blank")} size="sm" variant="outline" className="w-full">
              Visit Page
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Application Sitemap</h1>
          <p className="text-lg text-gray-600">
            Complete overview of all pages and features in the Product Survey Builder
          </p>
        </div>

        {/* Access Legend */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Access Control Legend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(accessConfig).map(([key, config]) => (
                <div key={key} className="flex items-center gap-2">
                  <Badge className={config.color}>
                    <config.icon className="w-3 h-3 mr-1" />
                    {key}
                  </Badge>
                  <span className="text-sm text-gray-600 capitalize">
                    {key === "public" && "Anyone can access"}
                    {key === "auth" && "Login required"}
                    {key === "admin" && "Admin only"}
                    {key === "viewer" && "Admin + Viewer"}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Public Pages */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Eye className="w-6 h-6 text-green-600" />
            Public Pages ({publicPages.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{publicPages.map(renderPageCard)}</div>
        </div>

        {/* Authentication Pages */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            Authentication Pages ({authPages.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{authPages.map(renderPageCard)}</div>
        </div>

        {/* Admin Pages */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Lock className="w-6 h-6 text-red-600" />
            Admin Only Pages ({adminPages.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{adminPages.map(renderPageCard)}</div>
        </div>

        {/* Viewer Pages */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-600" />
            Viewer Access Pages ({viewerPages.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{viewerPages.map(renderPageCard)}</div>
        </div>

        {/* System Architecture */}
        <Card>
          <CardHeader>
            <CardTitle>System Architecture Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Frontend Stack</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Next.js 14 with App Router</li>
                  <li>• React with TypeScript</li>
                  <li>• Tailwind CSS for styling</li>
                  <li>• shadcn/ui components</li>
                  <li>• Responsive design</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Backend & Database</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Supabase PostgreSQL database</li>
                  <li>• REST API integration</li>
                  <li>• Row Level Security (RLS)</li>
                  <li>• Real-time data sync</li>
                  <li>• Automated backups</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Security Features</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Role-based access control</li>
                  <li>• Session management</li>
                  <li>• HTTPS enforcement</li>
                  <li>• Security headers</li>
                  <li>• Input validation</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Deployment</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Environment variables</li>
                  <li>• SSL certificates</li>
                  <li>• CDN optimization</li>
                  <li>• Error monitoring</li>
                  <li>• Performance tracking</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
