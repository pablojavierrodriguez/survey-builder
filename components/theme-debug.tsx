"use client";

import { useCustomTheme } from "@/lib/use-theme";
import { useSettings } from "@/lib/use-settings";

export function ThemeDebug() {
  const { theme, resolvedTheme, mounted } = useCustomTheme();
  const { settings } = useSettings();

  // Only show if debug mode is enabled
  if (!settings?.general?.debugMode) {
    return null;
  }

  if (!mounted) {
    return (
      <div className="fixed top-4 right-4 z-50 p-2 text-xs bg-yellow-500 text-white rounded border">
        Loading theme...
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-50 p-2 text-xs bg-blue-500 text-white rounded border">
      <div>Theme: {theme}</div>
      <div>Resolved: {resolvedTheme}</div>
      <div>Mounted: {mounted ? "Yes" : "No"}</div>
      <div>HTML Class: {typeof document !== "undefined" ? document.documentElement.className : "N/A"}</div>
    </div>
  );
}