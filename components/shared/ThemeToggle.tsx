"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  compact?: boolean;
  label?: boolean;
}

export function ThemeToggle({ className, compact, label }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle theme"
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-secondary",
        compact ? "w-8 h-8" : "h-9 px-3 py-2 text-sm",
        className
      )}
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      {label && <span>{isDark ? "Light" : "Dark"}</span>}
    </button>
  );
}
