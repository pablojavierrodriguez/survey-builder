"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Database, RefreshCw, Download, Trash2, Eye, Search, Filter, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { getDatabaseConfig, getDatabaseEndpoint, getDatabaseHeaders, ensureDevTableExists } from "@/lib/database-config"

interface SurveyResponse {
  id: string
  role: string
  other_role?: string
  company_type: string
  main_challenge: string
  daily_tools: string[]
  learning_methods: string[]
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

  useEffect(() => {
    testConnection()
    fetchResponses()
  }, [])

  useEffect(() => {
    filterResponses()
  }, [responses, searchTerm, selectedRole])

  const testConnection = async () => {
    try {
      setConnectionStatus("testing")
      
      // Get environment-specific config
      const config = getDatabaseConfig()
      
      // Check if dev table exists if we're in dev environment
      if (config.environment === 'dev') {
        const tableExists = await ensureDevTableExists()
        setDevTableExists(tableExists)
        if (!tableExists) {
          setConnectionStatus("disconnected")
          return
        }
      }
      
      // Test connection to the appropriate table
      const response = await fetch(getDatabaseEndpoint("?limit=1"), {
        headers: getDatabaseHeaders()
      })
      
      if (response.ok) {
        setConnectionStatus("connected")
      } else {
        // Fallback to localStorage for demo
        const localData = localStorage.getItem("survey")
        setConnectionStatus(localData ? "connected" : "disconnected")
      }
    } catch (error) {
      console.warn("Database connection failed, using localStorage")
      // Check if we have local data
      const localData = localStorage.getItem("survey")
      setConnectionStatus(localData ? "connected" : "disconnected")
    }
  }

  const fetchResponses = async () => {
    setIsLoading(true)
    try {
      // Try to fetch from environment-specific database first
      const response = await fetch(
        getDatabaseEndpoint("?select=*&order=created_at.desc"),
        {
          headers: getDatabaseHeaders()
        }
      )

      if (response.ok) {
        const data = await response.json()
        setResponses(data || [])
      } else {
        // Fallback to localStorage
        const localData = localStorage.getItem("survey")
        if (localData) {
          const parsedData = JSON.parse(localData)
          // Transform local data to match expected format
          const transformedData = parsedData.map((item: any, index: number) => ({
            id: item.id || `local-${index}`,
            role: item.role || 'Unknown',
            other_role: item.other_role,
            company_type: item.company_type || item.company_size || 'Unknown',
            main_challenge: item.main_challenge || 'No challenge provided',
            daily_tools: Array.isArray(item.daily_tools) ? item.daily_tools : [],
            learning_methods: Array.isArray(item.learning_methods) ? item.learning_methods : [],
            email: item.email,
            created_at: item.created_at || new Date().toISOString(),
          }))
          setResponses(transformedData)
        } else {
          setResponses([])
        }
      }
    } catch (error) {
      console.error("Error fetching responses, using localStorage:", error)
      // Fallback to localStorage
      const localData = localStorage.getItem("survey")
      if (localData) {
        const parsedData = JSON.parse(localData)
        const transformedData = parsedData.map((item: any, index: number) => ({
          id: item.id || `local-${index}`,
          role: item.role || 'Unknown',
          other_role: item.other_role,
          company_type: item.company_type || item.company_size || 'Unknown',
          main_challenge: item.main_challenge || 'No challenge provided',
          daily_tools: Array.isArray(item.daily_tools) ? item.daily_tools : [],
          learning_methods: Array.isArray(item.learning_methods) ? item.learning_methods : [],
          email: item.email,
          created_at: item.created_at || new Date().toISOString(),
        }))
        setResponses(transformedData)
      } else {
        setResponses([])
      }
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

    try {
      const response = await fetch(`https://qaauhwulohxeeacexrav.supabase.co/rest/v1/pc_survey_data?id=eq.${id}`, {
        method: "DELETE",
        headers: {
          apikey:
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhYXVod3Vsb2h4ZWVhY2V4cmF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4MDMzMzMsImV4cCI6MjA2ODM3OTMzM30.T25Pz98qNu94FZzCYmGGEuA5xQ71sGHHfjppHuXuNy8",
          Authorization:
            "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhYXVod3Vsb2h4ZWVhY2V4cmF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4MDMzMzMsImV4cCI6MjA2ODM3OTMzM30.T25Pz98qNu94FZzCYmGGEuA5xQ71sGHHfjppHuXuNy8",
        },
      })

      if (response.ok) {
        fetchResponses()
      }
    } catch (error) {
      console.error("Error deleting response:", error)
    }
  }

  const handleAutoSetup = async () => {
    setSetupLoading(true)
    try {
      const config = getDatabaseConfig()
      const environment = config.environment
      
      const response = await fetch('/api/admin/setup-environment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ environment })
      })

      const result = await response.json()

      if (result.success) {
        setDevTableExists(true)
        setConnectionStatus("connected")
        // Refetch responses after setup
        await fetchResponses()
        alert(`✅ ${result.environment.toUpperCase()} environment setup completed successfully!\n\nTable: ${result.details.tableName}\nSample Data: ${result.details.sampleData}\nFeatures: ${result.details.features.join(', ')}`)
      } else {
        console.error('Setup failed:', result.error)
        alert(`❌ Setup failed: ${result.error}`)
      }
    } catch (error) {
      console.error('Auto-setup error:', error)
      alert('❌ Setup failed: Network error')
    } finally {
      setSetupLoading(false)
    }
  }

  const uniqueRoles = [...new Set(responses.map((r) => r.role))].sort()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Database Management</h1>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            {connectionStatus === "connected" ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : connectionStatus === "disconnected" ? (
              <XCircle className="w-5 h-5 text-red-500" />
            ) : (
              <RefreshCw className="w-5 h-5 text-yellow-500 animate-spin" />
            )}
            <span className="text-sm text-muted-foreground capitalize">{connectionStatus}</span>
          </div>
          <Button onClick={fetchResponses} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Environment Info */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Environment</p>
              <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                {getDatabaseConfig().environment.toUpperCase()} - Table: {getDatabaseConfig().tableName}
              </p>
            </div>
            <Database className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
        </CardContent>
      </Card>

      {/* Auto-Setup for Dev Environment */}
      {getDatabaseConfig().environment === 'dev' && !devTableExists && (
        <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
              🚀 Auto-Setup Available
            </h3>
            <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
              The development table `pc_survey_data_dev` doesn't exist yet. 
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
                     Auto-Setup {getDatabaseConfig().environment.toUpperCase()} Environment
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
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search responses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-2 border bg-input text-input-foreground border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-background"
            >
              <option value="" className="bg-popover text-popover-foreground">All Roles</option>
              {uniqueRoles.map((role) => (
                <option key={role} value={role} className="bg-popover text-popover-foreground">
                  {role}
                </option>
              ))}
            </select>

            <Button onClick={exportData} disabled={filteredResponses.length === 0}>
              <Download className="w-4 h-4 mr-2" />
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
            <div className="space-y-4">
              {filteredResponses.map((response) => (
                <div key={response.id} className="border border-border rounded-lg p-4 bg-card text-card-foreground">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{response.role}</Badge>
                        <Badge variant="secondary">{response.company_type}</Badge>
                        <span className="text-xs text-muted-foreground">{new Date(response.created_at).toLocaleString()}</span>
                      </div>

                      <p className="text-sm text-foreground mb-2">
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
                        <p className="text-xs text-muted-foreground">
                          <strong>Email:</strong> {response.email}
                        </p>
                      )}
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteResponse(response.id)}
                      className="text-destructive hover:text-destructive-foreground hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
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
