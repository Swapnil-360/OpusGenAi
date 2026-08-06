"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Replace, Sparkles, Wand2 } from "lucide-react";
import { ToolPageShell, UploadZone, ResultPanel } from "@/components/tools/ToolPageShell";
import { compositeProductOntoBackground } from "@/lib/image-composite";
import { createClient } from "@/lib/supabase/client";
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
  const [inputFile, setInputFile] = useState<File | null>(null);
  const [bgPrompt, setBgPrompt] = useState("");
  const [status, setStatus] = useState<"idle" | "processing" | "completed" | "failed">("idle");
  const [result, setResult] = useState<string | null>(null);

  async function process() {
    if (status === "processing") return;
    if (!inputFile) { toast.error("Upload an image first."); return; }
    if (!bgPrompt.trim()) { toast.error("Describe the new background."); return; }
    setStatus("processing");

    try {
      toast.loading("Keeping your product untouched — generating background…", { id: "replace-bg-progress", duration: 60000 });

      const [{ removeBackground }, bgRes] = await Promise.all([
        import("@imgly/background-removal"),
        fetch("/api/replace-bg", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: bgPrompt.trim(), ratio: "1:1" }),
        }),
      ]);

      if (!bgRes.ok) {
        const err = await bgRes.json().catch(() => ({}));
        toast.dismiss("replace-bg-progress");
        toast.error(err.error || "Background generation failed. Try again.");
        setStatus("failed");
        return;
      }

      const { image: backgroundImage, credits, generationId } = await bgRes.json();

      const productCutout = await removeBackground(inputFile, {
        publicPath: "https://unpkg.com/@imgly/background-removal-data@1.4.5/dist/",
        model: "medium",
      });

      const finalImage = await compositeProductOntoBackground(productCutout, backgroundImage);
      toast.dismiss("replace-bg-progress");

      setResult(finalImage);
      setStatus("completed");
      toast.success("Background replaced!");

      if (typeof credits === "number") {
        window.dispatchEvent(new CustomEvent("opusgen:credits", { detail: credits }));
      }

      if (generationId) {
        try {
          const supabase = createClient();
          await supabase
            .from("generations")
            .update({ metadata: { images: [finalImage], aspectRatio: "1:1", productPreserved: true } })
            .eq("id", generationId);
        } catch (err) {
          console.error("Failed to save final composited image:", err);
        }
      }
    } catch (err) {
      console.error("Replace-bg error:", err);
      toast.dismiss("replace-bg-progress");
      toast.error("Network error. Check your connection.");
      setStatus("failed");
    }
  }

  async function handleDownload() {
    if (!result) return;
    const a = document.createElement("a");
    a.href = result;
    a.download = `opusgen-replace-bg-${Date.now()}.png`;
    a.click();
    toast.success("Downloading…");
  }

  return (
    <ToolPageShell title="Replace Background" description="Swap any background using a text description" creditCost={2} accentColor={TOOL_COLOR}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: W.dim }}>Product Image</p>
          <UploadZone
            label="Drop your product photo here"
            preview={input}
            onUpload={(file, preview) => { setInputFile(file); setInput(preview); setStatus("idle"); setResult(null); }}
            onRemove={() => { setInputFile(null); setInput(null); setStatus("idle"); setResult(null); }}
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
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full h-10 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
                  style={{ background: TOOL_COLOR }}
                  disabled={status === "processing" || !bgPrompt.trim()}
                  onClick={process}
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
          <ResultPanel status={status} result={result} accentColor={TOOL_COLOR} onDownload={handleDownload} />
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
