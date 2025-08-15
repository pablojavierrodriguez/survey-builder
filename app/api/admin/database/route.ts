import { type NextRequest, NextResponse } from "next/server"
import { configManager } from "@/lib/config-manager"

export async function GET(request: NextRequest) {
  try {
    // Get configuration from ConfigManager
    const config = await configManager.getConfig()

    if (!config) {
      return NextResponse.json({ success: false, error: "System not configured" }, { status: 404 })
    }

    // Get Supabase client
    const supabase = await configManager.getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ success: false, error: "Could not initialize Supabase client" }, { status: 500 })
    }

    const tableName = config.database?.tableName || "survey_data"

    // Fetch survey responses
    const { data: surveyData, error: surveyError } = await supabase
      .from(tableName)
      .select("*")
      .order("created_at", { ascending: false })

    if (surveyError) {
      console.error("Error fetching survey data:", surveyError)
      // If table doesn't exist or other error, still return success but with empty records
      return NextResponse.json({
        success: true,
        data: {
          url: config.database?.url,
          environment: config.database?.environment,
          tableName: tableName,
          records: [],
          error: `Error fetching data: ${surveyError.message}`,
        },
      })
    }

    const transformedRecords =
      surveyData?.map((record: any) => {
        // Handle both survey_data format (with response_data) and direct format
        if (record.response_data) {
          return {
            id: record.id,
            ...record.response_data,
            created_at: record.created_at,
          }
        }
        return record
      }) || []

    let tables: string[] = []
    try {
      const { data: tablesData, error: tablesError } = await supabase.rpc("get_public_tables")

      if (tablesError) {
        // Fallback: try direct SQL query
        const { data: fallbackTables, error: fallbackError } = await supabase
          .from("pg_tables")
          .select("tablename")
          .eq("schemaname", "public")

        if (!fallbackError && fallbackTables) {
          tables = fallbackTables.map((t: { tablename: string }) => t.tablename)
        } else {
          // If all else fails, return known tables
          tables = ["survey_data", "app_settings", "profiles"]
        }
      } else {
        tables = tablesData || []
      }
    } catch (error) {
      console.error("Error fetching tables:", error)
      // Return known tables as fallback
      tables = ["survey_data", "app_settings", "profiles"]
    }

    return NextResponse.json({
      success: true,
      data: {
        url: config.database?.url,
        environment: config.database?.environment,
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
