"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Settings, Database, Shield, Bell, Save, TestTube, Lock, Eye, Users, Plus, Trash2, Loader2, UserPlus } from "lucide-react"

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
  const [settings, setSettings] = useState<AppSettings>({
    database: {
      url: "https://qaauhwulohxeeacexrav.supabase.co",
      apiKey:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhYXVod3Vsb2h4ZWVhY2V4cmF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4MDMzMzMsImV4cCI6MjA2ODM3OTMzM30.T25Pz98qNu94FZzCYmGGEuA5xQ71sGHHfjppHuXuNy8",
      tableName: "pc_survey_data",
      connectionTimeout: 30,
    },
    security: {
      sessionTimeout: 480, // 8 hours in minutes
      maxLoginAttempts: 5,
      requireHttps: true,
      enableRateLimit: true,
      enforceStrongPasswords: false, // Demo mode
      enableTwoFactor: false, // Demo mode
    },
    notifications: {
      emailAlerts: false,
      adminEmail: "admin@example.com",
      responseThreshold: 10,
    },
    general: {
      appName: "Product Survey Builder",
      publicUrl: window.location.origin,
      maintenanceMode: false,
      analyticsEnabled: true,
    },
  })

  const [isSaving, setIsSaving] = useState(false)
  const [testingConnection, setTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"success" | "error" | null>(null)
  const [showApiKey, setShowApiKey] = useState(false)

  // User Management State
  const [users, setUsers] = useState<any[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [creatingUser, setCreatingUser] = useState(false)
  const [newUser, setNewUser] = useState({ email: '', password: '', role: 'viewer' })

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
    try {
      const response = await fetch('/api/admin/users')
      const result = await response.json()
      
      if (result.success) {
        setUsers(result.users)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoadingUsers(false)
    }
  }

  const createUser = async () => {
    if (!newUser.email || !newUser.password) return

    setCreatingUser(true)
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      })

      const result = await response.json()

      if (result.success) {
        setNewUser({ email: '', password: '', role: 'viewer' })
        await fetchUsers()
        alert('✅ User created successfully!')
      } else {
        alert(`❌ Failed to create user: ${result.error}`)
      }
    } catch (error) {
      alert('❌ Failed to create user: Network error')
    } finally {
      setCreatingUser(false)
    }
  }

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return

    try {
      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })

      const result = await response.json()

      if (result.success) {
        await fetchUsers()
        alert('✅ User deleted successfully!')
      } else {
        alert(`❌ Failed to delete user: ${result.error}`)
      }
    } catch (error) {
      alert('❌ Failed to delete user: Network error')
    }
  }

  const updateUserRole = async (userId: string, role: string) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role })
      })

      const result = await response.json()

      if (result.success) {
        await fetchUsers()
        alert('✅ User role updated successfully!')
      } else {
        alert(`❌ Failed to update role: ${result.error}`)
      }
    } catch (error) {
      alert('❌ Failed to update role: Network error')
    }
  }

  const saveSettings = async () => {
    setIsSaving(true)

    // Simulate save delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Save to localStorage (in production, this would be saved to backend)
    localStorage.setItem("app_settings", JSON.stringify(settings))
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('app_settings_changed', { 
      detail: settings 
    }))
    console.log('Settings saved and event dispatched')

    setIsSaving(false)
    alert("Settings saved successfully!")
  }

  const testDatabaseConnection = async () => {
    setTestingConnection(true)
    setConnectionStatus(null)

    try {
      const response = await fetch(`${settings.database.url}/rest/v1/`, {
        headers: {
          apikey: settings.database.apiKey,
        },
      })

      setConnectionStatus(response.ok ? "success" : "error")
    } catch (error) {
      setConnectionStatus("error")
    } finally {
      setTestingConnection(false)
    }
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <Button onClick={saveSettings} disabled={isSaving}>
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Database Settings */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Database className="w-5 h-5" />
            Database Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Supabase URL</label>
              <Input
                value={settings.database.url}
                onChange={(e) => updateSettings("database", "url", e.target.value)}
                placeholder="https://your-project.supabase.co"
                className="bg-background text-foreground border-border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Table Name</label>
              <Input
                value={settings.database.tableName}
                onChange={(e) => updateSettings("database", "tableName", e.target.value)}
                placeholder="pc_survey_data"
                className="bg-background text-foreground border-border"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground mb-2">API Key</label>
            <div className="flex gap-2">
              <Input
                type={showApiKey ? "text" : "password"}
                value={settings.database.apiKey}
                onChange={(e) => updateSettings("database", "apiKey", e.target.value)}
                placeholder="Your Supabase anon key"
                className="flex-1 bg-background text-foreground border-border"
              />
              <Button variant="outline" onClick={() => setShowApiKey(!showApiKey)}>
                {showApiKey ? <Eye className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Button onClick={testDatabaseConnection} disabled={testingConnection} variant="outline">
              <TestTube className="w-4 h-4 mr-2" />
              {testingConnection ? "Testing..." : "Test Connection"}
            </Button>
            {connectionStatus && (
              <Badge variant={connectionStatus === "success" ? "default" : "destructive"}>
                {connectionStatus === "success" ? "Connected" : "Failed"}
              </Badge>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Connection Timeout (seconds)
            </label>
            <Input
              type="number"
              value={settings.database.connectionTimeout}
              onChange={(e) =>
                updateSettings("database", "connectionTimeout", Number.parseInt(e.target.value))
              }
              className="w-32 bg-background text-foreground border-border"
            />
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Shield className="w-5 h-5" />
            Security Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Session Timeout (minutes)
            </label>
            <Input
              type="number"
              value={settings.security.sessionTimeout}
              onChange={(e) => updateSettings("security", "sessionTimeout", Number.parseInt(e.target.value))}
              className="w-32 bg-background text-foreground border-border"
            />
            <p className="text-xs text-muted-foreground mt-1">
              How long before users are automatically logged out
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Max Login Attempts</label>
            <Input
              type="number"
              value={settings.security.maxLoginAttempts}
              onChange={(e) => updateSettings("security", "maxLoginAttempts", Number.parseInt(e.target.value))}
              className="w-32 bg-background text-foreground border-border"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-foreground">Require HTTPS</label>
                <p className="text-xs text-muted-foreground">Force secure connections only</p>
              </div>
              <Switch
                checked={settings.security.requireHttps}
                onCheckedChange={(checked) => updateSettings("security", "requireHttps", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-foreground">Enable Rate Limiting</label>
                <p className="text-xs text-muted-foreground">Prevent brute force attacks</p>
              </div>
              <Switch
                checked={settings.security.enableRateLimit}
                onCheckedChange={(checked) => updateSettings("security", "enableRateLimit", checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Bell className="w-5 h-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-foreground">Email Alerts</label>
              <p className="text-xs text-muted-foreground">Receive notifications for new responses</p>
            </div>
            <Switch
              checked={settings.notifications.emailAlerts}
              onCheckedChange={(checked) => updateSettings("notifications", "emailAlerts", checked)}
            />
          </div>

          {settings.notifications.emailAlerts && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Admin Email</label>
                <Input
                  type="email"
                  value={settings.notifications.adminEmail}
                  onChange={(e) => updateSettings("notifications", "adminEmail", e.target.value)}
                  placeholder="admin@example.com"
                  className="bg-background text-foreground border-border"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Alert Threshold</label>
                <Input
                  type="number"
                  value={settings.notifications.responseThreshold}
                  onChange={(e) =>
                    updateSettings("notifications", "responseThreshold", Number.parseInt(e.target.value))
                  }
                  className="w-32 bg-background text-foreground border-border"
                />
                <p className="text-xs text-muted-foreground mt-1">Send alert every N responses</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* General Settings */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Settings className="w-5 h-5" />
            General Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Application Name</label>
              <Input
                value={settings.general.appName}
                onChange={(e) => updateSettings("general", "appName", e.target.value)}
                placeholder="Product Survey Builder"
                className="bg-background text-foreground border-border"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Public URL</label>
              <Input
                value={settings.general.publicUrl}
                onChange={(e) => updateSettings("general", "publicUrl", e.target.value)}
                placeholder="https://your-domain.com"
                className="bg-background text-foreground border-border"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-foreground">Maintenance Mode</label>
                <p className="text-xs text-muted-foreground">Temporarily disable survey collection</p>
              </div>
              <Switch
                checked={settings.general.maintenanceMode}
                onCheckedChange={(checked) => updateSettings("general", "maintenanceMode", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-foreground">Analytics Enabled</label>
                <p className="text-xs text-muted-foreground">Track usage and performance metrics</p>
              </div>
              <Switch
                checked={settings.general.analyticsEnabled}
                onCheckedChange={(checked) => updateSettings("general", "analyticsEnabled", checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            User Management
          </CardTitle>
          <CardDescription>
            Manage application users and their permissions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
              <strong>Permission Levels:</strong>
            </p>
            <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1 ml-4">
              <li>• <strong>Admin:</strong> Full access to all features and settings</li>
              <li>• <strong>Collaborator:</strong> Can edit questions, read-only access to other tabs</li>
              <li>• <strong>Viewer:</strong> Access only to Analytics tab</li>
            </ul>
          </div>
          
          <div className="space-y-4">
            {/* Create New User */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-3">➕ Create New User</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Input
                  placeholder="Email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="dark:bg-gray-900 dark:text-gray-50"
                />
                <Input
                  placeholder="Password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  className="dark:bg-gray-900 dark:text-gray-50"
                />
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-900 dark:text-gray-50"
                >
                  <option value="viewer">Viewer</option>
                  <option value="collaborator">Collaborator</option>
                  <option value="admin">Admin</option>
                </select>
                <Button
                  onClick={createUser}
                  disabled={creatingUser || !newUser.email || !newUser.password}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {creatingUser ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Create User
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Current Users */}
            <div className="bg-gray-50 dark:bg-gray-900/20 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200">👥 Current Users</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchUsers}
                  disabled={loadingUsers}
                  className="text-xs"
                >
                  {loadingUsers ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    'Refresh'
                  )}
                </Button>
              </div>
              
              {/* Demo Users */}
              <div className="mb-3 space-y-2">
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-sm font-medium text-green-800 dark:text-green-200">🔑 Demo Admin (Temporary)</span>
                      <p className="text-xs text-green-600 dark:text-green-400">admin@demo.local (Full access for testing)</p>
                    </div>
                    <Badge variant="outline" className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                      DEMO ADMIN
                    </Badge>
                  </div>
                </div>
                
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-200 dark:border-amber-800">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-sm font-medium text-amber-800 dark:text-amber-200">👁️ Demo Viewer</span>
                      <p className="text-xs text-amber-600 dark:text-amber-400">viewer@demo.local (Read-only)</p>
                    </div>
                    <Badge variant="outline" className="text-xs bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300">
                      DEMO
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Real Users from Supabase */}
              <div className="space-y-2">
                {loadingUsers ? (
                  <div className="text-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                    <p className="text-sm text-gray-500 mt-2">Loading users...</p>
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    No real users found. Create one above.
                  </div>
                ) : (
                  users.map((user) => (
                    <div key={user.id} className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
                      <div>
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          🔑 {user.email}
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Created: {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={user.user_metadata?.role || 'viewer'}
                          onChange={(e) => updateUserRole(user.id, e.target.value)}
                          className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-gray-200"
                        >
                          <option value="viewer">Viewer</option>
                          <option value="collaborator">Collaborator</option>
                          <option value="admin">Admin</option>
                        </select>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteUser(user.id)}
                          className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 px-2 py-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
