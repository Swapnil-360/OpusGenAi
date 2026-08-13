"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Clapperboard, Crown, Download, Lock, RefreshCw, Wand2 } from "lucide-react";
import { VIDEO_TIERS, type VideoQuality } from "@/lib/plans";
import { toast } from "sonner";

const W = {
  text:      "rgba(255,255,255,0.90)",
  muted:     "rgba(255,255,255,0.48)",
  dim:       "rgba(255,255,255,0.26)",
  border:    "rgba(255,255,255,0.08)",
  glass:     "rgba(255,255,255,0.05)",
  glassDim:  "rgba(255,255,255,0.03)",
  red:       "#f87171",
  redBg:     "rgba(220,38,38,0.12)",
  redBorder: "rgba(220,38,38,0.30)",
};

const STYLE_OPTIONS = ["Luxury / Premium", "Minimal / Clean", "Energetic / Dynamic", "Natural / Lifestyle", "Dramatic / Moody"];
const MOVEMENT_OPTIONS = ["Slow Push-In", "Orbit / Rotate", "Pull-Back Reveal", "Static Drift"];
const QUALITIES: VideoQuality[] = ["standard", "hd", "premium"];

/** downloads any src (data: or remote) with the given extension, matching
 *  the pattern used by every result panel in this app. */
async function downloadFile(src: string, extension: string) {
  const isRemote = src.startsWith("http");
  const url = isRemote ? URL.createObjectURL(await (await fetch(src)).blob()) : src;
  const a = document.createElement("a");
  a.href = url;
  a.download = `opusgen-${Date.now()}.${extension}`;
  a.click();
  if (isRemote) URL.revokeObjectURL(url);
  toast.success("Downloading…");
}

interface ImageToVideoPanelProps {
  /** The source image to animate — null hides the panel entirely. */
  imageUrl: string | null;
  /** Whether the current user's plan (or admin bypass) unlocks video at all —
   *  UI affordance only. The server independently re-checks entitlement on
   *  every request; this value is never trusted for cost. */
  isEntitled: boolean;
  /** Pre-fills the motion prompt — used when arriving from a video template
   *  (/tools/image-to-video?template=<id>). Only seeds the initial value; the
   *  user edits freely from there. */
  initialPrompt?: string;
}

export function ImageToVideoPanel({ imageUrl, isEntitled, initialPrompt }: ImageToVideoPanelProps) {
  const [quality, setQuality] = useState<VideoQuality>("standard");
  const [style, setStyle] = useState(STYLE_OPTIONS[0]);
  const [movement, setMovement] = useState(MOVEMENT_OPTIONS[0]);
  const [videoPrompt, setVideoPrompt] = useState(initialPrompt ?? "");
  const [videoStatus, setVideoStatus] = useState<"idle" | "processing" | "done" | "failed">("idle");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [enhancing, setEnhancing] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  async function enhancePrompt() {
    if (!imageUrl || enhancing) return;
    setEnhancing(true);
    try {
      const res = await fetch("/api/enhance-video-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl, style, movement, hint: videoPrompt.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Couldn't generate a prompt. Try again.");
        return;
      }
      setVideoPrompt(data.prompt);
      toast.success("Professional prompt ready!");
    } catch {
      toast.error("Network error. Check your connection.");
    } finally {
      setEnhancing(false);
    }
  }

  function reset() {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    setVideoStatus("idle");
    setVideoUrl(null);
    setVideoError(null);
    // Back to the template's prompt when one was supplied, rather than blank —
    // "Try another motion" after arriving from a template shouldn't silently
    // throw that template away.
    setVideoPrompt(initialPrompt ?? "");
  }

  function pollStatus(generationId: string) {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/generate-video/${generationId}/status`);
        if (!res.ok) return; // transient — keep polling, next tick may succeed
        const data = await res.json();
        if (data.status === "completed") {
          if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
          setVideoStatus("done");
          setVideoUrl(data.videoUrl);
          toast.success("Video ready!");
        } else if (data.status === "failed") {
          if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
          setVideoStatus("failed");
          setVideoError(data.error || "Video generation failed.");
          toast.error((data.error || "Video generation failed.") + " Credits refunded.");
        }
        // "pending" — keep polling
      } catch {
        // transient network hiccup — keep polling rather than failing the whole flow
      }
    }, 4000);
  }

  async function startGeneration() {
    if (!imageUrl) return;
    if (!isEntitled) {
      toast.info("Image-to-Video needs the Pro plan.", {
        action: { label: "Upgrade", onClick: () => { window.location.href = "/account"; } },
      });
      return;
    }
    setVideoStatus("processing");
    setVideoError(null);
    setVideoUrl(null);

    try {
      const res = await fetch("/api/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl, prompt: videoPrompt.trim(), quality }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setVideoStatus("failed");
        setVideoError(data.error || "Failed to start video generation.");
        toast.error(data.error || "Failed to start video generation.");
        return;
      }
      if (typeof data.credits === "number") {
        window.dispatchEvent(new CustomEvent("opusgen:credits", { detail: data.credits }));
      }
      pollStatus(data.generationId);
    } catch {
      setVideoStatus("failed");
      setVideoError("Network error. Check your connection.");
      toast.error("Network error. Check your connection.");
    }
  }

  if (!imageUrl) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.22 }}
      className="rounded-2xl p-4"
      style={{ border: `1px solid ${W.redBorder}`, background: "linear-gradient(180deg, rgba(220,38,38,0.06) 0%, transparent 60%)" }}
    >
      <div className="flex items-center gap-2.5 mb-1">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: W.redBg, border: `1px solid ${W.redBorder}` }}>
          <Clapperboard className="w-4 h-4" style={{ color: W.red }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-bold" style={{ color: W.text }}>Animate this image</p>
            <span className="flex items-center gap-0.5 text-[9px] font-black px-1.5 py-0.5 rounded-full text-white" style={{ background: "#dc2626" }}>
              <Crown className="w-2.5 h-2.5" /> PRO
            </span>
          </div>
          <p className="text-[10px] mt-0.5" style={{ color: W.dim }}>
            {VIDEO_TIERS[quality].durationSeconds} seconds · {VIDEO_TIERS[quality].resolution} · {VIDEO_TIERS[quality].creditCost} credits
          </p>
        </div>
      </div>

      {videoStatus === "idle" && (
        <>
          <div className="flex flex-wrap items-center gap-1.5 mt-3">
            {QUALITIES.map((q) => {
              const tier = VIDEO_TIERS[q];
              const active = quality === q;
              return (
                <button
                  key={q}
                  onClick={() => setQuality(q)}
                  className="px-3 py-1.5 rounded-xl text-left transition-all"
                  style={{
                    border: `1px solid ${active ? W.redBorder : W.border}`,
                    background: active ? W.redBg : W.glass,
                  }}
                >
                  <p className="text-[11px] font-bold" style={{ color: active ? W.red : W.text }}>{tier.label}</p>
                  <p className="text-[9px]" style={{ color: W.dim }}>{tier.blurb} · {tier.creditCost}cr</p>
                  <p className="text-[9px] mt-0.5" style={{ color: active ? W.red : W.dim, opacity: 0.75 }}>
                    {tier.modelLabel}{tier.includesAudio && " · AI audio"}
                  </p>
                </button>
              );
            })}
          </div>

          <p className="text-[10px] font-bold uppercase tracking-wider mt-3 mb-1.5" style={{ color: W.dim }}>Style</p>
          <div className="flex flex-wrap gap-1.5">
            {STYLE_OPTIONS.map((s) => {
              const active = style === s;
              return (
                <button
                  key={s}
                  onClick={() => setStyle(s)}
                  className="px-2.5 py-1 rounded-full text-[11px] font-medium transition-all"
                  style={active
                    ? { border: `1px solid ${W.redBorder}`, background: W.redBg, color: W.red }
                    : { border: `1px solid ${W.border}`, background: W.glass, color: W.muted }}
                >
                  {s}
                </button>
              );
            })}
          </div>

          <p className="text-[10px] font-bold uppercase tracking-wider mt-3 mb-1.5" style={{ color: W.dim }}>Camera movement</p>
          <div className="flex flex-wrap gap-1.5">
            {MOVEMENT_OPTIONS.map((m) => {
              const active = movement === m;
              return (
                <button
                  key={m}
                  onClick={() => setMovement(m)}
                  className="px-2.5 py-1 rounded-full text-[11px] font-medium transition-all"
                  style={active
                    ? { border: `1px solid ${W.redBorder}`, background: W.redBg, color: W.red }
                    : { border: `1px solid ${W.border}`, background: W.glass, color: W.muted }}
                >
                  {m}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between mt-3 mb-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: W.dim }}>Production prompt</p>
            <button
              onClick={enhancePrompt}
              disabled={enhancing}
              className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg transition-all disabled:opacity-60"
              style={{ color: W.red, background: W.redBg, border: `1px solid ${W.redBorder}` }}
            >
              {enhancing ? (
                <div className="w-2.5 h-2.5 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
              ) : (
                <Wand2 className="w-2.5 h-2.5" />
              )}
              {enhancing ? "Writing…" : "Write Production Prompt"}
            </button>
          </div>
          <textarea
            value={videoPrompt}
            onChange={(e) => setVideoPrompt(e.target.value)}
            placeholder="Pick a style + camera movement above, then tap Write Production Prompt — or write your own detailed direction here."
            rows={6}
            className="w-full bg-transparent resize-none outline-none rounded-xl px-3 py-2.5 text-xs leading-relaxed placeholder:opacity-40"
            style={{ color: W.text, border: `1px solid ${W.border}`, background: W.glassDim }}
          />
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={startGeneration}
            className="w-full h-9 mt-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all"
            style={{ background: "#dc2626", boxShadow: "0 0 20px rgba(220,38,38,0.22)" }}
          >
            {!isEntitled && <Lock className="w-3.5 h-3.5" />}
            <Clapperboard className="w-3.5 h-3.5" />
            Generate Video
          </motion.button>
        </>
      )}

      {videoStatus === "processing" && (
        <div className="flex flex-col items-center justify-center py-6 mt-1">
          <div className="w-8 h-8 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin mb-3" />
          <p className="text-xs font-semibold" style={{ color: W.text }}>Creating your video…</p>
          <p className="text-[10px] mt-1" style={{ color: W.dim }}>Usually takes 1–2 minutes</p>
          <p className="text-[9px] mt-2" style={{ color: W.dim }}>Generating with {VIDEO_TIERS[quality].modelLabel}</p>
        </div>
      )}

      {videoStatus === "done" && videoUrl && (
        <div className="mt-3">
          <video
            src={videoUrl}
            controls
            loop
            muted
            autoPlay
            className="w-full max-w-sm mx-auto rounded-xl block"
            style={{ border: `1px solid ${W.border}` }}
          />
          <p className="text-[10px] text-center mt-2" style={{ color: W.dim }}>
            Generated with {VIDEO_TIERS[quality].modelLabel}{VIDEO_TIERS[quality].includesAudio && " · includes AI audio"}
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => downloadFile(videoUrl, "mp4")}
              className="flex-1 h-9 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1.5"
              style={{ background: "#dc2626" }}
            >
              <Download className="w-3.5 h-3.5" /> Download
            </button>
            <button
              onClick={reset}
              className="flex-1 h-9 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
              style={{ border: `1px solid ${W.border}`, background: W.glassDim, color: W.muted }}
            >
              <RefreshCw className="w-3.5 h-3.5" /> Try another motion
            </button>
          </div>
        </div>
      )}

      {videoStatus === "failed" && (
        <div className="mt-3 rounded-xl p-3" style={{ border: `1px solid ${W.redBorder}`, background: W.redBg }}>
          <p className="text-xs font-semibold" style={{ color: W.text }}>{videoError || "Video generation failed."}</p>
          <p className="text-[10px] mt-1" style={{ color: W.dim }}>Your credits were refunded.</p>
          <button
            onClick={reset}
            className="mt-2.5 h-8 px-3 rounded-lg text-xs font-semibold"
            style={{ border: `1px solid ${W.border}`, background: W.glassDim, color: W.text }}
          >
            Try again
          </button>
        </div>
      )}
    </motion.div>
  );
}
