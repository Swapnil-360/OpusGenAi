"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Maximize2, Wand2, ZoomIn } from "lucide-react";
import { ToolPageShell, UploadZone, ResultPanel } from "@/components/tools/ToolPageShell";
import { toast } from "sonner";

const TOOL_COLOR = "#ef4444";
const A = {
  bg: "rgba(239,68,68,0.08)",
  border: "rgba(239,68,68,0.5)",
  text: "#fca5a5",
};
const W = {
  border: "rgba(255,255,255,0.09)",
  glass: "rgba(255,255,255,0.05)",
  glassDim: "rgba(255,255,255,0.03)",
  muted: "rgba(255,255,255,0.45)",
  dim: "rgba(255,255,255,0.28)",
  text: "rgba(255,255,255,0.88)",
};

type ScaleOption = "2x" | "4x";
const SCALE_OPTIONS: { id: ScaleOption; label: string; desc: string; badge?: string }[] = [
  { id: "2x", label: "2×", desc: "2048 × 2048 max" },
  { id: "4x", label: "4×", desc: "4096 × 4096 max", badge: "Best" },
];
const ENHANCE_OPTIONS = [
  { id: "face", label: "Face enhancement" },
  { id: "sharpness", label: "AI sharpening" },
  { id: "denoise", label: "Noise reduction" },
  { id: "detail", label: "Micro-detail boost" },
] as const;

export default function UpscalePage() {
  const [input, setInput] = useState<string | null>(null);
  const [scale, setScale] = useState<ScaleOption>("4x");
  const [enhancements, setEnhancements] = useState<Set<string>>(new Set(["sharpness", "denoise"]));
  const [status, setStatus] = useState<"idle" | "processing" | "completed" | "failed">("idle");
  const [result, setResult] = useState<string | null>(null);

  function toggleEnhancement(id: string) {
    setEnhancements((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function process() {
    if (!input) { toast.error("Upload an image first."); return; }
    setStatus("processing");
    setTimeout(() => {
      setResult("https://picsum.photos/seed/bag1/512/512");
      setStatus("completed");
      toast.success(`Upscaled ${scale} successfully!`);
    }, 3000);
  }

  return (
    <ToolPageShell title="Upscale 4×" description="AI-powered resolution enhancement up to 4K" creditCost={2} accentColor={TOOL_COLOR}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: W.dim }}>Input Image</p>
          <UploadZone
            label="Drop your image to upscale"
            preview={input}
            onUpload={(_, preview) => { setInput(preview); setStatus("idle"); setResult(null); }}
            onRemove={() => { setInput(null); setStatus("idle"); setResult(null); }}
            accentColor={TOOL_COLOR}
          />

          <AnimatePresence>
            {input && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 space-y-4">
                {/* Scale factor */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-2.5" style={{ color: W.dim }}>Scale factor</p>
                  <div className="grid grid-cols-2 gap-2">
                    {SCALE_OPTIONS.map(({ id, label, desc, badge }) => {
                      const isActive = scale === id;
                      return (
                        <button
                          key={id}
                          onClick={() => setScale(id)}
                          className="relative flex flex-col items-center py-4 rounded-xl transition-all"
                          style={isActive
                            ? { border: `1px solid ${A.border}`, background: A.bg }
                            : { border: `1px solid ${W.border}`, background: W.glassDim }}
                          onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = W.glass; }}
                          onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = W.glassDim; }}
                        >
                          {badge && (
                            <span className="absolute -top-2 right-2 text-[9px] font-black text-white rounded-full px-1.5 py-0.5"
                              style={{ background: TOOL_COLOR }}>
                              {badge}
                            </span>
                          )}
                          <span className="text-3xl font-black mb-1" style={{ color: isActive ? A.text : W.text }}>{label}</span>
                          <span className="text-[11px]" style={{ color: W.dim }}>{desc}</span>
                          {isActive && <Check className="absolute top-2 left-2 w-3.5 h-3.5" style={{ color: A.text }} />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Enhancement options */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-2.5" style={{ color: W.dim }}>AI enhancements</p>
                  <div className="space-y-2">
                    {ENHANCE_OPTIONS.map(({ id, label }) => {
                      const on = enhancements.has(id);
                      return (
                        <button
                          key={id}
                          onClick={() => toggleEnhancement(id)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
                          style={on
                            ? { border: `1px solid ${A.border}`, background: A.bg }
                            : { border: `1px solid ${W.border}`, background: W.glassDim }}
                          onMouseEnter={(e) => { if (!on) e.currentTarget.style.background = W.glass; }}
                          onMouseLeave={(e) => { if (!on) e.currentTarget.style.background = W.glassDim; }}
                        >
                          <div className="w-4 h-4 rounded-md border-2 flex items-center justify-center transition-all shrink-0"
                            style={on
                              ? { borderColor: TOOL_COLOR, background: TOOL_COLOR }
                              : { borderColor: W.border, background: "transparent" }}>
                            {on && <Check className="w-2.5 h-2.5 text-white" />}
                          </div>
                          <span className="text-xs font-medium" style={{ color: on ? W.text : W.muted }}>{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  className="w-full h-11 rounded-full font-bold text-sm text-white flex items-center justify-center gap-2 transition-all"
                  style={{ background: TOOL_COLOR, boxShadow: "0 0 14px rgba(239,68,68,0.2)" }}
                  disabled={status === "processing"}
                  onClick={process}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 0 24px rgba(239,68,68,0.4)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 0 14px rgba(239,68,68,0.2)"; }}
                >
                  {status === "processing"
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Upscaling {scale}…</>
                    : <><Maximize2 className="w-4 h-4" />Upscale {scale} · 2 credits</>}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: W.dim }}>Result</p>
            {status === "completed" && (
              <span className="flex items-center gap-1 text-[10px] font-bold" style={{ color: A.text }}>
                <ZoomIn className="w-3 h-3" />{scale} upscaled
              </span>
            )}
          </div>
          <ResultPanel status={status} result={result} accentColor={TOOL_COLOR} onDownload={() => toast.success("Download started!")} />

          {status === "completed" && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-4 grid grid-cols-2 gap-2.5">
              {[
                { label: "Output size", value: scale === "4x" ? "4096px" : "2048px" },
                { label: "Enhancement", value: `${enhancements.size} active` },
              ].map(({ label, value }) => (
                <div key={label} className="p-3 rounded-xl text-center"
                  style={{ border: `1px solid ${W.border}`, background: W.glassDim }}>
                  <p className="text-sm font-black" style={{ color: TOOL_COLOR }}>{value}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: W.dim }}>{label}</p>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      <div className="mt-8 p-4 rounded-2xl" style={{ border: `1px solid ${W.border}`, background: W.glassDim }}>
        <div className="flex items-center gap-2 mb-2.5">
          <Wand2 className="w-4 h-4" style={{ color: TOOL_COLOR }} />
          <p className="text-sm font-bold" style={{ color: W.text }}>Tips for best results</p>
        </div>
        <ul className="space-y-1">
          {[
            "For e-commerce, 4× upscale produces print-ready quality (300+ DPI at most sizes).",
            "Enable AI sharpening for product images — it enhances text and fine details.",
            "Noise reduction is recommended for photos taken in low-light conditions.",
          ].map((tip) => (
            <li key={tip} className="text-xs flex gap-2" style={{ color: W.muted }}>
              <span style={{ color: TOOL_COLOR }} className="shrink-0">·</span>{tip}
            </li>
          ))}
        </ul>
      </div>
    </ToolPageShell>
  );
}
