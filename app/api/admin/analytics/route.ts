import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

interface SurveyResponse {
  id: number
  created_at: string
  updated_at: string
  response_data: any
  session_id?: string
  user_agent?: string
  ip_address?: string
}

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Analytics API called")

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.log("[v0] Missing Supabase configuration")
      return NextResponse.json({ success: false, error: "Supabase not configured" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get analytics data
    const { data: surveyData, error: surveyError } = await supabase
      .from("survey_data")
      .select("*")
      .order("created_at", { ascending: false })

    if (surveyError) {
      console.log("[v0] Error fetching survey data:", surveyError)
      return NextResponse.json(
        { success: false, error: `Error fetching survey data: ${surveyError.message}` },
        { status: 500 },
      )
    }

    console.log("[v0] Survey data fetched:", surveyData?.length || 0, "records")

    const totalResponses = surveyData?.length || 0
    const today = new Date().toDateString()
    const todayResponses = surveyData?.filter((r) => new Date(r.created_at).toDateString() === today).length || 0

    // Initialize distributions
    const roleDistribution: { [key: string]: number } = {}
    const seniorityDistribution: { [key: string]: number } = {}
    const industryDistribution: { [key: string]: number } = {}
    const companyDistribution: { [key: string]: number } = {}
    const toolsUsage: { [key: string]: number } = {}
    const learningMethods: { [key: string]: number } = {}

    // Process each survey response
    surveyData?.forEach((response: SurveyResponse) => {
      const data = response.response_data || {}

      // Role distribution
      if (data.role) {
        roleDistribution[data.role] = (roleDistribution[data.role] || 0) + 1
      }

      // Seniority distribution
      if (data.seniority) {
        seniorityDistribution[data.seniority] = (seniorityDistribution[data.seniority] || 0) + 1
      }

      // Industry distribution
      if (data.industry) {
        industryDistribution[data.industry] = (industryDistribution[data.industry] || 0) + 1
      }

      // Company size distribution
      if (data.company_size) {
        companyDistribution[data.company_size] = (companyDistribution[data.company_size] || 0) + 1
      }

      // Tools usage
      if (data.tools) {
        const tools = Array.isArray(data.tools) ? data.tools : [data.tools]
        tools.forEach((tool: string) => {
          if (tool) {
            toolsUsage[tool] = (toolsUsage[tool] || 0) + 1
          }
        })
      }

      // Learning methods
      if (data.learning_methods) {
        const methods = Array.isArray(data.learning_methods) ? data.learning_methods : [data.learning_methods]
        methods.forEach((method: string) => {
          if (method) {
            learningMethods[method] = (learningMethods[method] || 0) + 1
          }
        })
      }
    })

    const recentResponses =
      surveyData?.slice(0, 10).map((response) => ({
        ...response.response_data,
        created_at: response.created_at,
        id: response.id,
      })) || []

    return NextResponse.json({
      success: true,
      data: {
        totalResponses,
        todayResponses,
        roleDistribution,
        seniorityDistribution,
        industryDistribution,
        companyDistribution,
        toolsUsage,
        learningMethods,
        recentResponses,
      },
    })
  } catch (error) {
    console.error("[v0] Analytics API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
