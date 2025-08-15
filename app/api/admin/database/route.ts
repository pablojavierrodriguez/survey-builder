import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured) {
      return NextResponse.json({ success: false, error: "System not configured" }, { status: 503 })
    }

    // Get Supabase client
    const supabase = await getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ success: false, error: "Could not initialize Supabase client" }, { status: 500 })
    }

    const tableName = "survey_responses" // Using new normalized table

    // Fetch survey responses from normalized table
    const { data: surveyData, error: surveyError } = await supabase
      .from(tableName)
      .select("*")
      .order("created_at", { ascending: false })

    if (surveyError) {
      console.error("Error fetching survey data:", surveyError)
      return NextResponse.json({
        success: true,
        data: {
          url: process.env.NEXT_PUBLIC_SUPABASE_URL,
          environment: process.env.NODE_ENV || "development",
          tableName: tableName,
          records: [],
          error: `Error fetching data: ${surveyError.message}`,
        },
      })
    }

    // Data is already normalized, no transformation needed
    const transformedRecords = surveyData || []

    let tables: string[] = []
    try {
      // Try to get table list
      const { data: tablesData, error: tablesError } = await supabase
        .from("information_schema.tables")
        .select("table_name")
        .eq("table_schema", "public")

      if (tablesError) {
        // Fallback to known tables
        tables = ["survey_responses", "app_config", "profiles", "analytics_cache"]
      } else {
        tables = tablesData?.map((t: { table_name: string }) => t.table_name) || []
      }
    } catch (error) {
      console.error("Error fetching tables:", error)
      // Return known tables as fallback
      tables = ["survey_responses", "app_config", "profiles", "analytics_cache"]
    }

    return NextResponse.json({
      success: true,
      data: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        environment: process.env.NODE_ENV || "development",
        tableName: tableName,
        tables: tables,
        records: transformedRecords,
      },
    })
  } catch (error) {
    console.error("Database API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
