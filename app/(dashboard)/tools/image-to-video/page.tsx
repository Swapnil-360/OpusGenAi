"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clapperboard,
  ImageUp,
  Sparkles,
  Film,
  Wand2,
  Info,
  ChevronDown,
} from "lucide-react";
import { UploadZone } from "@/components/tools/ToolPageShell";
import { ImageToVideoPanel } from "@/components/tools/ImageToVideoPanel";
import { VideoTemplatePicker } from "@/components/tools/VideoTemplatePicker";
import { fileToUploadDataUrl } from "@/lib/mask-canvas";
import { readApiError } from "@/lib/api-error";
import { useTemplates } from "@/lib/hooks/use-templates";
import { VIDEO_TIERS, type VideoQuality } from "@/lib/plans";
import type { Template } from "@/lib/templates-data";
import { useMe } from "@/lib/hooks/use-me";
import { toast } from "sonner";

const W = {
  bg: "#0f0404",
  card: "#110404",
  text: "rgba(255,255,255,0.92)",
  muted: "rgba(255,255,255,0.68)",
  dim: "rgba(255,255,255,0.58)",
  border: "rgba(255,255,255,0.08)",
  glass: "rgba(255,255,255,0.05)",
  glassDim: "rgba(255,255,255,0.03)",
  red: "#f87171",
  redBg: "rgba(220,38,38,0.12)",
  redBorder: "rgba(220,38,38,0.30)",
};

const QUALITIES: VideoQuality[] = ["standard", "hd", "premium"];
type SourceTab = "upload" | "generate";

// useSearchParams needs a Suspense boundary under the App Router — same
// pattern the generate page uses for its own ?template= deep link.
export default function ImageToVideoPage() {
  return (
    <Suspense
      fallback={<div className="h-full" style={{ background: W.bg }} />}
    >
      <ImageToVideoPageInner />
    </Suspense>
  );
}

function ImageToVideoPageInner() {
  const searchParams = useSearchParams();
  const { templates } = useTemplates({ authenticated: true });
  const templateId = searchParams.get("template");

  const [selectedTemplate, setSelectedTemplate] = useState<
    Template | null | undefined
  >(undefined);
  const [pickerModalOpen, setPickerModalOpen] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  const videoTemplates = useMemo(() => {
    return templates.filter((t) => t.templateType === "video");
  }, [templates]);

  useEffect(() => {
    if (templateId && templates.length > 0) {
      const match = templates.find((t) => t.id === templateId);
      if (match) setSelectedTemplate(match);
    } else if (!templateId && selectedTemplate === undefined) {
      setSelectedTemplate(null);
    }
  }, [templateId, templates, selectedTemplate]);

  const effectiveTemplate = selectedTemplate ?? null;

  const [tab, setTab] = useState<SourceTab>("upload");
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [sourceImageUrl, setSourceImageUrl] = useState<string | null>(null);

  const [genPrompt, setGenPrompt] = useState("");
  const [genStatus, setGenStatus] = useState<"idle" | "processing">("idle");

  // Shared cache (lib/hooks/use-me.ts) — instant on navigation instead of
  // this page paying its own /api/me round trip every time it's visited.
  const { me } = useMe();
  const userPlan = me?.plan ?? "free";
  const isAdmin = me?.isAdmin ?? false;
  const standardVideosUsed = me?.standardVideosUsed ?? 0;
  // The panel tracks its own generation, but "Change image" here would
  // unmount it — orphaning a paid, still-running job with no way to cancel
  // it from this page. Disabled while true; the panel's own Cancel button is
  // the intended way to stop a generation, not swapping the source image.
  const [isVideoProcessing, setIsVideoProcessing] = useState(false);

  useEffect(() => {
    if (!isVideoProcessing) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isVideoProcessing]);

  async function handleUpload(file: File, preview: string) {
    setUploadPreview(preview);
    // Sent to /api/generate-video as-is — that route uploads a data: URI to
    // fal storage itself and resolves a real URL before submitting the job.
    const dataUrl = await fileToUploadDataUrl(file);
    setSourceImageUrl(dataUrl);
  }

  function handleRemoveUpload() {
    setUploadPreview(null);
    setSourceImageUrl(null);
  }

  async function generateSourceImage() {
    if (genStatus === "processing") return;
    if (!genPrompt.trim()) {
      toast.error("Describe what you want to generate.");
      return;
    }
    setGenStatus("processing");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: genPrompt.trim(), ratio: "1:1" }),
      });
      if (!res.ok) {
        toast.error(await readApiError(res, "Generation failed. Try again."));
        setGenStatus("idle");
        return;
      }
      const { image, credits } = await res.json();
      setSourceImageUrl(image);
      setGenStatus("idle");
      if (typeof credits === "number") {
        window.dispatchEvent(
          new CustomEvent("opusgen:credits", { detail: credits }),
        );
      }
      toast.success("Image generated!");
    } catch {
      toast.error("Network error. Check your connection.");
      setGenStatus("idle");
    }
  }

  function changeImage() {
    if (isVideoProcessing) {
      toast.error(
        "A video is still generating — cancel it below first, or wait for it to finish.",
      );
      return;
    }
    setSourceImageUrl(null);
    setUploadPreview(null);
    setGenPrompt("");
  }

  return (
    <div className="h-full overflow-y-auto" style={{ background: W.bg }}>
      <div className="max-w-2xl mx-auto px-5 py-6 flex flex-col gap-5">
        {/* ── Header ── */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: W.redBg, border: `1px solid ${W.redBorder}` }}
          >
            <Clapperboard className="w-3.5 h-3.5" style={{ color: W.red }} />
          </div>
          <div>
            <h1
              className="text-sm font-semibold leading-none"
              style={{ color: W.text }}
            >
              Video Generator
            </h1>
            <p
              className="text-xs mt-0.5 leading-normal"
              style={{ color: W.muted }}
            >
              Bring your product photos to life with AI motion
            </p>
          </div>
        </div>

        {/* ── Guidance & Best Practices Banner ── */}
        <div
          className={`rounded-2xl border border-red-500/20 transition-all ${
            showHowItWorks ? "p-3.5 sm:p-4" : "py-2 px-3 sm:py-2.5 sm:px-3.5"
          }`}
          style={{
            background:
              "linear-gradient(135deg, rgba(220,38,38,0.1) 0%, rgba(15,4,4,0.85) 100%)",
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setShowHowItWorks((v) => !v)}
              className="flex items-center gap-2 text-left cursor-pointer hover:opacity-90 transition-opacity min-w-0"
            >
              <Sparkles className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <h2 className="text-xs font-bold text-white uppercase tracking-wider truncate">
                Video Generation Guide & Best Practices
              </h2>
            </button>
            <button
              type="button"
              onClick={() => setShowHowItWorks((v) => !v)}
              className="flex items-center gap-1 text-[11px] font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer shrink-0"
            >
              <span>{showHowItWorks ? "Hide guide" : "Show guide"}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  showHowItWorks ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>

          {showHowItWorks && (
            <div className="space-y-2.5 mt-2.5 pt-2.5 border-t border-white/10 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="rounded-xl p-2.5 bg-black/40 border border-white/5 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-red-300">
                    <span className="w-4 h-4 rounded-full bg-red-600/30 text-red-400 flex items-center justify-center text-[10px] font-bold">
                      1
                    </span>
                    Choose Direction Mode
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Select a <strong>Commercial Template</strong> for proven ad
                    motion, or choose <strong>Custom Mode</strong> to direct
                    your own style & camera angles.
                  </p>
                </div>

                <div className="rounded-xl p-2.5 bg-black/40 border border-amber-500/25 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-amber-300">
                    <span className="w-4 h-4 rounded-full bg-amber-500/30 text-amber-400 flex items-center justify-center text-[10px] font-bold">
                      2
                    </span>
                    Read Description Carefully
                  </div>
                  <p className="text-[11px] text-zinc-300 leading-relaxed">
                    <strong>Critical:</strong> Always read the template
                    description before generating to confirm your product photo
                    matches what the template is designed to animate.
                  </p>
                </div>

                <div className="rounded-xl p-2.5 bg-black/40 border border-white/5 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-red-300">
                    <span className="w-4 h-4 rounded-full bg-red-600/30 text-red-400 flex items-center justify-center text-[10px] font-bold">
                      3
                    </span>
                    Upload Clear Photo
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Upload a high-resolution, well-lit image centered on your
                    product. Clean backgrounds produce the smoothest video
                    motion.
                  </p>
                </div>

                <div className="rounded-xl p-2.5 bg-black/40 border border-white/5 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-red-300">
                    <span className="w-4 h-4 rounded-full bg-red-600/30 text-red-400 flex items-center justify-center text-[10px] font-bold">
                      4
                    </span>
                    Automatic vs Custom Controls
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    When using a template, style and camera motion are locked
                    automatically. For custom mode, choose your own style and
                    camera movement.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Mode & Template Selector (Visible before photo upload) ── */}
        {!sourceImageUrl && (
          <div
            className="rounded-2xl p-4 border border-white/10 space-y-3"
            style={{ background: W.card }}
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold text-white">Motion Preset</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Choose a high-converting template or switch to custom prompt
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPickerModalOpen(true)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    effectiveTemplate
                      ? "bg-red-600 text-white shadow-md shadow-red-600/30"
                      : "bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10"
                  }`}
                >
                  <Film className="w-3.5 h-3.5" />
                  {effectiveTemplate ? "Change Template" : "Choose Template"}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTemplate(null)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    !effectiveTemplate
                      ? "bg-red-600 text-white shadow-md shadow-red-600/30"
                      : "bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10"
                  }`}
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  Custom Prompt
                </button>
              </div>
            </div>

            {effectiveTemplate ? (
              <div className="rounded-xl p-3 bg-red-950/20 border border-red-500/20 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Film className="w-4 h-4 text-red-400 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-white">
                        {effectiveTemplate.name}
                      </p>
                      <p className="text-[10px] text-zinc-400">
                        {effectiveTemplate.category} ·{" "}
                        {effectiveTemplate.durationOption === "5s"
                          ? "5s only"
                          : effectiveTemplate.durationOption === "10s"
                          ? "10s only"
                          : "5s or 10s"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedTemplate(null)}
                    className="text-[10px] text-zinc-400 hover:text-zinc-200 cursor-pointer"
                  >
                    Clear (Custom)
                  </button>
                </div>

                <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 space-y-1">
                  <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                    <Info className="w-3 h-3" /> Read Description Before Generating
                  </p>
                  <p className="text-xs text-zinc-300 leading-relaxed font-normal">
                    {effectiveTemplate.description}
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl p-3 bg-white/[0.02] border border-white/5 flex items-start gap-2.5">
                <Wand2 className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                <div className="text-xs text-zinc-400 leading-relaxed">
                  <p className="font-semibold text-zinc-200">
                    Custom Prompt Mode Active
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Upload or generate a photo below to customize style mood,
                    camera movement, and write your own video prompt.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Quality preview strip — shown up front, before any image, so the
            choice is legible before committing to a source image. Hidden once
            a source is picked, since ImageToVideoPanel's own pills below take
            over as the actual (interactive) picker at that point. ── */}
        {!sourceImageUrl && (
          <div className="grid grid-cols-3 gap-2">
            {QUALITIES.map((q) => {
              const tier = VIDEO_TIERS[q];
              return (
                <div
                  key={q}
                  className="rounded-xl p-2.5"
                  style={{
                    border: `1px solid ${W.border}`,
                    background: W.card,
                  }}
                >
                  <p className="text-xs font-bold" style={{ color: W.text }}>
                    {tier.label}
                  </p>
                  <p
                    className="text-[11px] mt-0.5 leading-snug"
                    style={{ color: W.dim }}
                  >
                    {tier.blurb}
                  </p>
                  <p
                    className="text-xs font-semibold mt-1.5"
                    style={{ color: W.red }}
                  >
                    {tier.resolution} · {tier.creditCost} credits
                  </p>
                  <p
                    className="text-[11px] mt-0.5 leading-snug"
                    style={{ color: W.dim }}
                  >
                    {tier.modelLabel}
                    {tier.includesAudio && " · AI audio"}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {!sourceImageUrl ? (
          <div
            className="rounded-2xl p-4"
            style={{
              border: `1px solid ${W.redBorder}`,
              background: "#150606",
              backgroundImage:
                "linear-gradient(180deg, rgba(220,38,38,0.06) 0%, transparent 60%)",
            }}
          >
            <div
              className="flex gap-1.5 mb-4 p-1 rounded-xl"
              style={{
                background: W.glassDim,
                border: `1px solid ${W.border}`,
              }}
            >
              <button
                onClick={() => setTab("upload")}
                className="flex-1 h-9 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 transition-all"
                style={
                  tab === "upload"
                    ? { background: "#dc2626", color: "white" }
                    : { color: W.muted }
                }
              >
                <ImageUp className="w-3.5 h-3.5" /> Upload photo
              </button>
              <button
                onClick={() => setTab("generate")}
                className="flex-1 h-9 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 transition-all"
                style={
                  tab === "generate"
                    ? { background: "#dc2626", color: "white" }
                    : { color: W.muted }
                }
              >
                <Sparkles className="w-3.5 h-3.5" /> Generate image
              </button>
            </div>

            {tab === "upload" ? (
              <UploadZone
                label="Drop your product photo"
                preview={uploadPreview}
                onUpload={handleUpload}
                onRemove={handleRemoveUpload}
                accentColor="#dc2626"
                size="compact"
              />
            ) : (
              <div className="space-y-3">
                <textarea
                  value={genPrompt}
                  onChange={(e) => setGenPrompt(e.target.value)}
                  placeholder="Describe the image to generate — e.g. luxury perfume bottle on black marble…"
                  rows={4}
                  className="w-full rounded-xl text-sm resize-none outline-none px-3 py-2.5"
                  style={{
                    background: W.glassDim,
                    border: `1px solid ${W.border}`,
                    color: W.text,
                  }}
                />
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={generateSourceImage}
                  disabled={genStatus === "processing" || !genPrompt.trim()}
                  className="w-full h-10 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  style={{
                    background: "#dc2626",
                    boxShadow: "0 0 20px rgba(220,38,38,0.22)",
                  }}
                >
                  {genStatus === "processing" ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Generating…
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Image · 1 credit
                    </>
                  )}
                </motion.button>
              </div>
            )}
          </div>
        ) : (
          // The main photo now renders as the first tile in the panel's own
          // photo grid (unified with reference-photo slots, same box style),
          // rather than a separate full-width hero preview above it — the
          // two used to look like different UI systems stitched together.
          <ImageToVideoPanel
            key={effectiveTemplate?.id ?? "custom"}
            imageUrl={sourceImageUrl}
            plan={userPlan}
            isAdmin={isAdmin}
            standardVideosUsed={standardVideosUsed}
            onProcessingChange={setIsVideoProcessing}
            onChangeImage={() => {
              if (isVideoProcessing) {
                toast.error(
                  "A video is still generating — cancel it below first, or wait for it to finish.",
                );
                return;
              }
              changeImage();
            }}
            template={effectiveTemplate}
            videoTemplates={videoTemplates}
            onSelectTemplate={setSelectedTemplate}
          />
        )}
      </div>

      {/* Video Template Picker Modal */}
      <AnimatePresence>
        {pickerModalOpen && (
          <VideoTemplatePicker
            templates={videoTemplates}
            selectedTemplateId={effectiveTemplate?.id ?? null}
            onSelectTemplate={(tpl) => {
              setSelectedTemplate(tpl);
              setPickerModalOpen(false);
            }}
            onClose={() => setPickerModalOpen(false)}
            isModal
          />
        )}
      </AnimatePresence>
    </div>
  );
}
