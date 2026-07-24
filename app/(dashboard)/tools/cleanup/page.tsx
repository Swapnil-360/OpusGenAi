"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eraser, Info, RotateCcw, Wand2 } from "lucide-react";
import { ToolPageShell, ResultPanel } from "@/components/tools/ToolPageShell";
import { fileToDataUrl, extractMaskDataUrl, hasMaskPaint } from "@/lib/mask-canvas";
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

function MaskPaintCanvas({
  src,
  brushSize,
  canvasRef,
}: {
  src: string;
  brushSize: number;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}) {
  const drawingRef = useRef(false);

  useEffect(() => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
    };
    img.src = src;
  }, [src, canvasRef]);

  function getPos(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  function paint(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const { x, y } = getPos(e);
    ctx.fillStyle = "rgba(239,68,68,0.55)";
    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  return (
    <div className="relative rounded-2xl overflow-hidden w-full max-w-sm" style={{ border: `1px solid ${W.border}` }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="Input" className="w-full block select-none pointer-events-none" draggable={false} />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); drawingRef.current = true; paint(e); }}
        onPointerMove={paint}
        onPointerUp={() => { drawingRef.current = false; }}
        onPointerLeave={() => { drawingRef.current = false; }}
      />
    </div>
  );
}

export default function CleanupPage() {
  const [input, setInput] = useState<string | null>(null);
  const [instructions, setInstructions] = useState("");
  const [brushSize, setBrushSize] = useState(40);
  const [status, setStatus] = useState<"idle" | "processing" | "completed" | "failed">("idle");
  const [result, setResult] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function applyFile(file: File) {
    setInput(URL.createObjectURL(file));
    setStatus("idle");
    setResult(null);
  }

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) applyFile(file);
  }

  function handleDrop(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) applyFile(file);
  }

  function clearMask() {
    const canvas = maskCanvasRef.current;
    if (canvas) canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
  }

  async function process() {
    if (status === "processing") return;
    if (!input) { toast.error("Upload an image first."); return; }
    const canvas = maskCanvasRef.current;
    if (!canvas || !hasMaskPaint(canvas)) {
      toast.error("Paint over what you want removed first.");
      return;
    }
    setStatus("processing");

    try {
      const imageRes = await fetch(input);
      const imageBlob = await imageRes.blob();
      const imageDataUrl = await fileToDataUrl(new File([imageBlob], "input.png", { type: imageBlob.type }));
      const maskDataUrl = extractMaskDataUrl(canvas);

      const res = await fetch("/api/cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageDataUrl, mask: maskDataUrl, instructions: instructions.trim() }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Cleanup failed. Try again.");
        setStatus("failed");
        return;
      }

      const { image: outputImage, credits } = await res.json();
      setResult(outputImage);
      setStatus("completed");
      toast.success("Image cleaned up!");
      if (typeof credits === "number") {
        window.dispatchEvent(new CustomEvent("opusgen:credits", { detail: credits }));
      }
    } catch (err) {
      console.error("Cleanup error:", err);
      toast.error("Network error. Check your connection.");
      setStatus("failed");
    }
  }

  async function handleDownload() {
    if (!result) return;
    const res = await fetch(result);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `opusgen-cleanup-${Date.now()}.png`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloading…");
  }

  return (
    <ToolPageShell title="Cleanup" description="Paint over objects, blemishes and distractions to remove them" creditCost={1} accentColor={TOOL_COLOR}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: W.dim }}>Paint over what to remove</p>

          {!input ? (
            <label
              className="border-2 border-dashed rounded-2xl p-8 text-center aspect-square w-full max-w-sm flex flex-col items-center justify-center cursor-pointer transition-all"
              style={isDragging
                ? { borderColor: A.border, background: A.bg, transform: "scale(1.02)" }
                : { borderColor: W.border, background: "transparent" }}
              onMouseEnter={(e) => { if (!isDragging) { e.currentTarget.style.borderColor = A.border; e.currentTarget.style.background = A.bg; } }}
              onMouseLeave={(e) => { if (!isDragging) { e.currentTarget.style.borderColor = W.border; e.currentTarget.style.background = "transparent"; } }}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
              onDrop={handleDrop}
            >
              <Eraser className="w-7 h-7 mb-3" style={{ color: isDragging ? TOOL_COLOR : W.muted }} />
              <p className="text-sm font-semibold mb-1" style={{ color: W.text }}>{isDragging ? "Drop it here" : "Drop your image here"}</p>
              <p className="text-xs" style={{ color: W.muted }}>or click to browse · JPG, PNG, WebP</p>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            </label>
          ) : (
            <MaskPaintCanvas src={input} brushSize={brushSize} canvasRef={maskCanvasRef} />
          )}

          <AnimatePresence>
            {input && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 space-y-4">
                {/* Brush size */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold uppercase tracking-wider" style={{ color: W.dim }}>Brush size</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold" style={{ color: TOOL_COLOR }}>{brushSize}px</span>
                      <button
                        onClick={clearMask}
                        className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-md transition-all"
                        style={{ color: W.muted }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = W.text; e.currentTarget.style.background = W.glass; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = W.muted; e.currentTarget.style.background = "transparent"; }}
                      >
                        <RotateCcw className="w-3 h-3" /> Clear paint
                      </button>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={15}
                    max={100}
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    aria-label="Brush size"
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                    style={{ accentColor: TOOL_COLOR, background: "rgba(255,255,255,0.08)" }}
                  />
                </div>

                {/* Instructions */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <p className="text-xs font-bold uppercase tracking-wider" style={{ color: W.dim }}>What is it</p>
                    <span className="text-[10px]" style={{ color: W.dim }}>(optional, helps accuracy)</span>
                  </div>
                  <input
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="e.g. the price tag on the bottle"
                    className="w-full h-10 px-3 rounded-xl text-sm outline-none transition-all"
                    style={{ background: W.glassDim, border: `1px solid ${W.border}`, color: W.text }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = A.border; e.currentTarget.style.boxShadow = `0 0 0 3px ${A.bg}`; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = W.border; e.currentTarget.style.boxShadow = "none"; }}
                  />
                </div>

                <div className="flex items-start gap-2 p-3 rounded-xl text-xs"
                  style={{ border: `1px solid ${A.infoBorder}`, background: A.infoBg, color: A.text }}>
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <p>Paint red over the object to remove. AI fills the area using context from surrounding pixels.</p>
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
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Cleaning up…</>
                    : <><Eraser className="w-4 h-4" />Clean Image · 1 credit</>}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: W.dim }}>Cleaned Result</p>
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
            "Paint slightly beyond the object's edges for a cleaner fill.",
            "Describe what it is in the text field for more accurate results.",
            "Works best on simple, consistent backgrounds.",
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
