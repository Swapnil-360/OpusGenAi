"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check, Copy, Download, Hash, ImagePlus, MessageSquareText,
  RefreshCw, Sparkles, X,
} from "lucide-react";
import { CAPTION_BANK, HASHTAG_SETS } from "@/lib/caption-bank";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

/* ─── Tokens ───────────────────────────────────────────────────────── */
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
  purple: "#a78bfa",
  purpleBg: "rgba(139,92,246,0.12)",
  purpleBorder: "rgba(139,92,246,0.25)",
};

/* ─── Data ──────────────────────────────────────────────────────────── */
const PLATFORMS = [
  { id: "instagram", label: "Instagram",   hashtagTip: "11–30 hashtags" },
  { id: "facebook",  label: "Facebook",    hashtagTip: "2–5 hashtags" },
  { id: "twitter",   label: "Twitter / X", hashtagTip: "1–2 hashtags" },
  { id: "linkedin",  label: "LinkedIn",    hashtagTip: "3–5 hashtags" },
  { id: "pinterest", label: "Pinterest",   hashtagTip: "5–20 hashtags" },
  { id: "tiktok",    label: "TikTok",      hashtagTip: "5–10 hashtags" },
] as const;
type PlatformId = (typeof PLATFORMS)[number]["id"];

const TONES = [
  { id: "luxury",       label: "Luxury Brand",  desc: "Aspirational, premium" },
  { id: "professional", label: "Professional",  desc: "Authoritative" },
  { id: "casual",       label: "Casual",        desc: "Friendly" },
  { id: "trendy",       label: "Trendy",        desc: "Current, youthful" },
  { id: "sales",        label: "Sales Focused", desc: "Conversion first" },
] as const;
type ToneId = (typeof TONES)[number]["id"];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: W.dim }}>
      {children}
    </p>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────── */
export default function StudioPage() {
  const [historyImages, setHistoryImages] = useState<{ src: string; prompt: string }[]>([]);
  const [selectedHistoryIdx, setSelectedHistoryIdx] = useState<number | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [platform, setPlatform] = useState<PlatformId>("instagram");
  const [tone, setTone] = useState<ToneId>("luxury");
  const [productName, setProductName] = useState("");
  const [genStatus, setGenStatus] = useState<"idle" | "generating" | "done">("idle");
  const [captions, setCaptions] = useState<string[]>([]);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [usedPlatform, setUsedPlatform] = useState<PlatformId>("instagram");
  const [usedTone, setUsedTone] = useState<ToneId>("luxury");
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [hashtagsCopied, setHashtagsCopied] = useState(false);
  const captionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    async function loadHistory() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("generations")
        .select("prompt, metadata")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(20);
      if (!data) return;
      const imgs = data.flatMap((g) => {
        const images = (g.metadata as { images?: string[] })?.images ?? [];
        return images.map((src) => ({ src, prompt: g.prompt ?? "" }));
      });
      setHistoryImages(imgs);
    }
    loadHistory();
  }, []);

  useEffect(() => () => {
    if (captionTimer.current) clearTimeout(captionTimer.current);
    if (hashTimer.current) clearTimeout(hashTimer.current);
  }, []);

  // Active image: prefer uploaded, then history selection
  const activeImageSrc = uploadedImage ?? (selectedHistoryIdx !== null ? historyImages[selectedHistoryIdx]?.src : null);
  const activeImagePrompt = selectedHistoryIdx !== null && !uploadedImage
    ? historyImages[selectedHistoryIdx]?.prompt
    : null;

  const activePlatform = PLATFORMS.find((p) => p.id === platform)!;
  const activeTone     = TONES.find((t) => t.id === tone)!;
  const usedPlatformLabel = PLATFORMS.find((p) => p.id === usedPlatform)?.label ?? "";
  const usedToneLabel     = TONES.find((t) => t.id === usedTone)?.label ?? "";

  // Whether current settings differ from what was last generated
  const isDirty = genStatus === "done" && (platform !== usedPlatform || tone !== usedTone);

  function generate() {
    if (genStatus === "generating") return;
    if (!activeImageSrc) { toast.error("Upload an image first."); return; }
    const name = productName.trim()
      || activeImagePrompt?.split(" ").slice(0, 4).join(" ")
      || "this product";
    setGenStatus("generating");
    setUsedPlatform(platform);
    setUsedTone(tone);
    setTimeout(() => {
      setCaptions(CAPTION_BANK[platform][tone](name));
      const tags = HASHTAG_SETS[platform];
      setHashtags(tags.sort(() => Math.random() - 0.5).slice(0, platform === "instagram" ? 11 : 5));
      setGenStatus("done");
      toast.success("Captions generated!");
    }, 1200);
  }

  function copyCaption(text: string, idx: number) {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    toast.success(`Caption ${idx + 1} copied!`);
    if (captionTimer.current) clearTimeout(captionTimer.current);
    captionTimer.current = setTimeout(() => setCopiedIdx(null), 2000);
  }

  function copyHashtags() {
    navigator.clipboard.writeText(hashtags.join(" "));
    setHashtagsCopied(true);
    toast.success("Hashtags copied!");
    if (hashTimer.current) clearTimeout(hashTimer.current);
    hashTimer.current = setTimeout(() => setHashtagsCopied(false), 2000);
  }

  return (
    <div className="h-full overflow-y-auto" style={{ background: W.bg }}>
      <div className="max-w-3xl mx-auto px-5 py-6 flex flex-col gap-5">

        {/* ── Header ── */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: W.purpleBg, border: `1px solid ${W.purpleBorder}` }}>
            <MessageSquareText className="w-3.5 h-3.5" style={{ color: W.purple }} />
          </div>
          <div>
            <h1 className="text-sm font-semibold leading-none" style={{ color: W.text }}>Content Studio</h1>
            <p className="text-[11px] mt-0.5" style={{ color: W.muted }}>Captions, hashtags &amp; copy for any platform</p>
          </div>
        </div>

        {/* ── Image selection ── */}
        <div>
          <SectionLabel>Image</SectionLabel>

          {/* If no history and no upload: show just the upload area */}
          {historyImages.length === 0 && !uploadedImage ? (
            <label
              className="flex flex-col items-center justify-center gap-2 w-full h-24 rounded-xl cursor-pointer transition-all"
              style={{ border: `2px dashed ${W.border}`, background: W.glassDim }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = W.redBorder; e.currentTarget.style.background = W.redBg; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = W.border; e.currentTarget.style.background = W.glassDim; }}
            >
              <ImagePlus className="w-5 h-5" style={{ color: W.muted }} />
              <p className="text-xs font-medium" style={{ color: W.muted }}>Upload a product image</p>
              <p className="text-[10px]" style={{ color: W.dim }}>JPG, PNG, WebP</p>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) { setSelectedHistoryIdx(null); setUploadedImage(URL.createObjectURL(f)); }
              }} />
            </label>
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-0.5 px-0.5">
              {/* Real images from history */}
              {historyImages.map((img, i) => {
                const isSelected = selectedHistoryIdx === i && !uploadedImage;
                return (
                  <button
                    key={i}
                    onClick={() => { setSelectedHistoryIdx(i); setUploadedImage(null); }}
                    className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 transition-all"
                    title={img.prompt}
                    style={{
                      outline: isSelected ? "2px solid #f87171" : `1px solid ${W.border}`,
                      outlineOffset: isSelected ? "2px" : "0",
                      opacity: isSelected ? 1 : 0.55,
                      transform: isSelected ? "scale(1.06)" : "scale(1)",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.src} alt="" className="w-full h-full object-cover" />
                    {isSelected && (
                      <div className="absolute inset-0 flex items-center justify-center"
                        style={{ background: "rgba(220,38,38,0.22)" }}>
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}

              {/* Uploaded image slot */}
              {uploadedImage ? (
                <div className="relative w-14 h-14 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={uploadedImage} alt="upload" className="w-full h-full rounded-xl object-cover"
                    style={{ border: "2px solid #f87171" }} />
                  <button
                    onClick={() => setUploadedImage(null)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: W.card, border: `1px solid ${W.border}`, color: W.muted }}
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              ) : (
                <label
                  className="w-14 h-14 rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer shrink-0 transition-all"
                  style={{ border: `1px dashed ${W.border}`, background: W.glassDim }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = W.redBorder; e.currentTarget.style.background = W.redBg; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = W.border; e.currentTarget.style.background = W.glassDim; }}
                >
                  <ImagePlus className="w-4 h-4" style={{ color: W.muted }} />
                  <span className="text-[9px] font-medium" style={{ color: W.dim }}>Upload</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) { setSelectedHistoryIdx(null); setUploadedImage(URL.createObjectURL(f)); }
                  }} />
                </label>
              )}
            </div>
          )}

          {/* Active image preview */}
          {activeImageSrc && (
            <div className="flex items-center gap-2 mt-2 px-0.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={activeImageSrc} alt="" className="w-7 h-7 rounded-lg object-cover shrink-0"
                style={{ border: `1px solid ${W.border}` }} />
              <p className="text-[10px] truncate" style={{ color: W.dim }}>
                {activeImagePrompt ? activeImagePrompt.slice(0, 60) + "…" : "Uploaded image"}
              </p>
            </div>
          )}
        </div>

        {/* ── Product name ── */}
        <div>
          <SectionLabel>Product Name <span style={{ color: W.dim }}>(optional)</span></SectionLabel>
          <input
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="e.g. Lumière Serum, Air Max 95…"
            className="w-full h-9 px-3 rounded-xl text-sm outline-none transition-all"
            style={{ border: `1px solid ${W.border}`, background: W.glass, color: W.text }}
            onFocus={(e) => { e.currentTarget.style.borderColor = W.purpleBorder; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = W.border; }}
          />
        </div>

        {/* ── Platform ── */}
        <div>
          <SectionLabel>Platform</SectionLabel>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
            {PLATFORMS.map((p) => (
              <button
                key={p.id}
                title={p.label}
                onClick={() => setPlatform(p.id)}
                className="h-8 w-full rounded-lg text-xs font-medium transition-all truncate px-2"
                style={platform === p.id
                  ? { background: "#dc2626", color: "#fff", border: "1px solid transparent" }
                  : { border: `1px solid ${W.border}`, background: W.glassDim, color: W.muted }}
                onMouseEnter={(e) => { if (platform !== p.id) { e.currentTarget.style.background = W.glass; e.currentTarget.style.color = W.text; } }}
                onMouseLeave={(e) => { if (platform !== p.id) { e.currentTarget.style.background = W.glassDim; e.currentTarget.style.color = W.muted; } }}
              >
                {p.label.split("/")[0]}
              </button>
            ))}
          </div>
          <p className="text-[10px] mt-1.5 flex items-center gap-1" style={{ color: W.dim }}>
            <Hash className="w-2.5 h-2.5" />
            {activePlatform.hashtagTip} recommended
          </p>
        </div>

        {/* ── Tone ── */}
        <div>
          <SectionLabel>Tone</SectionLabel>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
            {TONES.map((t) => (
              <button
                key={t.id}
                title={t.desc}
                onClick={() => setTone(t.id)}
                className="h-8 w-full rounded-lg text-xs font-medium transition-all truncate px-2"
                style={tone === t.id
                  ? { background: "#dc2626", color: "#fff", border: "1px solid transparent" }
                  : { border: `1px solid ${W.border}`, background: W.glassDim, color: W.muted }}
                onMouseEnter={(e) => { if (tone !== t.id) { e.currentTarget.style.background = W.glass; e.currentTarget.style.color = W.text; } }}
                onMouseLeave={(e) => { if (tone !== t.id) { e.currentTarget.style.background = W.glassDim; e.currentTarget.style.color = W.muted; } }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Generate button ── */}
        <motion.button
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.98 }}
          disabled={genStatus === "generating"}
          onClick={generate}
          className="w-full h-9 rounded-lg text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60"
          style={{ background: "#dc2626" }}
        >
          {genStatus === "generating" ? (
            <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Writing captions…</>
          ) : isDirty ? (
            <><RefreshCw className="w-3.5 h-3.5" />Regenerate with new settings</>
          ) : genStatus === "done" ? (
            <><RefreshCw className="w-3.5 h-3.5" />Regenerate</>
          ) : (
            <><Sparkles className="w-3.5 h-3.5" />Generate Captions</>
          )}
        </motion.button>

        {/* Dirty indicator */}
        {isDirty && (
          <p className="text-[10px] text-center -mt-3" style={{ color: W.dim }}>
            Platform or tone changed — click to regenerate
          </p>
        )}

        {/* ── Results ── */}
        <AnimatePresence>
          {genStatus !== "idle" && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="flex flex-col gap-4"
            >
              {/* Active image + settings summary */}
              {activeImageSrc && genStatus === "done" && (
                <div className="flex items-center gap-3 p-2.5 rounded-xl"
                  style={{ border: `1px solid ${W.border}`, background: W.glassDim }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={activeImageSrc} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate" style={{ color: W.text }}>
                      {productName || activeImagePrompt?.split(" ").slice(0, 5).join(" ") || "Product image"}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: W.dim }}>
                      {usedPlatformLabel} · {usedToneLabel}
                    </p>
                  </div>
                  <button
                    onClick={() => { setGenStatus("idle"); setCaptions([]); setHashtags([]); }}
                    className="text-[11px] px-2 py-1 rounded-md transition-all shrink-0"
                    style={{ color: W.dim }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = W.text; e.currentTarget.style.background = W.glass; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = W.dim; e.currentTarget.style.background = "transparent"; }}
                  >
                    Clear
                  </button>
                </div>
              )}

              {/* Generating spinner */}
              {genStatus === "generating" && (
                <div className="flex items-center gap-3 py-6 justify-center">
                  <motion.div
                    className="w-10 h-10 rounded-full border-2"
                    style={{ borderColor: "rgba(220,38,38,0.2)", borderTopColor: "#dc2626" }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  <div>
                    <p className="text-xs font-semibold" style={{ color: W.text }}>Writing captions…</p>
                    <p className="text-[11px]" style={{ color: W.muted }}>{activePlatform.label} · {activeTone.label}</p>
                  </div>
                </div>
              )}

              {/* Caption cards */}
              {genStatus === "done" && captions.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: W.muted }}>
                      {captions.length} captions · {usedPlatformLabel} · {usedToneLabel}
                    </p>
                    <button
                      onClick={generate}
                      className="ml-auto flex items-center gap-1 text-[11px] transition-colors"
                      style={{ color: W.dim }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = W.text)}
                      onMouseLeave={(e) => (e.currentTarget.style.color = W.dim)}
                    >
                      <RefreshCw className="w-3 h-3" /> Regenerate
                    </button>
                  </div>

                  {captions.map((caption, i) => (
                    <motion.div
                      key={`${usedPlatform}-${usedTone}-${i}`}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07 }}
                      className="rounded-xl p-3.5"
                      style={{ border: `1px solid ${W.border}`, background: W.glassDim }}
                    >
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: W.dim }}>v{i + 1}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium ml-auto"
                          style={{ background: W.glass, color: W.dim }}>
                          {caption.length} ch
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed whitespace-pre-line" style={{ color: W.muted }}>{caption}</p>
                      <div className="flex flex-wrap gap-2 mt-2.5 pt-2.5" style={{ borderTop: `1px solid ${W.border}` }}>
                        <button
                          onClick={() => copyCaption(caption, i)}
                          className="h-6 text-[11px] px-2.5 rounded-md flex items-center gap-1.5 transition-all"
                          style={{ color: W.muted }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = W.glass; e.currentTarget.style.color = W.text; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = W.muted; }}
                        >
                          {copiedIdx === i
                            ? <><Check className="w-3 h-3 text-emerald-400" />Copied</>
                            : <><Copy className="w-3 h-3" />Copy</>}
                        </button>
                        <button
                          onClick={() => { navigator.clipboard.writeText(`${caption}\n\n${hashtags.join(" ")}`); toast.success("Full post copied!"); }}
                          className="h-6 text-[11px] px-2.5 rounded-md flex items-center gap-1.5 transition-all ml-auto"
                          style={{ color: W.muted }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = W.glass; e.currentTarget.style.color = W.text; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = W.muted; }}
                        >
                          <Download className="w-3 h-3" />+ Hashtags
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Hashtag pack */}
              {genStatus === "done" && hashtags.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="rounded-xl p-3.5"
                  style={{ border: `1px solid ${W.border}`, background: W.glassDim }}
                >
                  <div className="flex flex-wrap items-center gap-2 mb-2.5">
                    <Hash className="w-3.5 h-3.5 shrink-0" style={{ color: W.red }} />
                    <p className="text-xs font-semibold" style={{ color: W.text }}>Hashtag Pack</p>
                    <span className="text-[10px] rounded-md px-1.5 py-0.5"
                      style={{ background: W.glass, color: W.dim }}>{hashtags.length} tags</span>
                    <button
                      onClick={copyHashtags}
                      className="h-6 text-[11px] px-2.5 rounded-md flex items-center gap-1 transition-all ml-auto"
                      style={{ color: W.muted }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = W.glass; e.currentTarget.style.color = W.text; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = W.muted; }}
                    >
                      {hashtagsCopied
                        ? <><Check className="w-3 h-3 text-emerald-400" />Copied</>
                        : <><Copy className="w-3 h-3" />Copy all</>}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {hashtags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => { navigator.clipboard.writeText(tag); toast.success("Tag copied!"); }}
                        className="text-[11px] font-medium px-2 py-0.5 rounded-md transition-colors"
                        style={{ background: W.redBg, border: `1px solid ${W.redBorder}`, color: W.red }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(220,38,38,0.20)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = W.redBg)}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] mt-1.5" style={{ color: W.dim }}>Click any tag to copy individually</p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="h-4" />
      </div>
    </div>
  );
}
