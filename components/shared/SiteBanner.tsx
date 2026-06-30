"use client";

import { useState, useEffect, useRef } from "react";
import { X, Wrench, Clock, Sparkles, Megaphone } from "lucide-react";
import {
  BANNER_KEY,
  DEFAULT_BANNER,
  type BannerConfig,
  type BannerMode,
} from "@/lib/admin-config";

const BANNER_H = 40; // px — keep in sync with the div height below

const MODES: Record<
  BannerMode,
  { bg: string; border: string; color: string; icon: React.ElementType; defaultText: string } | null
> = {
  normal: null,
  maintenance: {
    bg: "rgba(251,191,36,0.1)",
    border: "rgba(251,191,36,0.25)",
    color: "#fbbf24",
    icon: Wrench,
    defaultText: "Site is temporarily under maintenance. We'll be back shortly.",
  },
  coming_soon: {
    bg: "rgba(96,165,250,0.1)",
    border: "rgba(96,165,250,0.25)",
    color: "#60a5fa",
    icon: Clock,
    defaultText: "An exciting new update is coming soon — stay tuned!",
  },
  new_version: {
    bg: "rgba(167,139,250,0.1)",
    border: "rgba(167,139,250,0.25)",
    color: "#a78bfa",
    icon: Sparkles,
    defaultText: "A new version is live!",
  },
  custom: {
    bg: "rgba(220,38,38,0.1)",
    border: "rgba(220,38,38,0.25)",
    color: "#f87171",
    icon: Megaphone,
    defaultText: "",
  },
};

function setCSSVar(value: number) {
  document.documentElement.style.setProperty("--site-banner-h", `${value}px`);
}

export function SiteBanner() {
  const [config, setConfig] = useState<BannerConfig>(DEFAULT_BANNER);
  const [dismissed, setDismissed] = useState(false);
  const prevKey = useRef("");

  function load() {
    try {
      const raw = localStorage.getItem(BANNER_KEY);
      if (!raw) return;
      const parsed: BannerConfig = JSON.parse(raw);
      // reset dismissed state when config actually changes
      const key = JSON.stringify(parsed);
      if (key !== prevKey.current) {
        prevKey.current = key;
        setDismissed(false);
      }
      setConfig(parsed);
    } catch { /* ignore */ }
  }

  useEffect(() => {
    load();
    // cross-tab updates
    window.addEventListener("storage", load);
    return () => window.removeEventListener("storage", load);
  }, []);

  const style = MODES[config.mode];
  const active = !!style && !dismissed;

  // push the fixed nav down when banner is visible
  useEffect(() => {
    setCSSVar(active ? BANNER_H : 0);
    return () => setCSSVar(0);
  }, [active]);

  if (!active) return null;

  const text =
    config.mode === "new_version"
      ? `${config.versionLabel ? `Version ${config.versionLabel} is live!` : "New version is live!"}${config.message ? `  ${config.message}` : ""}`
      : config.message || style!.defaultText;

  if (!text) return null;

  const Icon = style!.icon;

  return (
    <div
      className="fixed inset-x-0 top-0 flex items-center justify-center gap-3 px-10"
      style={{
        height: BANNER_H,
        zIndex: 60, // above nav z-50
        background: style!.bg,
        borderBottom: `1px solid ${style!.border}`,
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: style!.color }} />
      <span className="text-xs font-medium text-center" style={{ color: style!.color }}>
        {text}
      </span>
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-3 w-8 h-8 flex items-center justify-center rounded-md opacity-50 hover:opacity-100 transition-opacity"
        style={{ color: style!.color }}
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
