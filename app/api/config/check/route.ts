import { type NextRequest, NextResponse } from "next/server"
import { configManager } from "@/lib/config-manager"

export async function GET(request: NextRequest) {
  try {
    // Check if configuration is available
    const configured = await configManager.isConfigured()

    return NextResponse.json({
      success: true,
      configured,
      hasEnvUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasEnvKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      canConnect: configured,
      message: configured ? "Variables de entorno configuradas correctamente" : "Variables de entorno no encontradas",
    })
  } catch (error) {
    console.error("Config check error:", error)
    return NextResponse.json(
      {
        success: false,
        configured: false,
        error: "Error checking configuration",
        message: "Error al verificar la configuración",
      },
      { status: 500 },
    )
  }
}
