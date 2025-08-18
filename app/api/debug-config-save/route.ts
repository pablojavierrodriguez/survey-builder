import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Debug: Starting config save test")

    // Test 1: Verificar conexión básica
    const { data: testData, error: testError } = await supabase.from("app_settings").select("*").limit(1)

    console.log("[v0] Debug: Basic connection test", { testData, testError })

    if (testError) {
      return NextResponse.json({
        success: false,
        error: "Connection failed",
        details: testError,
      })
    }

    // Test 2: Intentar upsert de prueba
    const testConfig = {
      key: "debug_test",
      value: { test: true, timestamp: new Date().toISOString() },
    }

    const { data: upsertData, error: upsertError } = await supabase
      .from("app_settings")
      .upsert(testConfig, { onConflict: "key" })
      .select()

    console.log("[v0] Debug: Upsert test", { upsertData, upsertError })

    return NextResponse.json({
      success: true,
      connectionTest: { testData, testError },
      upsertTest: { upsertData, upsertError },
    })
  } catch (error) {
    console.error("[v0] Debug: Unexpected error", error)
    return NextResponse.json({
      success: false,
      error: "Unexpected error",
      details: error instanceof Error ? error.message : String(error),
    })
  }
}
