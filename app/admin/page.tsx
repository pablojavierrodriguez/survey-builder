import { Metadata } from 'next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Database, 
  Settings, 
  BarChart3, 
  Activity,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import Link from 'next/link'
import { StatusChecker } from '@/components/debug/status-checker'

export const metadata: Metadata = {
  title: 'Admin Dashboard - Product Community Survey',
  description: 'Admin dashboard for managing survey responses and settings',
}

export default function AdminDashboard() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your survey application and view analytics
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          Admin Panel
        </Badge>
      </div>

      {/* System Status Checker */}
      <StatusChecker />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Survey submissions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Registered users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">Configuration Required</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Database not configured
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Analytics</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">Unavailable</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Requires database connection
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>Database Management</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              View and manage survey responses, test database connections, and monitor data integrity.
            </p>
            <Link href="/admin/database">
              <Button className="w-full">
                Manage Database
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Application Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Configure database connections, application settings, and user management.
            </p>
            <Link href="/admin/settings">
              <Button className="w-full">
                Configure Settings
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Analytics & Reports</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              View survey analytics, generate reports, and export data for analysis.
            </p>
            <Link href="/admin/analytics">
              <Button className="w-full">
                View Analytics
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Environment</h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Environment:</span>
                  <Badge variant="outline">Production</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Database Status:</span>
                  <Badge variant="destructive">Not Configured</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Authentication:</span>
                  <Badge variant="outline">Enabled</Badge>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Features</h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Survey Submission:</span>
                  <Badge variant="destructive">Disabled</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Analytics:</span>
                  <Badge variant="destructive">Unavailable</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Data Export:</span>
                  <Badge variant="destructive">Unavailable</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}