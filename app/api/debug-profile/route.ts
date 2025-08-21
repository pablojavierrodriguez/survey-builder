import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        {
          error: "Supabase not configured",
        },
        { status: 500 },
      )
    }

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      return NextResponse.json(
        {
          error: "Auth error",
          details: userError.message,
        },
        { status: 401 },
      )
    }

    if (!user) {
      return NextResponse.json(
        {
          error: "No user found",
        },
        { status: 401 },
      )
    }

    console.log("[v0] Debug - Current user:", user.email)

    // Query profiles table for current user
    const { data: profile, error: profileError } = await supabase!
      .from("profiles")
      .select("*")
      .eq("email", user.email)
      .single()

    console.log("[v0] Debug - Profile query result:", { profile, profileError })

    // Also query all profiles to see what's in the table
    const { data: allProfiles, error: allProfilesError } = await supabase!
      .from("profiles")
      .select("email, role, full_name")

    console.log("[v0] Debug - All profiles:", allProfiles)

    return NextResponse.json({
      user: {
        email: user.email,
        id: user.id,
      },
      profile,
      profileError,
      allProfiles,
      allProfilesError,
    })
  } catch (error) {
    console.error("[v0] Debug profile error:", error)
    return NextResponse.json(
      {
        error: "Server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
