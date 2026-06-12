"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Frame, Wand2 } from "lucide-react";
import { ToolPageShell, UploadZone, ResultPanel } from "@/components/tools/ToolPageShell";
import { toast } from "sonner";

const TOOL_COLOR = "#ec4899";
const A = {
  bg: "rgba(236,72,153,0.08)",
  border: "rgba(236,72,153,0.5)",
  text: "#f9a8d4",
};
const W = {
  border: "rgba(255,255,255,0.09)",
  glass: "rgba(255,255,255,0.05)",
  glassDim: "rgba(255,255,255,0.03)",
  muted: "rgba(255,255,255,0.45)",
  dim: "rgba(255,255,255,0.28)",
  text: "rgba(255,255,255,0.88)",
};

const RATIO_PRESETS = [
  { id: "1:1", label: "1:1", desc: "Instagram Post" },
  { id: "4:5", label: "4:5", desc: "Portrait Feed" },
  { id: "9:16", label: "9:16", desc: "Stories / Reels" },
  { id: "16:9", label: "16:9", desc: "YouTube / Banner" },
  { id: "4:3", label: "4:3", desc: "LinkedIn / FB" },
  { id: "3:4", label: "3:4", desc: "Portrait" },
] as const;
type Ratio = (typeof RATIO_PRESETS)[number]["id"];

const EXPAND_DIRS = [
  { id: "all", label: "All sides", icon: "⊞" },
  { id: "top-bottom", label: "Top & bottom", icon: "⇕" },
  { id: "left-right", label: "Left & right", icon: "⇔" },
  { id: "top", label: "Top only", icon: "↑" },
  { id: "bottom", label: "Bottom only", icon: "↓" },
] as const;
type ExpandDir = (typeof EXPAND_DIRS)[number]["id"];

export default function UncropPage() {
  const [input, setInput] = useState<string | null>(null);
  const [ratio, setRatio] = useState<Ratio>("1:1");
  const [expandDir, setExpandDir] = useState<ExpandDir>("all");
  const [bgPrompt, setBgPrompt] = useState("");
  const [status, setStatus] = useState<"idle" | "processing" | "completed" | "failed">("idle");
  const [result, setResult] = useState<string | null>(null);

  function process() {
    if (!input) { toast.error("Upload an image first."); return; }
    setStatus("processing");
    setTimeout(() => {
      setResult("https://picsum.photos/seed/product1/512/512");
      setStatus("completed");
      toast.success("Image expanded!");
    }, 2800);
  }

  return (
    <ToolPageShell title="Uncrop / Expand" description="Extend your image to any aspect ratio using AI" creditCost={1} accentColor={TOOL_COLOR}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: W.dim }}>Input Image</p>
          <UploadZone
            label="Drop your product photo here"
            preview={input}
            onUpload={(_, preview) => { setInput(preview); setStatus("idle"); setResult(null); }}
            onRemove={() => { setInput(null); setStatus("idle"); setResult(null); }}
            accentColor={TOOL_COLOR}
          />

          <AnimatePresence>
            {input && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 space-y-4">
                {/* Target ratio */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-2.5" style={{ color: W.dim }}>Target aspect ratio</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {RATIO_PRESETS.map(({ id, label, desc }) => {
                      const isActive = ratio === id;
                      return (
                        <button
                          key={id}
                          onClick={() => setRatio(id)}
                          className="flex flex-col items-center gap-1 py-2.5 rounded-xl transition-all"
                          style={isActive
                            ? { border: `1px solid ${A.border}`, background: A.bg }
                            : { border: `1px solid ${W.border}`, background: W.glassDim }}
                          onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = W.glass; } }}
                          onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = W.glassDim; } }}
                        >
                          <span className="text-xs font-black" style={{ color: isActive ? A.text : W.text }}>{label}</span>
                          <span className="text-[10px]" style={{ color: W.dim }}>{desc}</span>
                          {isActive && <Check className="w-3 h-3" style={{ color: A.text }} />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Expand direction */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-2.5" style={{ color: W.dim }}>Expand direction</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {EXPAND_DIRS.map(({ id, label, icon }) => {
                      const isActive = expandDir === id;
                      return (
                        <button
                          key={id}
                          onClick={() => setExpandDir(id)}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all text-left"
                          style={isActive
                            ? { border: `1px solid ${A.border}`, background: A.bg }
                            : { border: `1px solid ${W.border}`, background: W.glassDim }}
                          onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = W.glass; } }}
                          onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = W.glassDim; } }}
                        >
                          <span className="text-base leading-none">{icon}</span>
                          <span className="text-[11px] font-semibold" style={{ color: isActive ? A.text : W.muted }}>{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Background hint */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <p className="text-xs font-bold uppercase tracking-wider" style={{ color: W.dim }}>Background hint</p>
                    <span className="text-[10px]" style={{ color: W.dim }}>(optional)</span>
                  </div>
                  <input
                    value={bgPrompt}
                    onChange={(e) => setBgPrompt(e.target.value)}
                    placeholder="e.g. blurred white studio, matching gradient…"
                    className="w-full h-10 px-3 rounded-xl text-sm outline-none transition-all"
                    style={{ background: W.glassDim, border: `1px solid ${W.border}`, color: W.text }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = A.border; e.currentTarget.style.boxShadow = `0 0 0 3px ${A.bg}`; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = W.border; e.currentTarget.style.boxShadow = "none"; }}
                  />
                </div>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  className="w-full h-11 rounded-full font-bold text-sm text-white flex items-center justify-center gap-2 transition-all"
                  style={{ background: TOOL_COLOR, boxShadow: "0 0 14px rgba(236,72,153,0.2)" }}
                  disabled={status === "processing"}
                  onClick={process}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 0 24px rgba(236,72,153,0.4)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 0 14px rgba(236,72,153,0.2)"; }}
                >
                  {status === "processing"
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Expanding image…</>
                    : <><Frame className="w-4 h-4" />Expand to {ratio} · 1 credit</>}
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
                <Frame className="w-3 h-3" />{ratio} · {expandDir}
              </span>
            )}
          </div>
          <ResultPanel status={status} result={result} accentColor={TOOL_COLOR} onDownload={() => toast.success("Download started!")} />
        </div>
      </div>

      <div className="mt-8 p-4 rounded-2xl" style={{ border: `1px solid ${W.border}`, background: W.glassDim }}>
        <div className="flex items-center gap-2 mb-2.5">
          <Wand2 className="w-4 h-4" style={{ color: TOOL_COLOR }} />
          <p className="text-sm font-bold" style={{ color: W.text }}>Tips for best results</p>
        </div>
        <ul className="space-y-1">
          {[
            "Works best when the background is simple and consistent.",
            "Adding a hint for the background style produces more accurate fills.",
            "Use \"all sides\" for center-weighted product shots; directional for portraits.",
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
