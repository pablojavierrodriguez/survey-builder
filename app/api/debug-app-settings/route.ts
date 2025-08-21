import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { getSafeEnvironmentConfig } from "@/lib/env"

export async function GET() {
  try {
    const envConfig = getSafeEnvironmentConfig()
    const supabaseUrl = envConfig.supabase.url
    const serviceRoleKey = envConfig.supabase.serviceRoleKey

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({
        error: "Missing Supabase credentials",
        available_vars: Object.keys(process.env).filter((key) => key.includes("SUPABASE")),
      })
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Get app_settings table structure and data
    const { data: settings, error: settingsError } = await supabase.from("app_settings").select("*")

    // Get table schema info
    const { data: columns, error: columnsError } = await supabase
      .rpc("get_table_columns", { table_name: "app_settings" })
      .single()

    return NextResponse.json({
      success: true,
      app_settings_data: settings,
      app_settings_error: settingsError,
      columns_info: columns,
      columns_error: columnsError,
      connection_test: "Connected with service role",
    })
  } catch (error) {
    return NextResponse.json({
      error: "Failed to connect to Supabase",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
