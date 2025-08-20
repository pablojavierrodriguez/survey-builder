"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function useCustomTheme() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && resolvedTheme) {
      const root = document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.add(resolvedTheme);
    }
  }, [mounted, resolvedTheme]);

  return {
    theme,
    setTheme,
    resolvedTheme,
    mounted,
  };
}