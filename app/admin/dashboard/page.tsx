"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Users, 
  FileText, 
  TrendingUp, 
  Database, 
  Activity, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  BarChart3,
  PieChart,
  Calendar
} from "lucide-react"

interface DashboardStats {
  totalResponses: number
  todayResponses: number
  completionRate: number
  avgTimeToComplete: number
  topRole: string
  topIndustry: string
  recentResponses: any[]
}

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setError(null)
      
      // Get dynamic database configuration
      const { getDatabaseConfig, getDatabaseEndpoint, getDatabaseHeaders } = await import('@/lib/database-config')
      const config = getDatabaseConfig()
      
      // Try to fetch from configured database
      try {
        const response = await fetch(getDatabaseEndpoint(), {
          headers: getDatabaseHeaders()
        })
        
        if (response.ok) {
          const data = await response.json()
          if (Array.isArray(data)) {
            calculateStats(data)
            return
          }
        }
      } catch (apiError) {
        console.warn('API fetch failed, trying localStorage:', apiError)
      }
      
      // Fallback to localStorage
      const localData = localStorage.getItem("survey")
      let data = []
      
      if (localData) {
        data = JSON.parse(localData)
      }

      // Try to fetch from Supabase if available
      try {
        const response = await fetch(
          "https://qaauhwulohxeeacexrav.supabase.co/rest/v1/pc_survey_data?select=*&order=created_at.desc",
          {
            headers: {
              apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhYXVod3Vsb2h4ZWVhY2V4cmF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4MDMzMzMsImV4cCI6MjA2ODM3OTMzM30.T25Pz98qNu94FZzCYmGGEuA5xQ71sGHHfjppHuXuNy8",
              Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhYXVod3Vsb2h4ZWVhY2V4cmF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4MDMzMzMsImV4cCI6MjA2ODM3OTMzM30.T25Pz98qNu94FZzCYmGGEuA5xQ71sGHHfjppHuXuNy8",
            },
          }
        )

        if (response.ok) {
          const supabaseData = await response.json()
          if (supabaseData && supabaseData.length > 0) {
            data = supabaseData
          }
        }
      } catch (apiError) {
        console.warn("Supabase API not available, using local data")
      }

      // Process the data
      const today = new Date().toDateString()
      const todayResponses = data.filter((r: any) => 
        new Date(r.created_at).toDateString() === today
      ).length

      const roles = data.map((r: any) => r.role).filter(Boolean)
      const topRole = getMostFrequent(roles) || "Product Manager"
      
      const industries = data.map((r: any) => r.industry).filter(Boolean)
      const topIndustry = getMostFrequent(industries) || "Technology/Software"

      setStats({
        totalResponses: data.length,
        todayResponses,
        completionRate: data.length > 0 ? 85 : 0, // Simulated completion rate
        avgTimeToComplete: 4.2, // Simulated average time
        topRole,
        topIndustry,
        recentResponses: data.slice(0, 5),
      })
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      setError("Failed to load dashboard data. Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }

  const getMostFrequent = (arr: string[]) => {
    if (!arr.length) return null
    const frequency: { [key: string]: number } = {}
    arr.forEach(item => {
      frequency[item] = (frequency[item] || 0) + 1
    })
    return Object.keys(frequency).reduce((a, b) => frequency[a] > frequency[b] ? a : b)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="bg-card border-border">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error && !stats) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
        <Button onClick={fetchDashboardData} className="mt-4">
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your survey responses and analytics
          </p>
        </div>
        <Button onClick={fetchDashboardData} variant="outline" size="sm" disabled={isLoading}>
          <Activity className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Responses
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats?.totalResponses || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{stats?.todayResponses || 0} today
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completion Rate
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats?.completionRate || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Above average
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. Time
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats?.avgTimeToComplete || 0}m</div>
            <p className="text-xs text-muted-foreground">
              To complete survey
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Today
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats?.todayResponses || 0}</div>
            <p className="text-xs text-muted-foreground">
              New responses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top Insights */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <BarChart3 className="h-5 w-5" />
              Top Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-foreground">Most Common Role</p>
                <p className="text-xs text-muted-foreground">{stats?.topRole || "No data"}</p>
              </div>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-foreground">Top Industry</p>
                <p className="text-xs text-muted-foreground">{stats?.topIndustry || "No data"}</p>
              </div>
              <PieChart className="h-4 w-4 text-muted-foreground" />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-foreground">Response Rate</p>
                <p className="text-xs text-muted-foreground">Growing steadily</p>
              </div>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.recentResponses && stats.recentResponses.length > 0 ? (
              <div className="space-y-3">
                {stats.recentResponses.slice(0, 5).map((response, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {response.role || "Anonymous"} from {response.industry || "Unknown Industry"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {response.created_at ? new Date(response.created_at).toLocaleString() : "Recently"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No responses yet</p>
                <p className="text-xs text-muted-foreground">Survey responses will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Calendar className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-accent hover:text-accent-foreground transition-colors"
              onClick={() => router.push("/admin/analytics")}
            >
              <BarChart3 className="h-5 w-5" />
              <span className="text-sm">View Analytics</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-accent hover:text-accent-foreground transition-colors"
              onClick={() => router.push("/admin/database")}
            >
              <Database className="h-5 w-5" />
              <span className="text-sm">Export Data</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-accent hover:text-accent-foreground transition-colors"
              onClick={() => router.push("/admin/survey-config")}
            >
              <FileText className="h-5 w-5" />
              <span className="text-sm">Survey Config</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Some data may be incomplete due to connectivity issues.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
