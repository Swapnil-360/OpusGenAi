"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Replace, Sparkles, Wand2 } from "lucide-react";
import { ToolPageShell, UploadZone, ResultPanel } from "@/components/tools/ToolPageShell";
import { toast } from "sonner";

const TOOL_COLOR = "#10b981";
const A = {
  bg: "rgba(16,185,129,0.08)",
  border: "rgba(16,185,129,0.5)",
  text: "#6ee7b7",
};
const W = {
  border: "rgba(255,255,255,0.09)",
  glass: "rgba(255,255,255,0.05)",
  glassDim: "rgba(255,255,255,0.03)",
  muted: "rgba(255,255,255,0.45)",
  dim: "rgba(255,255,255,0.28)",
  text: "rgba(255,255,255,0.88)",
};

const PRESET_SCENES = [
  { label: "Marble studio", prompt: "polished white Carrara marble surface, soft diffused studio lighting" },
  { label: "Dark luxury", prompt: "polished black marble with gold accents, dramatic side lighting" },
  { label: "Lifestyle table", prompt: "warm wooden table with morning light and soft bokeh" },
  { label: "Outdoor nature", prompt: "lush green garden with dappled sunlight and soft bokeh" },
  { label: "Flat lay linen", prompt: "warm grey linen surface, overhead flat lay, even diffused light" },
  { label: "Fashion backdrop", prompt: "solid deep charcoal grey, clean fashion editorial backdrop" },
];

export default function ReplaceBgPage() {
  const [input, setInput] = useState<string | null>(null);
  const [bgPrompt, setBgPrompt] = useState("");
  const [status, setStatus] = useState<"idle" | "processing" | "completed" | "failed">("idle");
  const [result, setResult] = useState<string | null>(null);

  function process() {
    if (!input) { toast.error("Upload an image first."); return; }
    if (!bgPrompt.trim()) { toast.error("Describe the new background."); return; }
    setStatus("processing");
    setTimeout(() => {
      setResult("https://picsum.photos/seed/fashion1/512/512");
      setStatus("completed");
      toast.success("Background replaced!");
    }, 2600);
  }

  return (
    <ToolPageShell title="Replace Background" description="Swap any background using a text description" creditCost={2} accentColor={TOOL_COLOR}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: W.dim }}>Product Image</p>
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
                {/* Scene presets */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-2.5" style={{ color: W.dim }}>Quick scenes</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {PRESET_SCENES.map((scene) => {
                      const isActive = bgPrompt === scene.prompt;
                      return (
                        <button
                          key={scene.label}
                          onClick={() => setBgPrompt(scene.prompt)}
                          className="px-3 py-2 rounded-xl text-xs font-medium text-left transition-all"
                          style={isActive
                            ? { border: `1px solid ${A.border}`, background: A.bg, color: A.text }
                            : { border: `1px solid ${W.border}`, background: W.glassDim, color: W.muted }}
                          onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = W.glass; e.currentTarget.style.color = W.text; } }}
                          onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = W.glassDim; e.currentTarget.style.color = W.muted; } }}
                        >
                          {scene.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom prompt */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: W.dim }}>Or describe your own scene</p>
                  <div className="relative">
                    <Sparkles className="absolute left-3 top-3 w-3.5 h-3.5" style={{ color: A.text, opacity: 0.6 }} />
                    <textarea
                      value={bgPrompt}
                      onChange={(e) => setBgPrompt(e.target.value)}
                      placeholder="e.g. sunlit marble countertop with fresh flowers…"
                      rows={3}
                      className="w-full rounded-xl text-sm resize-none outline-none transition-all pl-9 px-3 py-2.5"
                      style={{
                        background: W.glassDim,
                        border: `1px solid ${W.border}`,
                        color: W.text,
                      }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = A.border; e.currentTarget.style.boxShadow = `0 0 0 3px ${A.bg}`; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = W.border; e.currentTarget.style.boxShadow = "none"; }}
                    />
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  className="w-full h-11 rounded-full font-bold text-sm text-white flex items-center justify-center gap-2 transition-all"
                  style={{ background: TOOL_COLOR, boxShadow: "0 0 14px rgba(16,185,129,0.2)", opacity: (!bgPrompt.trim() || status === "processing") ? 0.6 : 1 }}
                  disabled={status === "processing" || !bgPrompt.trim()}
                  onClick={process}
                  onMouseEnter={(e) => { if (bgPrompt.trim()) e.currentTarget.style.boxShadow = "0 0 24px rgba(16,185,129,0.4)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 0 14px rgba(16,185,129,0.2)"; }}
                >
                  {status === "processing"
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Replacing background…</>
                    : <><Replace className="w-4 h-4" />Replace Background · 2 credits</>}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: W.dim }}>Result</p>
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
            "Start with a clean background removal for the best composite.",
            "Be specific with lighting direction in your prompt.",
            "Describe materials (marble, wood) rather than just colors.",
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
