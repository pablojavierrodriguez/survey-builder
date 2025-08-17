import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabaseUrl = process.env.POSTGRES_NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.POSTGRES_SUPABASE_SERVICE_ROLE_KEY

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
