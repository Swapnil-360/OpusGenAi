"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Download, X, Zap } from "lucide-react";
import { CreditBadge } from "@/components/shared/CreditBadge";
import { MOCK_CURRENT_USER } from "@/lib/mock-data";

const S = {
  border: "rgba(255,255,255,0.09)",
  glass: "rgba(255,255,255,0.05)",
  glassDim: "rgba(255,255,255,0.03)",
  muted: "rgba(255,255,255,0.45)",
  dim: "rgba(255,255,255,0.28)",
  text: "rgba(255,255,255,0.88)",
};

interface ToolPageShellProps {
  title: string;
  description: string;
  creditCost: number;
  accentColor: string;
  children: React.ReactNode;
}

export function ToolPageShell({ title, description, creditCost, accentColor, children }: ToolPageShellProps) {
  const user = MOCK_CURRENT_USER;
  return (
    <div className="h-full flex flex-col">
      <div className="px-5 py-4 shrink-0" style={{ borderBottom: `1px solid ${S.border}` }}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/generate"
              className="p-1 rounded-lg transition-colors shrink-0"
              style={{ color: S.muted }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = S.text; (e.currentTarget as HTMLElement).style.background = S.glass; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = S.muted; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: accentColor }} />
            <div className="min-w-0">
              <h1 className="font-bold tracking-tight leading-tight" style={{ color: S.text }}>{title}</h1>
              <p className="text-xs truncate hidden sm:block" style={{ color: S.muted }}>{description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 text-xs rounded-full px-2.5 py-1"
              style={{ color: S.muted, border: `1px solid ${S.border}` }}>
              <Zap className="w-3 h-3" style={{ color: accentColor }} />
              {creditCost} credit{creditCost > 1 ? "s" : ""}
            </div>
            <CreditBadge credits={user.credits} compact />
          </div>
        </div>
      </div>

      <motion.div
        className="flex-1 overflow-y-auto"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="max-w-5xl mx-auto p-5 sm:p-6">{children}</div>
      </motion.div>
    </div>
  );
}

interface UploadZoneProps {
  label?: string;
  preview: string | null;
  onUpload: (file: File, preview: string) => void;
  onRemove: () => void;
  accentColor: string;
}

export function UploadZone({ label = "Drop image here", preview, onUpload, onRemove, accentColor }: UploadZoneProps) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    onUpload(file, URL.createObjectURL(file));
  }

  if (preview) {
    return (
      <div className="relative rounded-2xl overflow-hidden aspect-square w-full max-w-sm group"
        style={{ border: `1px solid ${S.border}` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={preview} alt="Input" className="w-full h-full object-cover" />
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.55)" }}>
          <button
            onClick={onRemove}
            className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold text-white transition-all"
            style={{ background: "rgba(220,38,38,0.85)", border: "1px solid rgba(220,38,38,0.5)" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#dc2626"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(220,38,38,0.85)"; }}
          >
            <X className="w-3.5 h-3.5" />Remove
          </button>
        </div>
      </div>
    );
  }

  return (
    <label className="cursor-pointer block">
      <motion.div
        className="border-2 border-dashed rounded-2xl p-8 text-center aspect-square w-full max-w-sm flex flex-col items-center justify-center"
        style={{ borderColor: S.border }}
        whileHover={{ borderColor: accentColor, backgroundColor: `${accentColor}08` }}
        transition={{ duration: 0.2 }}
      >
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: S.glass }}>
          <span className="text-3xl">📷</span>
        </div>
        <p className="text-sm font-semibold mb-1" style={{ color: S.text }}>{label}</p>
        <p className="text-xs" style={{ color: S.muted }}>or click to browse · JPG, PNG, WebP</p>
      </motion.div>
      <input type="file" accept="image/*" className="hidden" onChange={handleChange} />
    </label>
  );
}

interface ResultPanelProps {
  status: "idle" | "processing" | "completed" | "failed";
  result: string | null;
  accentColor: string;
  onDownload: () => void;
}

export function ResultPanel({ status, result, accentColor, onDownload }: ResultPanelProps) {
  if (status === "idle") {
    return (
      <div className="border-2 border-dashed rounded-2xl aspect-square w-full max-w-sm flex flex-col items-center justify-center text-center p-8"
        style={{ borderColor: S.border }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 opacity-30"
          style={{ background: S.glass }}>
          <Zap className="w-6 h-6" style={{ color: S.muted }} />
        </div>
        <p className="text-sm font-medium" style={{ color: S.dim }}>Result will appear here</p>
      </div>
    );
  }

  if (status === "processing") {
    return (
      <div className="rounded-2xl aspect-square w-full max-w-sm flex flex-col items-center justify-center gap-4"
        style={{ border: `1px solid ${S.border}` }}>
        <div
          className="w-12 h-12 rounded-full border-2 animate-spin"
          style={{ borderColor: `${accentColor}30`, borderTopColor: accentColor }}
        />
        <p className="text-sm animate-pulse" style={{ color: S.muted }}>Processing…</p>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="rounded-2xl aspect-square w-full max-w-sm flex flex-col items-center justify-center gap-2 text-center p-6"
        style={{ border: "1px solid rgba(220,38,38,0.3)", background: "rgba(220,38,38,0.05)" }}>
        <p className="text-sm font-semibold" style={{ color: "#f87171" }}>Processing failed</p>
        <p className="text-xs" style={{ color: S.muted }}>Try a different image or try again</p>
      </div>
    );
  }

  return (
    <div
      className="relative rounded-2xl overflow-hidden aspect-square w-full max-w-sm group"
      style={{ border: `1px solid ${accentColor}40` }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={result!} alt="Result" className="w-full h-full object-cover" />
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
        style={{ background: "rgba(0,0,0,0.55)" }}>
        <button
          onClick={onDownload}
          className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold text-white"
          style={{ backgroundColor: accentColor }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.9"; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
        >
          <Download className="w-3.5 h-3.5" />Download
        </button>
      </div>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="absolute top-3 right-3 text-[11px] font-bold px-2.5 py-1 rounded-full text-white"
        style={{ background: "rgba(0,0,0,0.65)", border: "1px solid rgba(255,255,255,0.2)" }}
      >
        ✓ Done
      </motion.div>
    </div>
  );
}
