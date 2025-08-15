import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    console.log("📝 Survey submission started...")

    if (!isSupabaseConfigured) {
      console.error("❌ Supabase not configured")
      return NextResponse.json(
        { success: false, error: "System not configured - missing Supabase environment variables" },
        { status: 503 },
      )
    }

    const supabase = await getSupabaseClient()
    if (!supabase) {
      console.error("❌ Could not create Supabase client")
      return NextResponse.json({ success: false, error: "Database connection failed" }, { status: 503 })
    }

    // Parse request body - expecting normalized data now
    const body = await request.json()
    const { response_data, session_id, user_agent, ip_address } = body

    console.log("📊 Received data:", {
      hasResponseData: !!response_data,
      sessionId: session_id,
      userAgent: user_agent?.substring(0, 50) + "...",
    })

    if (!response_data) {
      return NextResponse.json({ success: false, error: "Response data is required" }, { status: 400 })
    }

    const normalizedData = {
      session_id: session_id || `session-${Date.now()}`,
      user_agent,
      ip_address,
      role: response_data.role || "other",
      other_role: response_data.other_role || null,
      seniority: response_data.seniority || "mid",
      company_type: response_data.company_type || null,
      company_size: response_data.company_size || "medium",
      industry: response_data.industry || "technology",
      product_type: response_data.product_type || null,
      customer_segment: response_data.customer_segment || null,
      main_challenge: response_data.main_challenge || null,
      daily_tools: response_data.daily_tools || [],
      other_tool: response_data.other_tool || null,
      learning_methods: response_data.learning_methods || [],
      salary_currency: response_data.salary_currency || null,
      salary_min: response_data.salary_min ? Number.parseInt(response_data.salary_min) : null,
      salary_max: response_data.salary_max ? Number.parseInt(response_data.salary_max) : null,
      salary_average: response_data.salary_average ? Number.parseInt(response_data.salary_average) : null,
      email: response_data.email || null,
    }

    // Save to normalized survey_responses table
    const { data, error } = await supabase.from("survey_responses").insert(normalizedData).select().single()

    if (error) {
      console.error("❌ Database insert error:", error)
      return NextResponse.json({ success: false, error: `Database error: ${error.message}` }, { status: 500 })
    }

    console.log("✅ Survey saved successfully:", data?.id)
    return NextResponse.json({
      success: true,
      data,
      message: "Survey response saved successfully",
    })
  } catch (error) {
    console.error("❌ Survey API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient()
    if (!supabase) {
      console.error("❌ Could not create Supabase client")
      return NextResponse.json({ success: false, error: "Database connection failed" }, { status: 503 })
    }

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = (page - 1) * limit

    // Get from normalized survey_responses table
    const { data, error, count } = await supabase
      .from("survey_responses")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("❌ Database fetch error:", error)
      return NextResponse.json({ success: false, error: `Error fetching responses: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        responses: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      },
    })
  } catch (error) {
    console.error("❌ Survey API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
