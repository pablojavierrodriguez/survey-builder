import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/lib/supabase"
import { getUserRoleFromProfile } from "@/lib/permissions"

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .limit(1)
      .maybeSingle()
    const role = getUserRoleFromProfile(profile || null, session.user.email)
    if (role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
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

    // Avoid querying information_schema with RLS; provide a safe static list relevant to app
    const tables: string[] = ["survey_responses", "app_settings", "profiles"]

    return NextResponse.json({
      success: true,
      data: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        environment: process.env.NODE_ENV || "development",
        tableName: tableName,
        tables,
        records: transformedRecords,
      },
    })
  } catch (error) {
    console.error("Database API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .limit(1)
      .maybeSingle()
    const role = getUserRoleFromProfile(profile || null, session.user.email)
    if (role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 })
    }

    const { error } = await supabase.from("survey_responses").delete().eq("id", id)
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
