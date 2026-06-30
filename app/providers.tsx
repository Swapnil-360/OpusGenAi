"use client";

import { ThemeProvider } from "next-themes";
import { MotionConfig } from "framer-motion";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
        {children}
        {/* Global aria-live region for toast/status announcements */}
        <div
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
          id="toast-announcer"
        />
      </ThemeProvider>
    </MotionConfig>
  );
}
