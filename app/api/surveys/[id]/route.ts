import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const includeQuestions = searchParams.get("include_questions") === "true"

    let query = supabase.from("surveys").select("*").eq("id", params.id)
    
    const { data: survey, error } = await query.single()

    if (error) {
      console.error("❌ Error fetching survey:", error)
      return NextResponse.json(
        { success: false, error: `Database error: ${error.message}` },
        { status: 500 }
      )
    }

    if (!survey) {
      return NextResponse.json(
        { success: false, error: "Survey not found" },
        { status: 404 }
      )
    }

    // If include_questions is requested, fetch questions
    if (includeQuestions) {
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

    return NextResponse.json({
      success: true,
      data: survey,
    })
  } catch (error) {
    console.error("❌ Survey API error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { name, description, is_active, settings } = body

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (is_active !== undefined) updateData.is_active = is_active
    if (settings !== undefined) updateData.settings = settings

    const { data, error } = await supabase
      .from("surveys")
      .update(updateData)
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      console.error("❌ Error updating survey:", error)
      return NextResponse.json(
        { success: false, error: `Database error: ${error.message}` },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: "Survey not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      message: "Survey updated successfully",
    })
  } catch (error) {
    console.error("❌ Survey API error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { error } = await supabase
      .from("surveys")
      .delete()
      .eq("id", params.id)

    if (error) {
      console.error("❌ Error deleting survey:", error)
      return NextResponse.json(
        { success: false, error: `Database error: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Survey deleted successfully",
    })
  } catch (error) {
    console.error("❌ Survey API error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}