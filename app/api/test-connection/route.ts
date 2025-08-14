import { NextResponse } from "next/server"
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase"

export async function GET() {
  try {
    console.log("🔍 Testing Supabase connection...")

    if (!isSupabaseConfigured) {
      return NextResponse.json(
        {
          success: false,
          error: "Supabase not configured",
          details: "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
        },
        { status: 503 },
      )
    }

    const supabase = await getSupabaseClient()
    if (!supabase) {
      return NextResponse.json(
        {
          success: false,
          error: "Could not create Supabase client",
        },
        { status: 503 },
      )
    }

    // Test 1: Check if survey_data table exists
    const { data: tableData, error: tableError } = await supabase
      .from("survey_data")
      .select("count", { count: "exact", head: true })

    if (tableError) {
      return NextResponse.json(
        {
          success: false,
          error: "Table access failed",
          details: tableError.message,
          suggestion: "Run the INITIALIZATION.sql script in Supabase SQL Editor",
        },
        { status: 500 },
      )
    }

    // Test 2: Try to insert test data
    const testData = {
      response_data: { test: true, timestamp: new Date().toISOString() },
      session_id: `test-${Date.now()}`,
      user_agent: "Test Agent",
      ip_address: null,
    }

    const { data: insertData, error: insertError } = await supabase
      .from("survey_data")
      .insert(testData)
      .select()
      .single()

    if (insertError) {
      return NextResponse.json(
        {
          success: false,
          error: "Insert test failed",
          details: insertError.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Supabase connection working correctly",
      data: {
        tableExists: true,
        recordCount: tableData,
        testInsert: insertData,
      },
    })
  } catch (error) {
    console.error("Connection test error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Connection test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
