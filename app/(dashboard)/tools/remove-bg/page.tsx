"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Layers, Scissors, Wand2 } from "lucide-react";
import { ToolPageShell, UploadZone, ResultPanel } from "@/components/tools/ToolPageShell";
import { toast } from "sonner";

const TOOL_COLOR = "#3b82f6";
const A = {
  bg: "rgba(59,130,246,0.08)",
  border: "rgba(59,130,246,0.5)",
  text: "#93c5fd",
};
const W = {
  border: "rgba(255,255,255,0.09)",
  glass: "rgba(255,255,255,0.05)",
  glassDim: "rgba(255,255,255,0.03)",
  muted: "rgba(255,255,255,0.45)",
  dim: "rgba(255,255,255,0.28)",
  text: "rgba(255,255,255,0.88)",
};

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

async function compositeOnColor(blob: Blob, color: string): Promise<string> {
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.src = url;
  await new Promise<void>((res) => { img.onload = () => res(); });
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);
  URL.revokeObjectURL(url);
  return canvas.toDataURL("image/png");
}

export default function RemoveBgPage() {
  const [input, setInput] = useState<string | null>(null);
  const [inputFile, setInputFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "processing" | "completed" | "failed">("idle");
  const [result, setResult] = useState<string | null>(null);
  const [outputFormat, setOutputFormat] = useState<"transparent" | "white" | "black">("transparent");

  async function process() {
    if (!inputFile) { toast.error("Upload an image first."); return; }
    setStatus("processing");
    try {
      // Dynamic import keeps WASM out of SSR bundle
      // publicPath must point to CDN so WASM files match the JS wrapper version
      const { removeBackground } = await import("@imgly/background-removal");
      toast.info("AI model loading… (first run ~30s)", { duration: 30000, id: "bg-load" });
      const blob = await removeBackground(inputFile, {
        publicPath: "https://unpkg.com/@imgly/background-removal-data@1.4.5/dist/",
        model: "small",
      });
      toast.dismiss("bg-load");

      let resultUrl: string;
      if (outputFormat === "transparent") {
        resultUrl = await blobToDataUrl(blob);
      } else {
        resultUrl = await compositeOnColor(blob, outputFormat === "white" ? "#ffffff" : "#000000");
      }

      setResult(resultUrl);
      setStatus("completed");
      toast.success("Background removed!");
    } catch (err) {
      console.error("Background removal error:", err);
      toast.dismiss("bg-load");
      toast.error("Failed to remove background. Try a different image.");
      setStatus("failed");
    }
  }

  return (
    <ToolPageShell title="Remove Background" description="Pixel-perfect AI background removal in seconds" creditCost={1} accentColor={TOOL_COLOR}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Input side */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: W.dim }}>Original Image</p>
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
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-2.5" style={{ color: W.dim }}>Output background</p>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { id: "transparent" as const, label: "Transparent" },
                      { id: "white"       as const, label: "White" },
                      { id: "black"       as const, label: "Black" },
                    ]).map(({ id, label }) => {
                      const isActive = outputFormat === id;
                      return (
                        <button
                          key={id}
                          onClick={() => setOutputFormat(id)}
                          aria-label={`Output format: ${label}`}
                          aria-pressed={isActive}
                          className="relative flex flex-col items-center gap-2 p-3 rounded-xl transition-all"
                          style={isActive
                            ? { border: `1px solid ${A.border}`, background: A.bg, color: A.text }
                            : { border: `1px solid ${W.border}`, background: W.glassDim, color: W.muted }}
                          onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = W.glass; }}
                          onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = W.glassDim; }}
                        >
                          <div
                            className="w-10 h-10 rounded-lg"
                            style={{
                              border: `1px solid ${W.border}`,
                              background: id === "transparent"
                                ? "repeating-conic-gradient(rgba(255,255,255,0.06) 0% 25%, transparent 0% 50%) 0 0 / 12px 12px"
                                : id === "white" ? "#f8fafc" : "#0a0a0a",
                            }}
                          />
                          <span className="text-[11px] font-semibold">{label}</span>
                          {isActive && <Check className="absolute top-1.5 right-1.5 w-3 h-3" style={{ color: A.text }} />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full h-10 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                  style={{ background: TOOL_COLOR }}
                  disabled={status === "processing"}
                  onClick={process}
                >
                  {status === "processing"
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Removing background…</>
                    : <><Scissors className="w-4 h-4" />Remove Background · Free (AI)</>}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Result side */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: W.dim }}>Result</p>
            {status === "completed" && (
              <span className="text-[10px] font-bold flex items-center gap-1" style={{ color: A.text }}>
                <Check className="w-3 h-3" />PNG · {outputFormat} background
              </span>
            )}
          </div>
          <ResultPanel status={status} result={result} accentColor={TOOL_COLOR} onDownload={() => {
            if (!result) return;
            const a = document.createElement("a");
            a.href = result;
            a.download = `opusgen-no-bg-${Date.now()}.png`;
            a.click();
            toast.success("Downloading…");
          }} />

          {status === "completed" && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-4 grid grid-cols-2 gap-2.5">
              {[
                { icon: Scissors, label: "Edge precision", sub: "Sub-pixel accuracy" },
                { icon: Layers,   label: "Hair & fur",     sub: "Preserved fine detail" },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="p-3 rounded-xl text-center"
                  style={{ border: `1px solid ${W.border}`, background: W.glassDim }}>
                  <Icon className="w-4 h-4 mx-auto mb-1.5" style={{ color: TOOL_COLOR }} />
                  <p className="text-xs font-bold" style={{ color: W.text }}>{label}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: W.dim }}>{sub}</p>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Tips */}
      <div className="mt-8 p-4 rounded-2xl" style={{ border: `1px solid ${W.border}`, background: W.glassDim }}>
        <div className="flex items-center gap-2 mb-2.5">
          <Wand2 className="w-4 h-4" style={{ color: TOOL_COLOR }} />
          <p className="text-sm font-bold" style={{ color: W.text }}>Tips for best results</p>
        </div>
        <ul className="space-y-1">
          {[
            "First use downloads the AI model from CDN (~30 MB) — subsequent runs are instant.",
            "Use well-lit images with clear subject/background contrast.",
            "Works best with product photos on plain or simple backgrounds.",
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
