import { NextResponse } from "next/server"
import { configManager } from "@/lib/config-manager"

export async function GET() {
  try {
    console.log("🔍 Starting debug submit test...")

    // Test 1: Check config manager
    const config = await configManager.getConfig()
    
    if (!config) {
      throw new Error("❌ Config not found")
    }
    
    console.log("✅ Config loaded:", {
      hasUrl: !!config.database.url,
      hasKey: !!config.database.apiKey,
    })

    // Test 2: Get Supabase client
    const supabase = await configManager.getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({
        success: false,
        error: "Failed to create Supabase client",
        step: "client_creation",
      })
    }
    console.log("✅ Supabase client created")

    // Test 3: Test database connection
    const { data: testQuery, error: testError } = await supabase.from("survey_data").select("count").limit(1)

    if (testError) {
      return NextResponse.json({
        success: false,
        error: testError.message,
        step: "database_connection",
        details: testError,
      })
    }
    console.log("✅ Database connection works")

    // Test 4: Try to insert test data
    const testPayload = {
      response_data: { test: "debug_test", timestamp: new Date().toISOString() },
      session_id: `debug-${Date.now()}`,
      user_agent: "Debug Test Agent",
      ip_address: null,
    }

    const { data: insertData, error: insertError } = await supabase.from("survey_data").insert([testPayload]).select()

    if (insertError) {
      return NextResponse.json({
        success: false,
        error: insertError.message,
        step: "data_insertion",
        details: insertError,
        payload: testPayload,
      })
    }

    console.log("✅ Test data inserted successfully:", insertData)

    return NextResponse.json({
      success: true,
      message: "All tests passed! Submit should work.",
      tests: {
        config: "✅ Config loaded",
        client: "✅ Supabase client created",
        connection: "✅ Database connection works",
        insertion: "✅ Test data inserted",
      },
      insertedData: insertData,
    })
  } catch (error) {
    console.error("❌ Debug test failed:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      step: "general_error",
    })
  }
}
