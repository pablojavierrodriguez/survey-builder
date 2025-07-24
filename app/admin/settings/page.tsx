'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { supabase, UserManagement } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Save, Settings, Users, Database, Trash2, Mail, Shield, UserPlus, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'

// Types for settings
interface AppSettings {
  database: {
    url: string
    apiKey: string
    tableName: string
    connectionTimeout: number
  }
  security: {
    sessionTimeout: number
    maxLoginAttempts: number
    requireHttps: boolean
    enableRateLimit: boolean
    enforceStrongPasswords: boolean
    enableTwoFactor: boolean
  }
  notifications: {
    emailAlerts: boolean
    adminEmail: string
    responseThreshold: number
  }
  general: {
    appName: string
    publicUrl: string
    maintenanceMode: boolean
    analyticsEnabled: boolean
  }
}

export default function SettingsPage() {
  const { user, profile, signOut } = useAuth()
  const router = useRouter()
  
  // Redirect if not logged in or not admin
  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    if (profile && profile.role !== 'admin') {
      router.push('/admin/dashboard')
      return
    }
  }, [user, profile, router])

  // Settings state
  const [settings, setSettings] = useState<AppSettings>({
    database: {
      url: "https://qaauhwulohxeeacexrav.supabase.co",
      apiKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhYXVod3Vsb2h4ZWVhY2V4cmF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4MDMzMzMsImV4cCI6MjA2ODM3OTMzM30.T25Pz98qNu94FZzCYmGGEuA5xQ71sGHHfjppHuXuNy8",
      tableName: "pc_survey_data",
      connectionTimeout: 30,
    },
    security: {
      sessionTimeout: 480,
      maxLoginAttempts: 5,
      requireHttps: true,
      enableRateLimit: true,
      enforceStrongPasswords: false,
      enableTwoFactor: false,
    },
    notifications: {
      emailAlerts: false,
      adminEmail: "admin@example.com",
      responseThreshold: 10,
    },
    general: {
      appName: "Product Survey Builder",
      publicUrl: typeof window !== 'undefined' ? window.location.origin : '',
      maintenanceMode: false,
      analyticsEnabled: true,
    },
  })

  const [isSaving, setIsSaving] = useState(false)
  const [users, setUsers] = useState<UserManagement[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem("app_settings")
    if (savedSettings) {
      try {
        setSettings({ ...settings, ...JSON.parse(savedSettings) })
      } catch (error) {
        console.error("Error loading settings:", error)
      }
    }
    
    // Load users
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoadingUsers(true)
    setError('')
    try {
      const { data, error } = await supabase
        .from('user_management')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        setError(`Error fetching users: ${error.message}`)
        setUsers([])
      } else {
        setUsers(data || [])
      }
    } catch (err) {
      setError('Failed to fetch users')
      setUsers([])
    } finally {
      setLoadingUsers(false)
    }
  }

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase.rpc('update_user_role', {
        user_id: userId,
        new_role: newRole
      })

      if (error) {
        alert(`❌ Failed to update role: ${error.message}`)
      } else {
        alert('✅ User role updated successfully!')
        await fetchUsers()
      }
    } catch (error) {
      alert('❌ Failed to update role: Network error')
    }
  }

  const saveSettings = async () => {
    setIsSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    localStorage.setItem("app_settings", JSON.stringify(settings))
    window.dispatchEvent(new CustomEvent('app_settings_changed', { detail: settings }))
    setIsSaving(false)
    alert("Settings saved successfully!")
  }

  const updateSettings = (section: keyof AppSettings, key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }))
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (profile.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Shield className="w-12 h-12 mx-auto mb-4 text-red-500" />
              <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
              <p className="text-gray-600 mb-4">You need admin privileges to access this page.</p>
              <Button onClick={() => router.push('/admin/dashboard')}>
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">
            Manage your application settings and user accounts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {profile.role.toUpperCase()}
          </Badge>
          <Button variant="outline" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">
            <Settings className="w-4 h-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="database">
            <Database className="w-4 h-4 mr-2" />
            Database
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="w-4 h-4 mr-2" />
            Users
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure basic application settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="appName">Application Name</Label>
                  <Input
                    id="appName"
                    value={settings.general.appName}
                    onChange={(e) => updateSettings("general", "appName", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="publicUrl">Public URL</Label>
                  <Input
                    id="publicUrl"
                    value={settings.general.publicUrl}
                    onChange={(e) => updateSettings("general", "publicUrl", e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="maintenanceMode"
                  checked={settings.general.maintenanceMode}
                  onCheckedChange={(checked) => updateSettings("general", "maintenanceMode", checked)}
                />
                <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="analyticsEnabled"
                  checked={settings.general.analyticsEnabled}
                  onCheckedChange={(checked) => updateSettings("general", "analyticsEnabled", checked)}
                />
                <Label htmlFor="analyticsEnabled">Enable Analytics</Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Configure security and authentication settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={settings.security.sessionTimeout}
                    onChange={(e) => updateSettings("security", "sessionTimeout", parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    value={settings.security.maxLoginAttempts}
                    onChange={(e) => updateSettings("security", "maxLoginAttempts", parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="requireHttps"
                    checked={settings.security.requireHttps}
                    onCheckedChange={(checked) => updateSettings("security", "requireHttps", checked)}
                  />
                  <Label htmlFor="requireHttps">Require HTTPS</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="enableRateLimit"
                    checked={settings.security.enableRateLimit}
                    onCheckedChange={(checked) => updateSettings("security", "enableRateLimit", checked)}
                  />
                  <Label htmlFor="enableRateLimit">Enable Rate Limiting</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Database Configuration</CardTitle>
              <CardDescription>
                Configure your Supabase database connection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Database className="h-4 w-4" />
                <AlertDescription>
                  Database settings are now managed through Supabase directly. 
                  Use the Supabase dashboard to manage your database configuration.
                </AlertDescription>
              </Alert>

              <div>
                <Label htmlFor="tableName">Survey Data Table</Label>
                <Input
                  id="tableName"
                  value={settings.database.tableName}
                  onChange={(e) => updateSettings("database", "tableName", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>
                    Manage user accounts and permissions
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchUsers}
                  disabled={loadingUsers}
                >
                  {loadingUsers ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Current User Info */}
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                  👤 Current User
                </h4>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{profile.full_name || profile.email}</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">{profile.email}</p>
                  </div>
                  <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900">
                    {profile.role.toUpperCase()}
                  </Badge>
                </div>
              </div>

              {/* Demo Users Info */}
              <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                  ℹ️ Authentication Methods
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span className="text-amber-700 dark:text-amber-300">Email/Password signup and login</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span className="text-amber-700 dark:text-amber-300">Google OAuth login</span>
                  </div>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                    Users can create accounts at <strong>/login</strong> or be invited by admins.
                  </p>
                </div>
              </div>

              {/* Users List */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Registered Users ({users.length})</h4>
                
                {loadingUsers ? (
                  <div className="text-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                    <p className="text-sm text-gray-500 mt-2">Loading users...</p>
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    <Users className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                    <p className="text-sm font-medium mb-2">No users found</p>
                    <p className="text-xs">New users can register at <strong>/login</strong></p>
                  </div>
                ) : (
                  users.map((user) => (
                    <div key={user.id} className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded border">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {user.full_name || user.email}
                          </span>
                          {user.email_confirmed && (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                              ✓ Verified
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {user.email} • Joined {new Date(user.created_at).toLocaleDateString()}
                          {user.last_sign_in_at && (
                            <> • Last login {new Date(user.last_sign_in_at).toLocaleDateString()}</>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select
                          value={user.role}
                          onValueChange={(value) => updateUserRole(user.id, value)}
                          disabled={user.id === profile?.id} // Can't change own role
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="viewer">Viewer</SelectItem>
                            <SelectItem value="collaborator">Collaborator</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={isSaving}>
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  )
}
