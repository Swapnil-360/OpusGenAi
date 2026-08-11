"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clapperboard, ImageUp, Sparkles, X } from "lucide-react";
import { UploadZone } from "@/components/tools/ToolPageShell";
import { ImageToVideoPanel } from "@/components/tools/ImageToVideoPanel";
import { fileToDataUrl } from "@/lib/mask-canvas";
import { VIDEO_TIERS, isPlanAtLeast, type Plan, type VideoQuality } from "@/lib/plans";
import { toast } from "sonner";

const W = {
  bg: "#0f0404",
  card: "#110404",
  text: "rgba(255,255,255,0.88)",
  muted: "rgba(255,255,255,0.45)",
  dim: "rgba(255,255,255,0.26)",
  border: "rgba(255,255,255,0.08)",
  glass: "rgba(255,255,255,0.05)",
  glassDim: "rgba(255,255,255,0.03)",
  red: "#f87171",
  redBg: "rgba(220,38,38,0.12)",
  redBorder: "rgba(220,38,38,0.30)",
};

const QUALITIES: VideoQuality[] = ["standard", "hd", "premium"];
type SourceTab = "upload" | "generate";

export default function ImageToVideoPage() {
  const [tab, setTab] = useState<SourceTab>("upload");
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [sourceImageUrl, setSourceImageUrl] = useState<string | null>(null);

  const [genPrompt, setGenPrompt] = useState("");
  const [genStatus, setGenStatus] = useState<"idle" | "processing">("idle");

  const [userPlan, setUserPlan] = useState<Plan>("free");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((me) => {
        if (me?.plan) setUserPlan(me.plan);
        if (typeof me?.isAdmin === "boolean") setIsAdmin(me.isAdmin);
      })
      .catch(() => {});
  }, []);

  async function handleUpload(file: File, preview: string) {
    setUploadPreview(preview);
    // Sent to /api/generate-video as-is — that route uploads a data: URI to
    // fal storage itself and resolves a real URL before submitting the job.
    const dataUrl = await fileToDataUrl(file);
    setSourceImageUrl(dataUrl);
  }

  function handleRemoveUpload() {
    setUploadPreview(null);
    setSourceImageUrl(null);
  }

  async function generateSourceImage() {
    if (genStatus === "processing") return;
    if (!genPrompt.trim()) { toast.error("Describe what you want to generate."); return; }
    setGenStatus("processing");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: genPrompt.trim(), ratio: "1:1" }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Generation failed. Try again.");
        setGenStatus("idle");
        return;
      }
      const { image, credits } = await res.json();
      setSourceImageUrl(image);
      setGenStatus("idle");
      if (typeof credits === "number") {
        window.dispatchEvent(new CustomEvent("opusgen:credits", { detail: credits }));
      }
      toast.success("Image generated!");
    } catch {
      toast.error("Network error. Check your connection.");
      setGenStatus("idle");
    }
  }

  function changeImage() {
    setSourceImageUrl(null);
    setUploadPreview(null);
    setGenPrompt("");
  }

  const isEntitled = isAdmin || isPlanAtLeast(userPlan, "pro");

  return (
    <div className="h-full overflow-y-auto" style={{ background: W.bg }}>
      <div className="max-w-2xl mx-auto px-5 py-6 flex flex-col gap-5">

        {/* ── Header ── */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: W.redBg, border: `1px solid ${W.redBorder}` }}>
            <Clapperboard className="w-3.5 h-3.5" style={{ color: W.red }} />
          </div>
          <div>
            <h1 className="text-sm font-semibold leading-none" style={{ color: W.text }}>Video Generator</h1>
            <p className="text-[11px] mt-0.5" style={{ color: W.muted }}>Bring your product photos to life with AI motion</p>
          </div>
        </div>

        {/* ── Quality preview strip — shown up front, before any image, so the
            choice is legible before committing to a source image. Hidden once
            a source is picked, since ImageToVideoPanel's own pills below take
            over as the actual (interactive) picker at that point. ── */}
        {!sourceImageUrl && (
          <div className="grid grid-cols-3 gap-2">
            {QUALITIES.map((q) => {
              const tier = VIDEO_TIERS[q];
              return (
                <div key={q} className="rounded-xl p-2.5" style={{ border: `1px solid ${W.border}`, background: W.card }}>
                  <p className="text-[11px] font-bold" style={{ color: W.text }}>{tier.label}</p>
                  <p className="text-[9px] mt-0.5" style={{ color: W.dim }}>{tier.blurb}</p>
                  <p className="text-[10px] font-semibold mt-1.5" style={{ color: W.red }}>{tier.resolution} · {tier.creditCost}cr</p>
                  <p className="text-[9px] mt-0.5" style={{ color: W.dim, opacity: 0.75 }}>
                    {tier.modelLabel}{tier.includesAudio && " · AI audio"}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {!sourceImageUrl ? (
          <div className="rounded-2xl p-5"
            style={{ border: `1px solid ${W.redBorder}`, background: "linear-gradient(180deg, rgba(220,38,38,0.06) 0%, transparent 60%)" }}
          >
            <div className="flex gap-1.5 mb-5 p-1 rounded-xl" style={{ background: W.glassDim, border: `1px solid ${W.border}` }}>
              <button
                onClick={() => setTab("upload")}
                className="flex-1 h-9 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 transition-all"
                style={tab === "upload" ? { background: "#dc2626", color: "white" } : { color: W.muted }}
              >
                <ImageUp className="w-3.5 h-3.5" /> Upload photo
              </button>
              <button
                onClick={() => setTab("generate")}
                className="flex-1 h-9 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 transition-all"
                style={tab === "generate" ? { background: "#dc2626", color: "white" } : { color: W.muted }}
              >
                <Sparkles className="w-3.5 h-3.5" /> Generate image
              </button>
            </div>

            {tab === "upload" ? (
              <UploadZone
                label="Drop your product photo here"
                preview={uploadPreview}
                onUpload={handleUpload}
                onRemove={handleRemoveUpload}
                accentColor="#dc2626"
              />
            ) : (
              <div className="space-y-3">
                <textarea
                  value={genPrompt}
                  onChange={(e) => setGenPrompt(e.target.value)}
                  placeholder="Describe the image to generate — e.g. luxury perfume bottle on black marble…"
                  rows={4}
                  className="w-full rounded-xl text-sm resize-none outline-none px-3 py-2.5"
                  style={{ background: W.glassDim, border: `1px solid ${W.border}`, color: W.text }}
                />
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={generateSourceImage}
                  disabled={genStatus === "processing" || !genPrompt.trim()}
                  className="w-full h-10 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  style={{ background: "#dc2626", boxShadow: "0 0 20px rgba(220,38,38,0.22)" }}
                >
                  {genStatus === "processing" ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Generating…</>
                  ) : (
                    <><Sparkles className="w-4 h-4" />Generate Image · 1 credit</>
                  )}
                </motion.button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden aspect-square w-full max-w-sm mx-auto" style={{ border: `1px solid ${W.border}` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={sourceImageUrl} alt="Source" className="w-full h-full object-cover" />
              <button
                onClick={changeImage}
                className="absolute top-3 right-3 flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold text-white"
                style={{ background: "rgba(0,0,0,0.6)", border: `1px solid ${W.border}` }}
              >
                <X className="w-3.5 h-3.5" /> Change image
              </button>
            </div>

            <ImageToVideoPanel imageUrl={sourceImageUrl} isEntitled={isEntitled} />
          </div>
        )}
      </div>
    </div>
  );
}
