import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured) {
      return NextResponse.json(
        { success: false, error: "System not configured" },
        { status: 503 }
      )
    }

    const supabase = await getSupabaseClient()
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: "Database connection failed" },
        { status: 503 }
      )
    }

    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get("active") === "true"
    const includeQuestions = searchParams.get("include_questions") === "true"

    let query = supabase.from("surveys").select("*")
    
    if (activeOnly) {
      query = query.eq("is_active", true)
    }

    const { data: surveys, error } = await query.order("created_at", { ascending: false })

    if (error) {
      console.error("❌ Error fetching surveys:", error)
      return NextResponse.json(
        { success: false, error: `Database error: ${error.message}` },
        { status: 500 }
      )
    }

    // If include_questions is requested, fetch questions for each survey
    if (includeQuestions && surveys) {
      for (const survey of surveys) {
        const { data: questions, error: questionsError } = await supabase
          .from("survey_questions")
          .select(`
            *,
            survey_options (*)
          `)
          .eq("survey_id", survey.id)
          .order("order_index", { ascending: true })

        if (!questionsError) {
          survey.questions = questions
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: surveys || [],
    })
  } catch (error) {
    console.error("❌ Surveys API error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured) {
      return NextResponse.json(
        { success: false, error: "System not configured" },
        { status: 503 }
      )
    }

    const supabase = await getSupabaseClient()
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: "Database connection failed" },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { name, description, is_active = true, settings = {} } = body

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Survey name is required" },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("surveys")
      .insert({
        name,
        description,
        is_active,
        settings,
      })
      .select()
      .single()

    if (error) {
      console.error("❌ Error creating survey:", error)
      return NextResponse.json(
        { success: false, error: `Database error: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      message: "Survey created successfully",
    })
  } catch (error) {
    console.error("❌ Surveys API error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}