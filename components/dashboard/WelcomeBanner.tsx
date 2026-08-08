"use client";

import { useState, useEffect } from "react";
import { X, Sparkles } from "lucide-react";
import { selectPublic } from "@/lib/supabase/public-rest";
import { DEFAULT_WELCOME, type WelcomeConfig } from "@/lib/admin-config";

export function WelcomeBanner({ name }: { name: string }) {
  const [config, setConfig] = useState<WelcomeConfig | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    selectPublic<{ value: WelcomeConfig }>(
      "site_settings",
      "select=value&id=eq.welcome_message"
    )
      .then((rows) => {
        if (cancelled) return;
        setConfig(rows[0]?.value ?? DEFAULT_WELCOME);
      })
      .catch(() => {
        if (!cancelled) setConfig(DEFAULT_WELCOME);
      });
    return () => { cancelled = true; };
  }, []);

  if (!config || dismissed) return null;

  const firstName = name.split(" ")[0] || name;
  const rawText = config.useDefault ? DEFAULT_WELCOME.message : config.message;
  if (!rawText) return null;
  const text = rawText.replace(/\[Name\]/g, firstName);

  return (
    <div
      className="mx-4 mt-4 sm:mx-6 sm:mt-6 flex items-center gap-3 px-4 py-3 rounded-2xl"
      style={{
        background: "rgba(220,38,38,0.08)",
        border: "1px solid rgba(220,38,38,0.18)",
      }}
    >
      <Sparkles className="w-4 h-4 shrink-0" style={{ color: "#f87171" }} />
      <span className="text-sm font-medium flex-1" style={{ color: "rgba(255,255,255,0.85)" }}>
        {text}
      </span>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="p-1 rounded-lg opacity-50 hover:opacity-100 transition-opacity shrink-0"
        style={{ color: "#f87171" }}
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
