"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { ToolPageShell, UploadZone } from "@/components/tools/ToolPageShell";
import { ImageToVideoPanel } from "@/components/tools/ImageToVideoPanel";
import { fileToDataUrl } from "@/lib/mask-canvas";
import { isPlanAtLeast, type Plan } from "@/lib/plans";
import { toast } from "sonner";

const TOOL_COLOR = "#dc2626";
const W = {
  border: "rgba(255,255,255,0.09)",
  glass: "rgba(255,255,255,0.05)",
  glassDim: "rgba(255,255,255,0.03)",
  muted: "rgba(255,255,255,0.45)",
  dim: "rgba(255,255,255,0.28)",
  text: "rgba(255,255,255,0.88)",
};

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

  return (
    <ToolPageShell
      title="Image to Video"
      description="Animate any product photo — upload your own or generate one first"
      creditCost={29}
      accentColor={TOOL_COLOR}
    >
      <div className="max-w-md mx-auto">
        {!sourceImageUrl ? (
          <>
            <div className="flex gap-1.5 mb-5 p-1 rounded-xl" style={{ background: W.glassDim, border: `1px solid ${W.border}` }}>
              <button
                onClick={() => setTab("upload")}
                className="flex-1 h-9 rounded-lg text-sm font-semibold transition-all"
                style={tab === "upload" ? { background: TOOL_COLOR, color: "white" } : { color: W.muted }}
              >
                Upload photo
              </button>
              <button
                onClick={() => setTab("generate")}
                className="flex-1 h-9 rounded-lg text-sm font-semibold transition-all"
                style={tab === "generate" ? { background: TOOL_COLOR, color: "white" } : { color: W.muted }}
              >
                Generate image
              </button>
            </div>

            {tab === "upload" ? (
              <UploadZone
                label="Drop your product photo here"
                preview={uploadPreview}
                onUpload={handleUpload}
                onRemove={handleRemoveUpload}
                accentColor={TOOL_COLOR}
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
                <button
                  onClick={generateSourceImage}
                  disabled={genStatus === "processing" || !genPrompt.trim()}
                  className="w-full h-10 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  style={{ background: TOOL_COLOR }}
                >
                  {genStatus === "processing" ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Generating…</>
                  ) : (
                    "Generate Image · 1 credit"
                  )}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden aspect-square w-full" style={{ border: `1px solid ${W.border}` }}>
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

            <ImageToVideoPanel
              imageUrl={sourceImageUrl}
              isEntitled={isAdmin || isPlanAtLeast(userPlan, "pro")}
            />
          </div>
        )}
      </div>
    </ToolPageShell>
  );
}
