"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { getCurrentUserPermissions, getUserRole, getRoleDisplayName } from "@/lib/permissions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart3, PieChart, TrendingUp, Users, RefreshCw, Download, Trophy, MessageSquare } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

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
  mainChallenges: string[]
  salaryData: {
    averageByCurrency: { [key: string]: number }
    averageByRole: { [key: string]: { ARS: number; USD: number } }
    averageByIndustry: { [key: string]: { ARS: number; USD: number } }
    rangeDistribution: { [key: string]: number }
  }
  totalResponses: number
}

const stopWords = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "but",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "to",
  "of",
  "in",
  "on",
  "at",
  "by",
  "for",
  "with",
  "as",
  "from",
  "up",
  "down",
  "out",
  "off",
  "over",
  "under",
  "again",
  "further",
  "then",
  "once",
  "here",
  "there",
  "when",
  "where",
  "why",
  "how",
  "all",
  "any",
  "both",
  "each",
  "few",
  "more",
  "most",
  "other",
  "some",
  "such",
  "no",
  "nor",
  "not",
  "only",
  "own",
  "same",
  "so",
  "than",
  "too",
  "very",
  "s",
  "t",
  "can",
  "will",
  "just",
  "don",
  "should",
  "now",
  "this",
  "that",
  "what",
  "with",
  "from",
  "your",
  "they",
  "have",
  "been",
  "will",
  "when",
  "where",
  "which",
  "such",
  "some",
  "more",
  "most",
  "also",
  "into",
  "than",
  "then",
  "there",
  "these",
  "those",
  "about",
  "after",
  "before",
  "below",
  "above",
  "under",
  "over",
  "through",
  "between",
  "among",
  "while",
  "until",
  "since",
  "upon",
  "within",
  "without",
  "around",
  "along",
  "across",
  "behind",
  "beyond",
  "beside",
  "except",
  "inside",
  "outside",
  "towards",
  "against",
  "amongst",
  "because",
  "before",
  "during",
  "through",
  "without",
  "however",
  "therefore",
  "although",
  "though",
  "unless",
  "until",
  "whereas",
  "wherever",
  "whether",
  "whilst",
  "would",
  "could",
  "should",
  "might",
  "must",
  "shall",
  "ought",
  "used",
  "need",
  "dare",
  "like",
  "just",
  "even",
  "only",
  "much",
  "many",
  "very",
  "quite",
  "rather",
  "hardly",
  "scarcely",
  "barely",
  "always",
  "never",
  "often",
  "seldom",
  "usually",
  "rarely",
  "already",
  "still",
  "soon",
  "today",
  "tomorrow",
  "yesterday",
  "tonight",
  "daily",
  "weekly",
  "monthly",
  "yearly",
  "once",
  "twice",
  "thrice",
  "first",
  "second",
  "third",
  "fourth",
  "fifth",
  "sixth",
  "seventh",
  "eighth",
  "ninth",
  "tenth",
  "eleventh",
  "twelfth",
  "etc",
])

const getNGrams = (text: string, n: number) => {
  const cleanedWords = text
    .toLowerCase()
    .replace(/[^\w\s]/g, "") // Remove punctuation
    .split(/\s+/) // Split by whitespace
    .filter((word) => word.length > 0 && !stopWords.has(word)) // Filter empty words and stopwords

  const ngrams: string[] = []
  for (let i = 0; i <= cleanedWords.length - n; i++) {
    ngrams.push(cleanedWords.slice(i, i + n).join(" "))
  }
  return ngrams
}

// Helper function to categorize salaries into ranges
const getSalaryRange = (salary: number, currency: string): string => {
  if (currency === "USD") {
    if (salary < 50000) return "< $50K USD"
    if (salary < 80000) return "$50K - $80K USD" 
    if (salary < 120000) return "$80K - $120K USD"
    if (salary < 180000) return "$120K - $180K USD"
    return "> $180K USD"
  } else { // ARS
    if (salary < 1000000) return "< $1M ARS"
    if (salary < 2000000) return "$1M - $2M ARS"
    if (salary < 3500000) return "$2M - $3.5M ARS"
    if (salary < 5000000) return "$3.5M - $5M ARS"
    return "> $5M ARS"
  }
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [userRole, setUserRole] = useState(getUserRole())
  const [permissions, setPermissions] = useState(getCurrentUserPermissions())

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
      // Get dynamic database configuration
      const { getDatabaseConfig, getDatabaseEndpoint, getDatabaseHeaders } = await import('@/lib/database-config')
      const config = await getDatabaseConfig()
      
      const response = await fetch(await getDatabaseEndpoint(), {
        headers: await getDatabaseHeaders()
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
        const mainChallenges: string[] = []
        const salaryDataByRole: { [key: string]: { ARS: number[], USD: number[] } } = {}
        const salaryDataByIndustry: { [key: string]: { ARS: number[], USD: number[] } } = {}
        const salaryRanges: { [key: string]: number } = {}
        const salaryByCurrency: { ARS: number[], USD: number[] } = { ARS: [], USD: [] }

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

          // Company type distribution (using company_size as primary)
          if (response.company_size) {
            companyTypeDistribution[response.company_size] = (companyTypeDistribution[response.company_size] || 0) + 1
          } else if (response.company_type) {
            // Fallback to company_type if company_size is null
            companyTypeDistribution[response.company_type] = (companyTypeDistribution[response.company_type] || 0) + 1
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

          // Main challenges - collect actual responses
          if (response.main_challenge && response.main_challenge.trim()) {
            mainChallenges.push(response.main_challenge.trim())
          }

          // Salary data processing
          if (response.salary_currency && (response.salary_average || (response.salary_min && response.salary_max))) {
            const currency = response.salary_currency
            let salaryValue = 0

            if (response.salary_average) {
              salaryValue = parseInt(response.salary_average)
            } else if (response.salary_min && response.salary_max) {
              salaryValue = (parseInt(response.salary_min) + parseInt(response.salary_max)) / 2
            }

            if (salaryValue > 0) {
              // Salary by currency
              salaryByCurrency[currency].push(salaryValue)

              // Salary by role
              if (response.role) {
                if (!salaryDataByRole[response.role]) {
                  salaryDataByRole[response.role] = { ARS: [], USD: [] }
                }
                salaryDataByRole[response.role][currency].push(salaryValue)
              }

              // Salary by industry
              if (response.industry) {
                if (!salaryDataByIndustry[response.industry]) {
                  salaryDataByIndustry[response.industry] = { ARS: [], USD: [] }
                }
                salaryDataByIndustry[response.industry][currency].push(salaryValue)
              }

              // Salary range distribution
              const range = getSalaryRange(salaryValue, currency)
              salaryRanges[range] = (salaryRanges[range] || 0) + 1
            }
          }
        })

        // Calculate salary averages
        const averageByCurrency: { [key: string]: number } = {}
        const averageByRole: { [key: string]: { ARS: number; USD: number } } = {}
        const averageByIndustry: { [key: string]: { ARS: number; USD: number } } = {}

        // Average by currency
        Object.keys(salaryByCurrency).forEach(currency => {
          const salaries = salaryByCurrency[currency]
          if (salaries.length > 0) {
            averageByCurrency[currency] = salaries.reduce((a, b) => a + b, 0) / salaries.length
          }
        })

        // Average by role
        Object.keys(salaryDataByRole).forEach(role => {
          averageByRole[role] = { ARS: 0, USD: 0 }
          Object.keys(salaryDataByRole[role]).forEach(currency => {
            const salaries = salaryDataByRole[role][currency]
            if (salaries.length > 0) {
              averageByRole[role][currency] = salaries.reduce((a, b) => a + b, 0) / salaries.length
            }
          })
        })

        // Average by industry
        Object.keys(salaryDataByIndustry).forEach(industry => {
          averageByIndustry[industry] = { ARS: 0, USD: 0 }
          Object.keys(salaryDataByIndustry[industry]).forEach(currency => {
            const salaries = salaryDataByIndustry[industry][currency]
            if (salaries.length > 0) {
              averageByIndustry[industry][currency] = salaries.reduce((a, b) => a + b, 0) / salaries.length
            }
          })
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
          mainChallenges,
          salaryData: {
            averageByCurrency,
            averageByRole,
            averageByIndustry,
            rangeDistribution: salaryRanges
          },
          totalResponses: responses.length,
        })
      }
    } catch (error) {
      console.error("Error fetching analytics data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const exportAnalyticsJson = () => {
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
      mainChallenges: data.mainChallenges,
    }

    const blob = new Blob([JSON.stringify(analyticsReport, null, 2)], { type: "application/json" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `analytics-report-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const exportAnalyticsCsv = () => {
    if (!data) return

    const headers = ["Category", "Item", "Count", "Percentage"]

    const rows: string[][] = []

    const addDistributionToRows = (dist: { [key: string]: number }, category: string, total: number) => {
      Object.entries(dist).forEach(([item, count]) => {
        const percentage = total > 0 ? ((count / total) * 100).toFixed(2) : "0.00"
        rows.push([category, item, count.toString(), percentage])
      })
    }

    addDistributionToRows(data.roleDistribution, "Role Distribution", data.totalResponses)
    addDistributionToRows(data.seniorityDistribution, "Seniority Distribution", data.totalResponses)
    addDistributionToRows(data.industryDistribution, "Industry Distribution", data.totalResponses)
    addDistributionToRows(data.productTypeDistribution, "Product Type Distribution", data.totalResponses)
    addDistributionToRows(data.customerSegmentDistribution, "Customer Segment Distribution", data.totalResponses)
    addDistributionToRows(data.companyTypeDistribution, "Company Size Distribution", data.totalResponses)

    const totalTools = Object.values(data.toolsUsage).reduce((sum, count) => sum + count, 0)
    addDistributionToRows(data.toolsUsage, "Tools Usage", totalTools)

    const totalLearningMethods = Object.values(data.learningMethodsUsage).reduce((sum, count) => sum + count, 0)
    addDistributionToRows(data.learningMethodsUsage, "Learning Methods Usage", totalLearningMethods)

    // Add main challenges as individual rows
    data.mainChallenges.forEach((challenge, index) => {
      rows.push(["Main Challenges", `Response ${index + 1}`, "1", "N/A"])
    })

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((field) => `"${field.replace(/"/g, '""')}"`).join(",")),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `analytics-report-${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const renderRankingChart = (data: { [key: string]: number }, title: string, icon: React.ReactNode) => {
    const entries = Object.entries(data).sort(([, a], [, b]) => b - a)
    const total = entries.reduce((sum, [, value]) => sum + value, 0)

    return (
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-50">
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
                      <span className="text-sm text-gray-500 font-medium dark:text-gray-400">#{index + 1}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate dark:text-gray-50" title={key}>
                      {key}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 w-12 text-right dark:text-gray-400">{percentage}%</div>
                    </div>
                  </div>
                  <div className="text-sm font-bold text-gray-900 w-8 text-right dark:text-gray-50">{value}</div>
                </div>
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">Analytics Dashboard</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4 dark:bg-gray-700"></div>
                <div className="space-y-2">
                  {[...Array(5)].map((_, j) => (
                    <div key={j} className="h-6 bg-gray-200 rounded dark:bg-gray-700"></div>
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-50">
            {userRole === "admin" ? "Analytics Dashboard" : "Survey Analytics"}
          </h1>
          {userRole === "viewer" && (
            <p className="text-gray-600 mt-1 dark:text-gray-400">View survey response analytics and insights</p>
          )}
        </div>
        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
          <Button
            onClick={fetchAnalyticsData}
            variant="outline"
            className="dark:bg-gray-800 dark:text-gray-50 dark:hover:bg-gray-700 bg-transparent cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          {permissions.canExportData && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="dark:bg-gray-800 dark:text-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                  <Download className="w-4 h-4 mr-2" />
                  Export Report
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="dark:bg-gray-800 dark:border-gray-700">
                <DropdownMenuItem
                  onClick={exportAnalyticsJson}
                  className="cursor-pointer dark:hover:bg-gray-700 dark:text-gray-50"
                >
                  Export JSON
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={exportAnalyticsCsv}
                  className="cursor-pointer dark:hover:bg-gray-700 dark:text-gray-50"
                >
                  Export CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Responses</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-50">{data?.totalResponses || 0}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Unique Roles</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-50">
                  {data ? Object.keys(data.roleDistribution).length : 0}
                </p>
              </div>
              <PieChart className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tools Mentioned</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-50">
                  {data ? Object.keys(data.toolsUsage).length : 0}
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Industries</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-50">
                  {data ? Object.keys(data.industryDistribution).length : 0}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
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
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {data && renderRankingChart(data.toolsUsage, "Most Used Tools Ranking", <Trophy className="w-5 h-5" />)}
        {data &&
          renderRankingChart(data.learningMethodsUsage, "Learning Methods Ranking", <BarChart3 className="w-5 h-5" />)}
      </div>

      {/* Salary Analytics */}
      {data && Object.keys(data.salaryData.averageByCurrency).length > 0 && Object.values(data.salaryData.averageByCurrency).some(val => val > 0) && (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
            {/* Average Salary by Currency */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-50">
                  <TrendingUp className="w-5 h-5" />
                  Average Salary by Currency
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(data.salaryData.averageByCurrency).map(([currency, avg]) => (
                    <div key={currency} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="font-medium text-gray-900 dark:text-gray-50">
                        {currency === 'USD' ? '🇺🇸 USD' : '🇦🇷 ARS'}
                      </span>
                      <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {currency === 'USD' ? '$' : '$'}{Math.round(avg).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Salary Range Distribution */}
            {data && renderRankingChart(data.salaryData.rangeDistribution, "Salary Range Distribution", <BarChart3 className="w-5 h-5" />)}
          </div>

          {/* Salary by Role */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-50">
                <Users className="w-5 h-5" />
                Average Salary by Role
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {Object.entries(data.salaryData.averageByRole)
                  .filter(([role, salaries]) => salaries.ARS > 0 || salaries.USD > 0)
                  .sort((a, b) => (b[1].USD + b[1].ARS/300) - (a[1].USD + a[1].ARS/300)) // Sort by USD equivalent
                  .map(([role, salaries]) => (
                    <div key={role} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-gray-50">{role}</h4>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {salaries.ARS > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">🇦🇷 ARS:</span>
                            <span className="font-bold text-blue-600 dark:text-blue-400">
                              ${Math.round(salaries.ARS).toLocaleString()}
                            </span>
                          </div>
                        )}
                        {salaries.USD > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">🇺🇸 USD:</span>
                            <span className="font-bold text-green-600 dark:text-green-400">
                              ${Math.round(salaries.USD).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Main Challenges - Actual Responses */}
      {data && data.mainChallenges.length > 0 && (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-50">
              <MessageSquare className="w-5 h-5" />
              Main Challenges - Survey Responses ({data.mainChallenges.length} responses)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {data.mainChallenges.map((challenge, index) => (
                <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border-l-4 border-blue-500">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-400">#{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">{challenge}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Response Timeline - Admin Only */}
      {userRole === "admin" && (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-50">
              <TrendingUp className="w-5 h-5" />
              Response Timeline
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
                        <div className="w-32 text-sm text-gray-600 dark:text-gray-400">
                          {new Date(date).toLocaleDateString()}
                        </div>
                        <div className="flex-1 bg-gray-200 rounded-full h-4 relative dark:bg-gray-700">
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
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No response data available for timeline analysis.
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
