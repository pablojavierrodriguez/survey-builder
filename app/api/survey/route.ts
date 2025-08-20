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

    // Parse and validate request body
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error("❌ Invalid JSON in request body:", parseError)
      return NextResponse.json({ success: false, error: "Invalid JSON in request body" }, { status: 400 })
    }

    const { response_data, session_id, user_agent, ip_address } = body

    console.log("📊 Received data:", {
      hasResponseData: !!response_data,
      sessionId: session_id,
      userAgent: user_agent?.substring(0, 50) + "...",
    })

    // Validate required fields
    if (!response_data) {
      return NextResponse.json({ success: false, error: "Response data is required" }, { status: 400 })
    }

    // Validate required survey fields
    const requiredFields = ['role', 'seniority', 'company_type', 'company_size', 'industry', 'product_type', 'customer_segment', 'main_challenge']
    const missingFields = requiredFields.filter(field => !response_data[field])
    
    if (missingFields.length > 0) {
      console.error("❌ Missing required fields:", missingFields)
      return NextResponse.json({ 
        success: false, 
        error: `Missing required fields: ${missingFields.join(', ')}` 
      }, { status: 400 })
    }

    // Validate arrays
    if (!Array.isArray(response_data.daily_tools)) {
      return NextResponse.json({ success: false, error: "daily_tools must be an array" }, { status: 400 })
    }

    if (!Array.isArray(response_data.learning_methods)) {
      return NextResponse.json({ success: false, error: "learning_methods must be an array" }, { status: 400 })
    }

    // Validate email format if provided
    if (response_data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(response_data.email)) {
      return NextResponse.json({ success: false, error: "Invalid email format" }, { status: 400 })
    }

    // Validate salary values if provided
    const validateSalary = (value: any, fieldName: string) => {
      if (value !== null && value !== undefined && value !== '') {
        const num = Number.parseInt(value)
        if (isNaN(num) || num < 0) {
          throw new Error(`Invalid ${fieldName}: must be a positive number`)
        }
        return num
      }
      return null
    }

    let salary_min, salary_max, salary_average
    try {
      salary_min = validateSalary(response_data.salary_min, 'salary_min')
      salary_max = validateSalary(response_data.salary_max, 'salary_max')
      salary_average = validateSalary(response_data.salary_average, 'salary_average')
    } catch (salaryError: any) {
      return NextResponse.json({ success: false, error: salaryError.message }, { status: 400 })
    }

    // Validate salary range logic
    if (salary_min && salary_max && salary_min > salary_max) {
      return NextResponse.json({ success: false, error: "salary_min cannot be greater than salary_max" }, { status: 400 })
    }

    const normalizedData = {
      session_id: session_id || `session-${Date.now()}`,
      user_agent: user_agent || null,
      ip_address: ip_address || null,
      role: response_data.role,
      other_role: response_data.other_role || null,
      seniority: response_data.seniority,
      company_type: response_data.company_type,
      company_size: response_data.company_size,
      industry: response_data.industry,
      product_type: response_data.product_type,
      customer_segment: response_data.customer_segment,
      main_challenge: response_data.main_challenge,
      daily_tools: response_data.daily_tools,
      other_tool: response_data.other_tool || null,
      learning_methods: response_data.learning_methods,
      salary_currency: response_data.salary_currency || null,
      salary_min,
      salary_max,
      salary_average,
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
