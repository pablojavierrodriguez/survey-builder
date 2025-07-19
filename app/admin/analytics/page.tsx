"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart3, PieChart, TrendingUp, Users, RefreshCw, Download, Cloud, Trophy } from "lucide-react"

interface AnalyticsData {
  roleDistribution: { [key: string]: number }
  seniorityDistribution: { [key: string]: number }
  industryDistribution: { [key: string]: number }
  productTypeDistribution: { [key: string]: number }
  customerSegmentDistribution: { [key: string]: number }
  companyTypeDistribution: { [key: string]: number }
  toolsUsage: { [key: string]: number }
  learningMethodsUsage: { [key: string]: number }
  responsesByDate: { [key: string]: number }
  challengeWords: { [key: string]: number }
  totalResponses: number
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [userRole, setUserRole] = useState<string>("viewer")

  useEffect(() => {
    // Get user role from auth
    const authStr = localStorage.getItem("survey_auth")
    if (authStr) {
      try {
        const auth = JSON.parse(authStr)
        setUserRole(auth.role)
      } catch (error) {
        console.error("Error getting user role:", error)
      }
    }
  }, [])

  useEffect(() => {
    fetchAnalyticsData()
  }, [])

  const fetchAnalyticsData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("https://qaauhwulohxeeacexrav.supabase.co/rest/v1/pc_survey_data?select=*", {
        headers: {
          apikey:
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhYXVod3Vsb2h4ZWVhY2V4cmF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4MDMzMzMsImV4cCI6MjA2ODM3OTMzM30.T25Pz98qNu94FZzCYmGGEuA5xQ71sGHHfjppHuXuNy8",
          Authorization:
            "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhYXVod3Vsb2h4ZWVhY2V4cmF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4MDMzMzMsImV4cCI6MjA2ODM3OTMzM30.T25Pz98qNu94FZzCYmGGEuA5xQ71sGHHfjppHuXuNy8",
        },
      })

      if (response.ok) {
        const responses = await response.json()

        // Process data for analytics
        const roleDistribution: { [key: string]: number } = {}
        const seniorityDistribution: { [key: string]: number } = {}
        const industryDistribution: { [key: string]: number } = {}
        const productTypeDistribution: { [key: string]: number } = {}
        const customerSegmentDistribution: { [key: string]: number } = {}
        const companyTypeDistribution: { [key: string]: number } = {}
        const toolsUsage: { [key: string]: number } = {}
        const learningMethodsUsage: { [key: string]: number } = {}
        const responsesByDate: { [key: string]: number } = {}
        const challengeWords: { [key: string]: number } = {}

        responses.forEach((response: any) => {
          // Role distribution
          if (response.role) {
            roleDistribution[response.role] = (roleDistribution[response.role] || 0) + 1
          }

          // Seniority distribution
          if (response.seniority) {
            seniorityDistribution[response.seniority] = (seniorityDistribution[response.seniority] || 0) + 1
          }

          // Industry distribution
          if (response.industry) {
            industryDistribution[response.industry] = (industryDistribution[response.industry] || 0) + 1
          }

          // Product type distribution
          if (response.product_type) {
            productTypeDistribution[response.product_type] = (productTypeDistribution[response.product_type] || 0) + 1
          }

          // Customer segment distribution
          if (response.customer_segment) {
            customerSegmentDistribution[response.customer_segment] =
              (customerSegmentDistribution[response.customer_segment] || 0) + 1
          }

          // Company type distribution
          if (response.company_size || response.company_type) {
            const companyType = response.company_size || response.company_type
            companyTypeDistribution[companyType] = (companyTypeDistribution[companyType] || 0) + 1
          }

          // Tools usage
          if (response.daily_tools && Array.isArray(response.daily_tools)) {
            response.daily_tools.forEach((tool: string) => {
              toolsUsage[tool] = (toolsUsage[tool] || 0) + 1
            })
          }

          // Learning methods usage
          if (response.learning_methods && Array.isArray(response.learning_methods)) {
            response.learning_methods.forEach((method: string) => {
              learningMethodsUsage[method] = (learningMethodsUsage[method] || 0) + 1
            })
          }

          // Responses by date
          if (response.created_at) {
            const date = new Date(response.created_at).toDateString()
            responsesByDate[date] = (responsesByDate[date] || 0) + 1
          }

          // Challenge word cloud
          if (response.main_challenge) {
            const words = response.main_challenge
              .toLowerCase()
              .replace(/[^\w\s]/g, "")
              .split(/\s+/)
              .filter((word: string) => word.length > 3)
            words.forEach((word: string) => {
              challengeWords[word] = (challengeWords[word] || 0) + 1
            })
          }
        })

        setData({
          roleDistribution,
          seniorityDistribution,
          industryDistribution,
          productTypeDistribution,
          customerSegmentDistribution,
          companyTypeDistribution,
          toolsUsage,
          learningMethodsUsage,
          responsesByDate,
          challengeWords,
          totalResponses: responses.length,
        })
      }
    } catch (error) {
      console.error("Error fetching analytics data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const exportAnalytics = () => {
    if (!data) return

    const analyticsReport = {
      generatedAt: new Date().toISOString(),
      totalResponses: data.totalResponses,
      roleDistribution: data.roleDistribution,
      seniorityDistribution: data.seniorityDistribution,
      industryDistribution: data.industryDistribution,
      productTypeDistribution: data.productTypeDistribution,
      customerSegmentDistribution: data.customerSegmentDistribution,
      companyTypeDistribution: data.companyTypeDistribution,
      toolsUsage: data.toolsUsage,
      learningMethodsUsage: data.learningMethodsUsage,
      responsesByDate: data.responsesByDate,
      challengeWords: data.challengeWords,
    }

    const blob = new Blob([JSON.stringify(analyticsReport, null, 2)], { type: "application/json" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `analytics-report-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const renderRankingChart = (data: { [key: string]: number }, title: string, icon: any) => {
    const entries = Object.entries(data).sort(([, a], [, b]) => b - a)
    const total = entries.reduce((sum, [, value]) => sum + value, 0)

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {entries.slice(0, 10).map(([key, value], index) => {
              const percentage = total > 0 ? Math.round((value / total) * 100) : 0
              return (
                <div key={key} className="flex items-center gap-3">
                  <div className="flex items-center gap-2 w-8">
                    {index < 3 ? (
                      <Trophy
                        className={`w-4 h-4 ${index === 0 ? "text-yellow-500" : index === 1 ? "text-gray-400" : "text-orange-600"}`}
                      />
                    ) : (
                      <span className="text-sm text-gray-500 font-medium">#{index + 1}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate" title={key}>
                      {key}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 w-12 text-right">{percentage}%</div>
                    </div>
                  </div>
                  <div className="text-sm font-bold text-gray-900 w-8 text-right">{value}</div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderWordCloud = (words: { [key: string]: number }) => {
    const entries = Object.entries(words)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 30)
    const maxCount = Math.max(...entries.map(([, count]) => count))

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="w-5 h-5" />
            Main Challenges Word Cloud
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 justify-center">
            {entries.map(([word, count]) => {
              const size = Math.max(12, Math.min(24, (count / maxCount) * 20 + 12))
              const opacity = Math.max(0.5, count / maxCount)
              return (
                <span
                  key={word}
                  className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded-lg font-medium"
                  style={{
                    fontSize: `${size}px`,
                    opacity,
                  }}
                  title={`${word}: ${count} mentions`}
                >
                  {word}
                </span>
              )
            })}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="space-y-2">
                  {[...Array(5)].map((_, j) => (
                    <div key={j} className="h-6 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {userRole === "admin" ? "Analytics Dashboard" : "Survey Analytics"}
          </h1>
          {userRole === "viewer" && <p className="text-gray-600 mt-1">View survey response analytics and insights</p>}
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchAnalyticsData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          {userRole === "admin" && (
            <Button onClick={exportAnalytics}>
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Responses</p>
                <p className="text-3xl font-bold text-gray-900">{data?.totalResponses || 0}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unique Roles</p>
                <p className="text-3xl font-bold text-gray-900">
                  {data ? Object.keys(data.roleDistribution).length : 0}
                </p>
              </div>
              <PieChart className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tools Mentioned</p>
                <p className="text-3xl font-bold text-gray-900">{data ? Object.keys(data.toolsUsage).length : 0}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Industries</p>
                <p className="text-3xl font-bold text-gray-900">
                  {data ? Object.keys(data.industryDistribution).length : 0}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data && renderRankingChart(data.roleDistribution, "Role Distribution", <Users className="w-5 h-5" />)}
        {data &&
          renderRankingChart(data.seniorityDistribution, "Seniority Distribution", <TrendingUp className="w-5 h-5" />)}
        {data &&
          renderRankingChart(data.industryDistribution, "Industry Distribution", <BarChart3 className="w-5 h-5" />)}
        {data &&
          renderRankingChart(
            data.productTypeDistribution,
            "Product Type Distribution",
            <PieChart className="w-5 h-5" />,
          )}
        {data &&
          renderRankingChart(
            data.customerSegmentDistribution,
            "Customer Segment Distribution",
            <Users className="w-5 h-5" />,
          )}
        {data &&
          renderRankingChart(
            data.companyTypeDistribution,
            "Company Size Distribution",
            <BarChart3 className="w-5 h-5" />,
          )}
      </div>

      {/* Tools Ranking and Learning Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data && renderRankingChart(data.toolsUsage, "Most Used Tools Ranking", <Trophy className="w-5 h-5" />)}
        {data &&
          renderRankingChart(data.learningMethodsUsage, "Learning Methods Ranking", <BarChart3 className="w-5 h-5" />)}
      </div>

      {/* Word Cloud */}
      {data && renderWordCloud(data.challengeWords)}

      {/* Response Timeline - Admin Only */}
      {userRole === "admin" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Response Timeline (Admin Only)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data && Object.keys(data.responsesByDate).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(data.responsesByDate)
                  .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
                  .map(([date, count]) => {
                    const maxCount = Math.max(...Object.values(data.responsesByDate))
                    const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0
                    return (
                      <div key={date} className="flex items-center gap-3">
                        <div className="w-32 text-sm text-gray-600">{new Date(date).toLocaleDateString()}</div>
                        <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                          <div
                            className="bg-gradient-to-r from-green-500 to-blue-500 h-4 rounded-full flex items-center justify-end pr-2"
                            style={{ width: `${percentage}%` }}
                          >
                            <span className="text-white text-xs font-medium">{count}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">No response data available for timeline analysis.</div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
