"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Database, RefreshCw, Download, Trash2, Eye, Search, Filter, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { getSupabaseConfig, ensureDevTableExists, ensureTableExists } from "@/lib/database-config"

interface SurveyResponse {
  id: string
  role: string
  other_role?: string
  seniority: string
  company_type: string
  company_size: string
  industry: string
  product_type: string
  customer_segment: string
  main_challenge: string
  daily_tools: string[]
  other_tool?: string
  learning_methods: string[]
  salary_currency: string
  salary_min?: string
  salary_max?: string
  salary_average?: string
  email?: string
  created_at: string
}

export default function DatabasePage() {
  const [responses, setResponses] = useState<SurveyResponse[]>([])
  const [filteredResponses, setFilteredResponses] = useState<SurveyResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRole, setSelectedRole] = useState("")
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "testing">("testing")
  const [setupLoading, setSetupLoading] = useState(false)
  const [devTableExists, setDevTableExists] = useState(false)
  const [config, setConfig] = useState<any>(null)

  useEffect(() => {
    testConnection()
    fetchResponses()
  }, [])

  useEffect(() => {
    filterResponses()
  }, [responses, searchTerm, selectedRole])

  // Listen for settings changes and refresh database info
  useEffect(() => {
    const handleSettingsChange = () => {
      console.log('Settings changed, refreshing database info...')
      testConnection()
      fetchResponses()
    }

    // Listen for custom events when settings are saved
    window.addEventListener('app_settings_changed', handleSettingsChange)
    window.addEventListener('settingsUpdated', handleSettingsChange)
    
    // Also listen for storage changes (fallback)
    window.addEventListener('storage', (e) => {
      if (e.key === 'survey_settings' || e.key === 'app_settings') {
        handleSettingsChange()
      }
    })

    return () => {
      window.removeEventListener('app_settings_changed', handleSettingsChange)
      window.removeEventListener('settingsUpdated', handleSettingsChange)
    }
  }, [])

  const testConnection = async () => {
    try {
      setConnectionStatus("testing")
      
      // Get database configuration
      const dbConfig = await getSupabaseConfig()
      setConfig(dbConfig)
      
      // Check if we have valid database configuration
      if (!dbConfig.supabaseUrl || !dbConfig.anonKey) {
        setConnectionStatus("disconnected")
        return
      }

              // Test connection by making a simple API call
        const response = await fetch('/api/admin/database/test', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tableName: dbConfig.tableName
          })
        })

        if (response.ok) {
          setConnectionStatus("connected")
          
          // Check if configured table exists
          const tableExists = await ensureTableExists(dbConfig.tableName)
          setDevTableExists(tableExists)
        } else {
          setConnectionStatus("disconnected")
        }
    } catch (error) {
      console.error('Connection test failed:', error)
      setConnectionStatus("disconnected")
    }
  }

  const fetchResponses = async () => {
    setIsLoading(true)
    try {
      // Use the authenticated database API endpoint
      const response = await fetch('/api/admin/database')

      if (response.ok) {
        const result = await response.json()
        
        if (result.success && result.data) {
          setResponses(result.data.records || [])
          setConnectionStatus("connected")
        } else {
          console.error('Database API error:', result.error)
          setResponses([])
          setConnectionStatus("disconnected")
        }
      } else {
        console.error('Database connection failed:', response.status, response.statusText)
        setResponses([])
        setConnectionStatus("disconnected")
      }
    } catch (error) {
      console.error("Error fetching responses:", error)
      setResponses([])
      setConnectionStatus("disconnected")
    } finally {
      setIsLoading(false)
    }
  }

  const filterResponses = () => {
    let filtered = responses

    if (searchTerm) {
      filtered = filtered.filter(
        (response) =>
          response.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
          response.main_challenge.toLowerCase().includes(searchTerm.toLowerCase()) ||
          response.company_type.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (selectedRole) {
      filtered = filtered.filter((response) => response.role === selectedRole)
    }

    setFilteredResponses(filtered)
  }

  const exportData = () => {
    const csvContent = [
      // Headers
      [
        "ID",
        "Role",
        "Other Role",
        "Company Type",
        "Main Challenge",
        "Daily Tools",
        "Learning Methods",
        "Email",
        "Created At",
      ].join(","),
      // Data
      ...filteredResponses.map((response) =>
        [
          response.id,
          `"${response.role}"`,
          `"${response.other_role || ""}"`,
          `"${response.company_type}"`,
          `"${response.main_challenge.replace(/"/g, '""')}"`,
          `"${response.daily_tools.join("; ")}"`,
          `"${response.learning_methods.join("; ")}"`,
          `"${response.email || ""}"`,
          response.created_at,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `survey-responses-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const deleteResponse = async (id: string) => {
    if (!confirm("Are you sure you want to delete this response?")) return

    // Check if we're connected to the database
    if (connectionStatus !== "connected") {
      alert("❌ Cannot delete response: Not connected to database")
      return
    }

    try {
      // Get database configuration
      const config = await getSupabaseConfig()
      
      if (!config.supabaseUrl || !config.anonKey) {
        alert("❌ Cannot delete response: No valid database configuration")
        return
      }

      const response = await fetch(`${config.supabaseUrl}/rest/v1/${config.tableName}?id=eq.${id}`, {
        method: "DELETE",
        headers: {
          'apikey': config.anonKey,
          'Authorization': `Bearer ${config.anonKey}`,
          'Content-Type': 'application/json'
        },
      })

      if (response.ok) {
        fetchResponses()
        alert("✅ Response deleted successfully")
      } else {
        alert(`❌ Failed to delete response: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      console.error("Error deleting response:", error)
      alert("❌ Error deleting response: Network error")
    }
  }

  const handleAutoSetup = async () => {
    setSetupLoading(true)
    try {
      // Get database configuration
      const config = await getSupabaseConfig()
      const environment = config.environment
      
      // Show manual setup instructions with current configuration
      const manualInstructions = `📋 MANUAL SETUP REQUIRED:

Current Configuration:
- Environment: ${environment}
- Table Name: ${config.tableName}
- Supabase URL: ${config.supabaseUrl}

Steps:
1. Go to your Supabase Dashboard
2. Open the SQL Editor
3. Copy and run the database schema script
4. The script will create all necessary tables and sample data

🔗 Direct link: ${config.supabaseUrl}/project/default/sql

Note: Auto-setup is not available. Please configure the database manually using the settings panel.`

      alert(manualInstructions)
      
    } catch (error) {
      console.error('Setup error:', error)
      alert('Error during setup. Please try again.')
    } finally {
      setSetupLoading(false)
    }
  }

  const uniqueRoles = [...new Set(responses.map((r) => r.role))].sort()

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Database Management</h1>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2">
            {connectionStatus === "connected" ? (
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
            ) : connectionStatus === "disconnected" ? (
              <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
            ) : (
              <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 animate-spin" />
            )}
            <span className="text-xs sm:text-sm text-muted-foreground capitalize">{connectionStatus}</span>
          </div>
          <Button 
            onClick={() => {
              testConnection()
              fetchResponses()
            }} 
            variant="outline"
            size="sm"
            className="text-xs sm:text-sm"
          >
            <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Environment Info */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Current Configuration</p>
              <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                {config?.environment?.toUpperCase() || 'UNKNOWN'} - Table: {config?.tableName || 'unknown'}
              </p>
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                URL: {config?.supabaseUrl?.substring(0, 30) || 'Not configured'}...
              </p>
            </div>
            <Database className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
        </CardContent>
      </Card>

      {/* Configuration Info */}
      <Card className="bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800">
        <CardContent className="p-4">
          <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
            ℹ️ Configuration Management
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Database configuration is managed in the Settings tab. Changes made there will automatically update this view.
          </p>
        </CardContent>
      </Card>

      {/* Auto-Setup for Missing Table */}
      {connectionStatus === "disconnected" && (
        <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
              🚀 Auto-Setup Available
            </h3>
                          <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                The table `{config?.tableName || 'unknown'}` doesn't exist yet. 
                You can create it automatically or manually using SQL.
              </p>
            <div className="flex gap-2">
                             <Button
                 size="sm"
                 onClick={handleAutoSetup}
                 disabled={setupLoading}
                 className="bg-green-600 hover:bg-green-700 text-white"
               >
                 {setupLoading ? (
                   <>
                     <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                     Setting up...
                   </>
                 ) : (
                                        <>
                       <Database className="w-4 h-4 mr-2" />
                       Auto-Setup {config?.environment?.toUpperCase() || 'UNKNOWN'} Environment
                     </>
                 )}
               </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('/setup_dev_database.sql', '_blank')}
                className="text-amber-700 border-amber-300 hover:bg-amber-100 dark:text-amber-300 dark:border-amber-600 dark:hover:bg-amber-900/30"
              >
                📄 Manual SQL Script
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Database Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card text-card-foreground border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Records</p>
                <p className="text-3xl font-bold text-foreground">{responses.length}</p>
              </div>
              <Database className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Filtered Results</p>
                <p className="text-3xl font-bold text-foreground">{filteredResponses.length}</p>
              </div>
              <Filter className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unique Roles</p>
                <p className="text-3xl font-bold text-foreground">{uniqueRoles.length}</p>
              </div>
              <Eye className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card className="bg-card text-card-foreground border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Filters & Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <Input
                  placeholder="Search responses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 sm:pl-10 text-sm"
                />
              </div>
            </div>

            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-2 border bg-input text-input-foreground border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-background text-sm"
            >
              <option value="" className="bg-popover text-popover-foreground">All Roles</option>
              {uniqueRoles.map((role) => (
                <option key={role} value={role} className="bg-popover text-popover-foreground">
                  {role}
                </option>
              ))}
            </select>

            <Button onClick={exportData} disabled={filteredResponses.length === 0} size="sm" className="text-xs sm:text-sm">
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Responses Table */}
      <Card className="bg-card text-card-foreground border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Survey Responses ({filteredResponses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted-foreground/50 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : filteredResponses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No responses found matching your criteria.</div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {filteredResponses.map((response) => (
                <div key={response.id} className="border border-border rounded-lg p-3 sm:p-4 bg-card text-card-foreground">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">{response.role}</Badge>
                        <Badge variant="secondary" className="text-xs">{response.company_type}</Badge>
                        <span className="text-xs text-muted-foreground">{new Date(response.created_at).toLocaleString()}</span>
                      </div>

                      <p className="text-xs sm:text-sm text-foreground mb-2 break-words">
                        <strong>Challenge:</strong> {response.main_challenge}
                      </p>

                      <div className="flex flex-wrap gap-1 mb-2">
                        <span className="text-xs text-muted-foreground">Tools:</span>
                        {response.daily_tools.map((tool, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {tool}
                          </Badge>
                        ))}
                      </div>

                      {response.email && (
                        <p className="text-xs text-muted-foreground break-all">
                          <strong>Email:</strong> {response.email}
                        </p>
                      )}
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteResponse(response.id)}
                      className="text-destructive hover:text-destructive-foreground hover:bg-destructive/10 h-8 w-8 p-0 flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
