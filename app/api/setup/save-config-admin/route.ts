import { NextResponse } from "next/server";
import { configManager, AppConfig } from "@/lib/config-manager";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const updatedConfig: AppConfig = body.config;

    if (!updatedConfig) {
      return NextResponse.json({ success: false, message: "No configuration provided" });
    }

    // Guardar localmente
    const savedTo: string | string[] = await configManager.saveToLocalFile(updatedConfig)
      ? "local file"
      : "not saved";

    // Log seguro
    const targets = Array.isArray(savedTo) ? savedTo : [savedTo];
    console.log(`✅ Configuration saved to: ${targets.join(", ")}`);

    return NextResponse.json({
      success: true,
      savedTo: targets,
    });
  } catch (error) {
    console.error("❌ Error saving configuration:", error);
    return NextResponse.json({
      success: false,
      message: "An unexpected error occurred",
    });
  }
}
