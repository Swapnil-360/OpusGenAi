"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eraser, Info, Wand2 } from "lucide-react";
import { ToolPageShell, UploadZone, ResultPanel } from "@/components/tools/ToolPageShell";
import { toast } from "sonner";

const TOOL_COLOR = "#f59e0b";
const A = {
  bg: "rgba(245,158,11,0.08)",
  border: "rgba(245,158,11,0.5)",
  text: "#fcd34d",
  infoBg: "rgba(245,158,11,0.06)",
  infoBorder: "rgba(245,158,11,0.2)",
};
const W = {
  border: "rgba(255,255,255,0.09)",
  glass: "rgba(255,255,255,0.05)",
  glassDim: "rgba(255,255,255,0.03)",
  muted: "rgba(255,255,255,0.45)",
  dim: "rgba(255,255,255,0.28)",
  text: "rgba(255,255,255,0.88)",
};

const CLEANUP_MODES = [
  { id: "objects", label: "Remove objects", desc: "Erase unwanted items from the scene" },
  { id: "blemishes", label: "Fix blemishes", desc: "Remove dust, scratches, marks" },
  { id: "shadows", label: "Clean shadows", desc: "Reduce harsh or unwanted shadows" },
  { id: "distractions", label: "Remove distractions", desc: "Clean up background clutter" },
] as const;
type CleanupMode = (typeof CLEANUP_MODES)[number]["id"];

export default function CleanupPage() {
  const [input, setInput] = useState<string | null>(null);
  const [mode, setMode] = useState<CleanupMode>("objects");
  const [instructions, setInstructions] = useState("");
  const [strength, setStrength] = useState(80);
  const [status, setStatus] = useState<"idle" | "processing" | "completed" | "failed">("idle");
  const [result, setResult] = useState<string | null>(null);

  function process() {
    if (!input) { toast.error("Upload an image first."); return; }
    setStatus("processing");
    setTimeout(() => {
      setResult("https://picsum.photos/seed/product4/512/512");
      setStatus("completed");
      toast.success("Image cleaned up!");
    }, 2000);
  }

  return (
    <ToolPageShell title="Cleanup" description="Remove objects, blemishes and distractions" creditCost={1} accentColor={TOOL_COLOR}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: W.dim }}>Input Image</p>
          <UploadZone
            label="Drop your image here"
            preview={input}
            onUpload={(_, preview) => { setInput(preview); setStatus("idle"); setResult(null); }}
            onRemove={() => { setInput(null); setStatus("idle"); setResult(null); }}
            accentColor={TOOL_COLOR}
          />

          <AnimatePresence>
            {input && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 space-y-4">
                {/* Cleanup mode */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-2.5" style={{ color: W.dim }}>Cleanup mode</p>
                  <div className="grid grid-cols-2 gap-2">
                    {CLEANUP_MODES.map(({ id, label, desc }) => {
                      const isActive = mode === id;
                      return (
                        <button
                          key={id}
                          onClick={() => setMode(id)}
                          className="flex flex-col items-start gap-1 p-3 rounded-xl transition-all text-left"
                          style={isActive
                            ? { border: `1px solid ${A.border}`, background: A.bg }
                            : { border: `1px solid ${W.border}`, background: W.glassDim }}
                          onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = W.glass; }}
                          onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = W.glassDim; }}
                        >
                          <span className="text-xs font-bold" style={{ color: isActive ? A.text : W.text }}>{label}</span>
                          <span className="text-[10px] leading-snug" style={{ color: W.dim }}>{desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Instructions */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <p className="text-xs font-bold uppercase tracking-wider" style={{ color: W.dim }}>What to remove</p>
                    <span className="text-[10px]" style={{ color: W.dim }}>(optional)</span>
                  </div>
                  <input
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="e.g. the price tag on the bottle, background shadows…"
                    className="w-full h-10 px-3 rounded-xl text-sm outline-none transition-all"
                    style={{ background: W.glassDim, border: `1px solid ${W.border}`, color: W.text }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = A.border; e.currentTarget.style.boxShadow = `0 0 0 3px ${A.bg}`; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = W.border; e.currentTarget.style.boxShadow = "none"; }}
                  />
                </div>

                {/* Strength slider */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold uppercase tracking-wider" style={{ color: W.dim }}>Cleanup strength</p>
                    <span className="text-xs font-mono font-bold" style={{ color: TOOL_COLOR }}>{strength}%</span>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={100}
                    value={strength}
                    onChange={(e) => setStrength(Number(e.target.value))}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                    style={{ accentColor: TOOL_COLOR, background: "rgba(255,255,255,0.08)" }}
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px]" style={{ color: W.dim }}>Subtle</span>
                    <span className="text-[10px]" style={{ color: W.dim }}>Aggressive</span>
                  </div>
                </div>

                {/* Info note */}
                <div className="flex items-start gap-2 p-3 rounded-xl text-xs"
                  style={{ border: `1px solid ${A.infoBorder}`, background: A.infoBg, color: A.text }}>
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <p>For best results, upload the highest resolution version of your image. AI fills removed areas using context from surrounding pixels.</p>
                </div>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  className="w-full h-11 rounded-full font-bold text-sm text-white flex items-center justify-center gap-2 transition-all"
                  style={{ background: TOOL_COLOR, boxShadow: "0 0 14px rgba(245,158,11,0.2)" }}
                  disabled={status === "processing"}
                  onClick={process}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 0 24px rgba(245,158,11,0.4)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 0 14px rgba(245,158,11,0.2)"; }}
                >
                  {status === "processing"
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Cleaning up…</>
                    : <><Eraser className="w-4 h-4" />Clean Image · 1 credit</>}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: W.dim }}>Cleaned Result</p>
          <ResultPanel status={status} result={result} accentColor={TOOL_COLOR} onDownload={() => toast.success("Download started!")} />

          {status === "completed" && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-3 rounded-xl"
              style={{ border: `1px solid ${A.infoBorder}`, background: A.infoBg }}>
              <div className="flex items-center gap-2">
                <Eraser className="w-3.5 h-3.5 shrink-0" style={{ color: A.text }} />
                <p className="text-xs font-semibold" style={{ color: A.text }}>Cleanup complete</p>
              </div>
              <p className="text-[11px] mt-1 ml-5.5" style={{ color: W.dim }}>
                Removed: {mode.replace(/-/g, " ")} {instructions ? `· "${instructions}"` : ""}
              </p>
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
            "Describe what to remove in the instructions field for targeted cleanup.",
            "Use lower strength for subtle touch-ups, higher for complete removal.",
            "Multiple passes on different areas can produce cleaner results.",
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
