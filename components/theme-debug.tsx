"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeDebug() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="p-2 text-xs bg-yellow-100 dark:bg-yellow-900">Loading theme...</div>;
  }

  return (
    <div className="theme-debug">
      <div>Theme: {theme}</div>
      <div>Resolved: {resolvedTheme}</div>
      <div>Mounted: {mounted ? "Yes" : "No"}</div>
      <div>HTML Class: {typeof document !== "undefined" ? document.documentElement.className : "N/A"}</div>
    </div>
  );
}