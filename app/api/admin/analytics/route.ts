import { type NextRequest, NextResponse } from "next/server"
import { configManager } from "@/lib/config-manager"

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

    // Get configuration from ConfigManager
    const config = await configManager.getConfig()

    if (!config) {
      console.log("[v0] System not configured")
      return NextResponse.json({ success: false, error: "System not configured" }, { status: 404 })
    }

    // Get Supabase client
    const supabase = await configManager.getSupabaseClient()
    if (!supabase) {
      console.log("[v0] Could not initialize Supabase client")
      return NextResponse.json({ success: false, error: "Could not initialize Supabase client" }, { status: 500 })
    }

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
      console.log("[v0] Processing response data:", data)

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

      // Tools usage (assuming it's an array or comma-separated string)
      if (data.tools) {
        const tools = Array.isArray(data.tools) ? data.tools : data.tools.split(",").map((t: string) => t.trim())
        tools.forEach((tool: string) => {
          if (tool) {
            toolsUsage[tool] = (toolsUsage[tool] || 0) + 1
          }
        })
      }

      // Learning methods (assuming it's an array or comma-separated string)
      if (data.learning_methods) {
        const methods = Array.isArray(data.learning_methods)
          ? data.learning_methods
          : data.learning_methods.split(",").map((m: string) => m.trim())
        methods.forEach((method: string) => {
          if (method) {
            learningMethods[method] = (learningMethods[method] || 0) + 1
          }
        })
      }
    })

    console.log("[v0] Distributions calculated:", {
      roleDistribution,
      seniorityDistribution,
      industryDistribution,
      companyDistribution,
      toolsUsage,
      learningMethods,
    })

    return NextResponse.json({
      success: true,
      data: {
        totalResponses,
        roleDistribution,
        seniorityDistribution,
        industryDistribution,
        companyDistribution,
        toolsUsage,
        learningMethods,
      },
    })
  } catch (error) {
    console.error("[v0] Analytics API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
