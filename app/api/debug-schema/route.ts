import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.POSTGRES_NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.POSTGRES_NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return Response.json(
        {
          error: "Missing Supabase credentials",
          available_env_vars: {
            NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            POSTGRES_NEXT_PUBLIC_SUPABASE_URL: !!process.env.POSTGRES_NEXT_PUBLIC_SUPABASE_URL,
            NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            POSTGRES_NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.POSTGRES_NEXT_PUBLIC_SUPABASE_ANON_KEY,
          },
        },
        { status: 500 },
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    const [surveyDataResult, appSettingsResult, profilesResult] = await Promise.all([
      supabase.from("survey_data").select("*").limit(1),
      supabase.from("app_settings").select("*").limit(5),
      supabase.from("profiles").select("*").limit(1),
    ])

    return Response.json({
      success: true,
      tables: {
        survey_data: {
          error: surveyDataResult.error?.message,
          count: surveyDataResult.data?.length || 0,
          sample: surveyDataResult.data?.[0] || null,
          structure: surveyDataResult.data?.[0] ? Object.keys(surveyDataResult.data[0]) : [],
        },
        app_settings: {
          error: appSettingsResult.error?.message,
          count: appSettingsResult.data?.length || 0,
          sample: appSettingsResult.data || [],
          structure: appSettingsResult.data?.[0] ? Object.keys(appSettingsResult.data[0]) : [],
        },
        profiles: {
          error: profilesResult.error?.message,
          count: profilesResult.data?.length || 0,
          sample: profilesResult.data?.[0] || null,
          structure: profilesResult.data?.[0] ? Object.keys(profilesResult.data[0]) : [],
        },
      },
      environment: {
        using_postgres_prefix: !process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.POSTGRES_NEXT_PUBLIC_SUPABASE_URL,
      },
    })
  } catch (error) {
    return Response.json(
      {
        error: "Debug failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
