"use client";

import { Toaster as SonnerToaster } from "sonner";
import { AlertTriangle, CheckCircle2, Info, Loader2, XCircle } from "lucide-react";

type ToasterProps = React.ComponentProps<typeof SonnerToaster>;

// The app's chrome is hardcoded dark (#0f0404 surfaces, red accent) on every
// route, so the toasts are pinned dark too rather than following next-themes —
// a light toast on this UI reads as a rendering bug.
// sonner ships its own [data-sonner-toast] rules at the same specificity as a
// class, so the structural bits are marked important to land reliably. Border
// widths are set per side rather than via `border` + `border-l-*`, which would
// be two competing declarations resolved only by stylesheet order.
const TOAST_BASE = [
  "group toast",
  "flex items-center gap-3 w-full",
  "rounded-2xl! px-4 py-3",
  "border-t! border-r! border-b! border-l-[3px]!",
  "border-white/10 bg-[#160707]/95! backdrop-blur-xl",
  "shadow-[0_8px_30px_rgba(0,0,0,0.5)]!",
].join(" ");

/**
 * Every toast variant the app uses — success, error, warning, info and
 * loading — rendered in one consistent style: dark glass panel, a coloured
 * left edge and matching lucide icon so the type is readable at a glance
 * without relying on colour alone.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <SonnerToaster
      theme="dark"
      position="top-right"
      closeButton
      visibleToasts={4}
      // Below 600px sonner lays toasts out full-width; this keeps them clear
      // of the mobile top bar.
      mobileOffset={{ top: 12, left: 12, right: 12 }}
      icons={{
        success: <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400" />,
        error: <XCircle className="w-4.5 h-4.5 text-red-400" />,
        warning: <AlertTriangle className="w-4.5 h-4.5 text-amber-400" />,
        info: <Info className="w-4.5 h-4.5 text-sky-400" />,
        // Neutral rather than brand red: a red-edged toast reads as an error
        // at a glance, and red is more useful reserved for actual failures.
        loading: <Loader2 className="w-4.5 h-4.5 text-white/70 animate-spin" />,
      }}
      toastOptions={{
        duration: 4000,
        classNames: {
          toast: TOAST_BASE,
          // sonner applies `default` alongside the per-type class, so both land
          // on the element as competing border-left-color utilities. Without
          // `!` the winner comes down to stylesheet source order rather than
          // the toast's actual type.
          default: "border-l-white/25",
          success: "border-l-emerald-400!",
          error: "border-l-red-400!",
          warning: "border-l-amber-400!",
          info: "border-l-sky-400!",
          loading: "border-l-white/40!",
          content: "flex-1 min-w-0",
          title: "text-[13px] font-semibold leading-snug text-white/90",
          description: "text-[12px] leading-snug mt-0.5 text-white/50",
          icon: "shrink-0 flex items-center justify-center m-0",
          closeButton:
            "bg-[#160707] border-white/15 text-white/50 hover:text-white hover:bg-[#241010] transition-colors",
          actionButton:
            "h-7 shrink-0 rounded-lg bg-red-600 px-3 text-[12px] font-semibold text-white hover:bg-red-500 transition-colors",
          cancelButton:
            "h-7 shrink-0 rounded-lg bg-white/10 px-3 text-[12px] font-medium text-white/70 hover:bg-white/15 transition-colors",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
