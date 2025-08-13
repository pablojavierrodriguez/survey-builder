import { type NextRequest, NextResponse } from "next/server"
import { configManager } from "@/lib/config-manager"

export async function GET(request: NextRequest) {
  try {
    // Test 1: Check if configManager can get Supabase client
    const supabase = await configManager.getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({
        success: false,
        error: "Cannot create Supabase client - check environment variables",
        tests: {
          supabaseClient: false,
          tableExists: false,
          canInsert: false,
          canRead: false,
        },
      })
    }

    const tests = {
      supabaseClient: true,
      tableExists: false,
      canInsert: false,
      canRead: false,
    }

    // Test 2: Check if survey_data table exists
    try {
      const { data, error } = await supabase.from("survey_data").select("count", { count: "exact", head: true })

      if (!error) {
        tests.tableExists = true
      }
    } catch (e) {
      // Table doesn't exist
    }

    // Test 3: Try to insert test data
    if (tests.tableExists) {
      try {
        const { data, error } = await supabase
          .from("survey_data")
          .insert({
            response_data: { test: "connection", timestamp: new Date().toISOString() },
            session_id: `test-${Date.now()}`,
            user_agent: "Test Agent",
          })
          .select()
          .single()

        if (!error && data) {
          tests.canInsert = true

          // Test 4: Try to read the data back
          const { data: readData, error: readError } = await supabase
            .from("survey_data")
            .select("*")
            .eq("id", data.id)
            .single()

          if (!readError && readData) {
            tests.canRead = true

            // Clean up test data
            await supabase.from("survey_data").delete().eq("id", data.id)
          }
        }
      } catch (e) {
        // Insert failed
      }
    }

    return NextResponse.json({
      success: tests.supabaseClient && tests.tableExists && tests.canInsert && tests.canRead,
      tests,
      message:
        tests.supabaseClient && tests.tableExists && tests.canInsert && tests.canRead
          ? "Database is working correctly!"
          : "Database has issues - check the tests above",
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      tests: {
        supabaseClient: false,
        tableExists: false,
        canInsert: false,
        canRead: false,
      },
    })
  }
}
