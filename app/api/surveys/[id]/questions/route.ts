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

    const { data: questions, error } = await supabase
      .from("survey_questions")
      .select(`
        *,
        survey_options (*)
      `)
      .eq("survey_id", params.id)
      .order("order_index", { ascending: true })

    if (error) {
      console.error("❌ Error fetching questions:", error)
      return NextResponse.json(
        { success: false, error: `Database error: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: questions || [],
    })
  } catch (error) {
    console.error("❌ Questions API error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(
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
    const { 
      question_text, 
      question_type, 
      is_required = true, 
      order_index, 
      validation_rules = {},
      options = []
    } = body

    if (!question_text || !question_type || order_index === undefined) {
      return NextResponse.json(
        { success: false, error: "question_text, question_type, and order_index are required" },
        { status: 400 }
      )
    }

    // Validate question type
    const validTypes = ['single-choice', 'multi-choice', 'text', 'textarea', 'email', 'number', 'date']
    if (!validTypes.includes(question_type)) {
      return NextResponse.json(
        { success: false, error: `Invalid question_type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Insert question
    const { data: question, error: questionError } = await supabase
      .from("survey_questions")
      .insert({
        survey_id: params.id,
        question_text,
        question_type,
        is_required,
        order_index,
        validation_rules,
      })
      .select()
      .single()

    if (questionError) {
      console.error("❌ Error creating question:", questionError)
      return NextResponse.json(
        { success: false, error: `Database error: ${questionError.message}` },
        { status: 500 }
      )
    }

    // Insert options if provided
    if (options.length > 0 && (question_type === 'single-choice' || question_type === 'multi-choice')) {
      const optionsToInsert = options.map((option: any, index: number) => ({
        question_id: question.id,
        option_text: option.text,
        option_value: option.value,
        order_index: index,
        is_other: option.is_other || false,
      }))

      const { error: optionsError } = await supabase
        .from("survey_options")
        .insert(optionsToInsert)

      if (optionsError) {
        console.error("❌ Error creating options:", optionsError)
        // Continue anyway, the question was created successfully
      }
    }

    // Fetch the question with options
    const { data: questionWithOptions, error: fetchError } = await supabase
      .from("survey_questions")
      .select(`
        *,
        survey_options (*)
      `)
      .eq("id", question.id)
      .single()

    if (fetchError) {
      console.error("❌ Error fetching question with options:", fetchError)
    }

    return NextResponse.json({
      success: true,
      data: questionWithOptions || question,
      message: "Question created successfully",
    })
  } catch (error) {
    console.error("❌ Questions API error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}