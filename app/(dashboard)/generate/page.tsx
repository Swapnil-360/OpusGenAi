"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight, Check, ChevronDown, Copy, Download, Eraser, Frame,
  ImagePlus, Maximize2, MessageSquareText, RefreshCw,
  Replace, ScanText, Scissors, Sparkles, Wand2, X, Zap, Layers, type LucideIcon,
} from "lucide-react";
import { TOOLS } from "@/lib/tools-config";
import { TEMPLATES } from "@/lib/templates-data";
import { toast } from "sonner";
import { truncate } from "@/lib/utils";

const TOOL_ICON_MAP: Record<string, LucideIcon> = {
  "text-to-image": Sparkles, "remove-bg": Scissors, "replace-bg": Replace,
  cleanup: Eraser, upscale: Maximize2, uncrop: Frame,
};

const SIZE_PRESETS = [
  { id: "ig-post", label: "IG Post", ratio: "1:1", icon: "📸" },
  { id: "ig-portrait", label: "IG Portrait", ratio: "4:5", icon: "📱" },
  { id: "ig-story", label: "Story", ratio: "9:16", icon: "📱" },
  { id: "fb-post", label: "FB Post", ratio: "16:9", icon: "💻" },
  { id: "linkedin", label: "LinkedIn", ratio: "4:3", icon: "💼" },
  { id: "square", label: "Square", ratio: "1:1", icon: "⬜" },
] as const;
type SizePreset = (typeof SIZE_PRESETS)[number];

const CAPTION_PLATFORMS = [
  { id: "instagram", label: "Instagram", icon: "📸" },
  { id: "facebook", label: "Facebook", icon: "👥" },
  { id: "twitter", label: "Twitter/X", icon: "🐦" },
  { id: "linkedin", label: "LinkedIn", icon: "💼" },
  { id: "pinterest", label: "Pinterest", icon: "📌" },
  { id: "tiktok", label: "TikTok", icon: "🎵" },
] as const;

const CAPTION_TONES = ["Casual", "Professional", "Playful", "Luxury Brand", "Sales Focused"] as const;

const AI_ACTIONS = [
  { icon: RefreshCw, label: "New Random Prompt", desc: "Generate a random product prompt with AI." },
  { icon: Wand2, label: "Improve Prompt", desc: "Enhance your current prompt for better results." },
  { icon: Sparkles, label: "Edit With AI", desc: "Use AI to make quick changes to your prompt." },
  { icon: ScanText, label: "Describe With AI", desc: "Upload an image and generate its description." },
] as const;

const RESULT_SEEDS = ["cosmetic1", "cosmetic2", "bottle1", "bottle2"];
const IMAGE_VISUAL_HINTS = [
  "warm studio lighting with soft bokeh",
  "clean white marble backdrop",
  "dramatic side lighting with shadow",
  "minimal flat-lay composition",
];

function generateMockCaptions(prompt: string, platform: string, imageIdx: number): string[] {
  const base = prompt.split(" ").slice(0, 5).join(" ") || "this amazing product";
  const visual = IMAGE_VISUAL_HINTS[imageIdx] ?? IMAGE_VISUAL_HINTS[0];
  const quality = ["premium", "stunning", "beautifully crafted", "elevated"][imageIdx] ?? "premium";
  const Q = quality.charAt(0).toUpperCase() + quality.slice(1);
  const map: Record<string, string[]> = {
    instagram: [
      `✨ ${base} — ${quality} details, effortless beauty.\n\nShot with ${visual} to show every detail at its best. 🌟\n\n#NewArrival #ProductPhotography #MustHave #StyleGoals`,
      `💫 Your new favourite is here. ${visual} — link in bio to shop 🛒\n\n#ShopNow #ProductLaunch #Trending`,
      `🛍️ Limited stock · Don't miss it ⏰\n${Q} quality, photographed with ${visual}.\n\n#LimitedEdition #NewRelease`,
    ],
    facebook: [
      `🎉 Introducing: ${base}!\n\nPhotographed with ${visual} to let every detail shine.\n\n👉 Click to shop now! Drop a ❤️ if you love it!`,
      `${Q} quality. Real results. 🌟\n\n🚀 Available now · Free shipping on orders over $50`,
    ],
    twitter: [
      `Just dropped: ${base} 🔥 ${visual}. Shop before it's gone → [link] #NewDrop`,
      `Your feed needed this 👀 ${base} — ${quality} shots, live now. #ShopNow`,
    ],
    linkedin: [
      `Excited to share our latest visual for ${base}.\n\nShot with ${visual} — every detail communicates ${quality} quality.\n\n→ Available now\n\n#ProductLaunch #Ecommerce`,
    ],
    pinterest: [
      `${base} | ${Q} quality | ${visual} | Shop our full collection | #ProductPhotography #Style`,
    ],
    tiktok: [
      `POV: You found the most aesthetic ${base} 😍✨ ${visual} — drop a 🛒 if you want it! #fyp #aesthetic`,
      `${Q} product, ${visual} shoot 🤩 #fyp #viral #musthave`,
    ],
  };
  return map[platform] ?? map.instagram;
}

export default function GeneratePage() {
  const [prompt, setPrompt] = useState("");
  const [promptFocused, setPromptFocused] = useState(false);
  const [selectedSize, setSelectedSize] = useState<SizePreset>(SIZE_PRESETS[0]);
  const [showSizePicker, setShowSizePicker] = useState(false);
  const [showAiMenu, setShowAiMenu] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [genStatus, setGenStatus] = useState<"idle" | "processing" | "done">("idle");
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [refImage, setRefImage] = useState<string | null>(null);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [captionPlatform, setCaptionPlatform] = useState("instagram");
  const [captionTone, setCaptionTone] = useState("Casual");
  const [captionStatus, setCaptionStatus] = useState<"idle" | "generating" | "done">("idle");
  const [captions, setCaptions] = useState<string[]>([]);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleGenerate() {
    if (!prompt.trim()) { toast.error("Type a prompt first."); return; }
    setShowAiMenu(false); setShowSizePicker(false); setShowTemplatePicker(false);
    setGenStatus("processing"); setGeneratedImages([]); setCaptions([]); setCaptionStatus("idle"); setSelectedImageIdx(0);
    setTimeout(() => {
      setGeneratedImages(RESULT_SEEDS.map((s) => `https://picsum.photos/seed/${s}/512/512`));
      setGenStatus("done");
      toast.success("4 images generated!");
    }, 2000);
  }

  function handleSelectTemplate(templateId: string) {
    const tpl = TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;
    setSelectedTemplate(templateId);
    setPrompt(tpl.prompt);
    setShowTemplatePicker(false);
    toast.success(`Template applied: ${tpl.name}`);
  }

  function handleGenerateCaption() {
    setCaptionStatus("generating");
    setTimeout(() => {
      setCaptions(generateMockCaptions(prompt, captionPlatform, selectedImageIdx));
      setCaptionStatus("done");
      toast.success("Captions ready!");
    }, 1400);
  }

  function handleCopy(text: string, idx: number) {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    toast.success("Copied!");
    setTimeout(() => setCopiedIdx(null), 1800);
  }

  const imagesReady = genStatus === "done" && generatedImages.length > 0;
  const activePlatform = CAPTION_PLATFORMS.find((p) => p.id === captionPlatform);
  const appliedTemplate = selectedTemplate ? TEMPLATES.find((t) => t.id === selectedTemplate) : null;

  const W = {
    text: "rgba(255,255,255,0.88)",
    muted: "rgba(255,255,255,0.45)",
    dim: "rgba(255,255,255,0.28)",
    border: "rgba(255,255,255,0.09)",
    glass: "rgba(255,255,255,0.05)",
    glassDim: "rgba(255,255,255,0.03)",
    red: "#f87171",
    redBg: "rgba(220,38,38,0.12)",
    redBorder: "rgba(220,38,38,0.35)",
    card: "#120404",
  };

  return (
    <div className="h-full flex flex-col lg:flex-row overflow-hidden" style={{ background: "#0f0404" }}>

      {/* ══ LEFT PANEL ═══════════════════════════════════════════════════ */}
      <div
        className="h-[46vh] lg:h-auto lg:w-[400px] xl:w-[420px] shrink-0 flex flex-col"
        style={{ borderRight: `1px solid ${W.border}`, borderBottom: `1px solid ${W.border}` }}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4 shrink-0" style={{ borderBottom: `1px solid ${W.border}` }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: W.redBg, border: `1px solid ${W.redBorder}` }}>
              <Sparkles className="w-4 h-4" style={{ color: W.red }} />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-base font-bold tracking-tight leading-none" style={{ color: W.text }}>Generate</h1>
              <p className="text-xs mt-0.5" style={{ color: W.muted }}>1 credit · 4 images per run</p>
            </div>
          </div>
        </div>

        {/* Prompt area */}
        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4 flex flex-col gap-3">

          {/* Template quick-use */}
          <div className="relative">
            <button
              onClick={() => { setShowTemplatePicker(!showTemplatePicker); setShowAiMenu(false); setShowSizePicker(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
              style={showTemplatePicker || appliedTemplate
                ? { border: `1px solid ${W.redBorder}`, background: W.redBg, color: W.red }
                : { border: `1px solid ${W.border}`, background: W.glass, color: W.muted }}
            >
              <Layers className="w-3.5 h-3.5 shrink-0" />
              <span className="flex-1 text-left truncate">
                {appliedTemplate ? appliedTemplate.name : "Use a template"}
              </span>
              {appliedTemplate && (
                <span className="ml-auto text-[10px] rounded-full px-1.5 py-0.5 font-bold" style={{ background: W.redBg, color: W.red }}>Applied</span>
              )}
              <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${showTemplatePicker ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {showTemplatePicker && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.97 }}
                  transition={{ duration: 0.14 }}
                  className="absolute top-full mt-2 left-0 right-0 z-50 rounded-2xl backdrop-blur-xl shadow-2xl overflow-hidden"
                  style={{ background: "#130505", border: `1px solid ${W.border}`, boxShadow: "0 24px 60px rgba(0,0,0,0.7)" }}
                >
                  <div className="p-2 max-h-72 overflow-y-auto">
                    <p className="text-[10px] font-bold uppercase tracking-wider px-2 pt-1 pb-2" style={{ color: W.dim }}>Templates</p>
                    {TEMPLATES.slice(0, 8).map((tpl) => (
                      <button
                        key={tpl.id}
                        onClick={() => handleSelectTemplate(tpl.id)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-left"
                        style={selectedTemplate === tpl.id ? { background: W.redBg, color: W.red } : { color: W.text }}
                        onMouseEnter={(e) => { if (selectedTemplate !== tpl.id) e.currentTarget.style.background = W.glass; }}
                        onMouseLeave={(e) => { if (selectedTemplate !== tpl.id) e.currentTarget.style.background = "transparent"; }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`https://picsum.photos/seed/${tpl.coverSeed}/48/48`} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold leading-none mb-0.5 flex items-center gap-1.5">
                            {tpl.name}
                            {tpl.isPro && <span className="text-[9px] bg-amber-400/20 text-amber-400 border border-amber-400/30 rounded-full px-1.5 font-bold">PRO</span>}
                          </p>
                          <p className="text-[10px] truncate" style={{ color: W.muted }}>{tpl.description}</p>
                        </div>
                        {selectedTemplate === tpl.id && <Check className="w-3.5 h-3.5 shrink-0" style={{ color: W.red }} />}
                      </button>
                    ))}
                    <Link
                      href="/templates"
                      className="flex items-center justify-center gap-1.5 text-[11px] font-semibold py-2 hover:underline underline-offset-2"
                      style={{ color: W.red }}
                      onClick={() => setShowTemplatePicker(false)}
                    >
                      View all 12 templates →
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Prompt card — animated spinning border */}
          <div className="relative">
            {/* Outer glow on focus */}
            <motion.div
              className="absolute -inset-2 rounded-3xl pointer-events-none"
              animate={{ opacity: promptFocused ? 1 : 0 }}
              transition={{ duration: 0.4 }}
              style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(220,38,38,0.22) 0%, transparent 70%)", filter: "blur(18px)" }}
            />

            {/* Spinning border wrapper */}
            <div className="relative rounded-2xl overflow-hidden" style={{ padding: "1.5px" }}>
              {/* Dim base layer */}
              <div className="absolute inset-0 rounded-2xl" style={{ background: "rgba(255,255,255,0.08)" }} />

              {/* Dim slow rotation — always on */}
              <motion.div
                className="absolute pointer-events-none"
                style={{
                  width: "200%", height: "200%",
                  top: "-50%", left: "-50%",
                  willChange: "transform",
                  background: "conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(255,255,255,0.14) 50deg, transparent 110deg, transparent 290deg, rgba(255,255,255,0.07) 350deg, transparent 360deg)",
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              />

              {/* Red focus rotation — fades in on focus */}
              <motion.div
                className="absolute pointer-events-none"
                style={{
                  width: "200%", height: "200%",
                  top: "-50%", left: "-50%",
                  willChange: "transform",
                  background: "conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(251,113,133,0.5) 30deg, rgba(239,68,68,1) 65deg, rgba(251,146,60,0.75) 95deg, rgba(239,68,68,0.4) 130deg, transparent 175deg, transparent 310deg, rgba(220,38,38,0.75) 350deg, transparent 360deg)",
                }}
                animate={{ rotate: 360, opacity: promptFocused ? 1 : 0 }}
                transition={{
                  rotate: { duration: 3.5, repeat: Infinity, ease: "linear" },
                  opacity: { duration: 0.3 },
                }}
              />

              {/* Inner card */}
              <div className="relative rounded-2xl overflow-hidden" style={{ background: "#0d0303" }}>
                {/* Subtle top glow on focus */}
                <motion.div
                  className="absolute top-0 left-0 right-0 h-12 pointer-events-none"
                  animate={{ opacity: promptFocused ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(220,38,38,0.12) 0%, transparent 75%)" }}
                />

                <div className="relative px-4 pt-4 pb-2">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onFocus={() => setPromptFocused(true)}
                    onBlur={() => setPromptFocused(false)}
                    placeholder="Describe your product scene — e.g. luxury perfume bottle on black marble with cinematic side lighting…"
                    rows={4}
                    className="w-full bg-transparent resize-none outline-none leading-relaxed text-sm placeholder:opacity-25"
                    style={{ color: W.text }}
                    maxLength={500}
                  />
                </div>

                {refImage && (
                  <div className="px-4 pb-2">
                    <div className="relative inline-block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={refImage} alt="ref" className="w-11 h-11 rounded-xl object-cover" style={{ border: `1px solid ${W.border}` }} />
                      <button
                        onClick={() => setRefImage(null)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center transition-colors"
                        style={{ background: W.card, border: `1px solid ${W.border}`, color: W.muted }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(220,38,38,0.2)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = W.card)}
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 px-3 py-2" style={{ borderTop: `1px solid rgba(255,255,255,0.07)`, background: "rgba(255,255,255,0.02)" }}>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setRefImage(URL.createObjectURL(f)); }} />
                  <span className="text-[11px] font-mono shrink-0" style={{ color: prompt.length > 450 ? "#fbbf24" : W.dim }}>
                    {prompt.length}/500
                  </span>
                  <button onClick={() => fileRef.current?.click()} title="Add reference image" className="w-7 h-7 rounded-lg flex items-center justify-center transition-all shrink-0" style={{ border: `1px solid ${W.border}`, background: W.glass, color: W.muted }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = W.redBorder; e.currentTarget.style.color = W.red; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = W.border; e.currentTarget.style.color = W.muted; }}
                  >
                    <ImagePlus className="w-3.5 h-3.5" />
                  </button>

                  {/* Size picker */}
                  <div className="relative shrink-0">
                    <button
                      onClick={() => { setShowSizePicker(!showSizePicker); setShowAiMenu(false); }}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      style={showSizePicker
                        ? { border: `1px solid ${W.redBorder}`, background: W.redBg, color: W.red }
                        : { border: `1px solid ${W.border}`, background: W.glass, color: W.muted }}
                    >
                      <span>{selectedSize.icon}</span>
                      <span>{selectedSize.ratio}</span>
                      <ChevronDown className={`w-3 h-3 transition-transform ${showSizePicker ? "rotate-180" : ""}`} />
                    </button>
                    <AnimatePresence>
                      {showSizePicker && (
                        <motion.div
                          initial={{ opacity: 0, y: 6, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 6, scale: 0.96 }}
                          transition={{ duration: 0.12 }}
                          className="absolute top-full mt-2 left-0 w-52 rounded-2xl backdrop-blur-xl overflow-hidden z-50 p-2"
                          style={{ background: W.card, border: `1px solid ${W.border}`, boxShadow: "0 20px 50px rgba(0,0,0,0.7)" }}
                        >
                          <p className="text-[10px] font-bold uppercase tracking-wider px-2 pt-1 pb-2" style={{ color: W.dim }}>Output Size</p>
                          {SIZE_PRESETS.map((size) => (
                            <button key={size.id} onClick={() => { setSelectedSize(size); setShowSizePicker(false); }}
                              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-left"
                              style={selectedSize.id === size.id ? { background: W.redBg, color: W.red } : { color: W.muted }}
                              onMouseEnter={(e) => { if (selectedSize.id !== size.id) { e.currentTarget.style.background = W.glass; e.currentTarget.style.color = W.text; } }}
                              onMouseLeave={(e) => { if (selectedSize.id !== size.id) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = W.muted; } }}
                            >
                              <span className="text-sm shrink-0">{size.icon}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold leading-none">{size.label}</p>
                                <p className="text-[10px] mt-0.5" style={{ color: W.dim }}>{size.ratio}</p>
                              </div>
                              {selectedSize.id === size.id && <Check className="w-3.5 h-3.5 shrink-0" style={{ color: W.red }} />}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="flex-1" />

                  {/* AI Enhance */}
                  <div className="relative shrink-0">
                    <button
                      onClick={() => { setShowAiMenu(!showAiMenu); setShowSizePicker(false); }}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      style={showAiMenu
                        ? { border: `1px solid ${W.redBorder}`, background: W.redBg, color: W.red }
                        : { border: `1px solid ${W.border}`, background: W.glass, color: W.muted }}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Enhance</span>
                    </button>
                    <AnimatePresence>
                      {showAiMenu && (
                        <motion.div
                          initial={{ opacity: 0, y: 6, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 6, scale: 0.96 }}
                          transition={{ duration: 0.12 }}
                          className="absolute top-full mt-2 right-0 w-72 rounded-2xl backdrop-blur-xl overflow-hidden z-50"
                          style={{ background: W.card, border: `1px solid ${W.border}`, boxShadow: "0 20px 50px rgba(0,0,0,0.7)" }}
                        >
                          {AI_ACTIONS.map(({ icon: Icon, label, desc }) => (
                            <button key={label} onClick={() => { toast.info(`${label} — coming soon!`); setShowAiMenu(false); }}
                              className="w-full flex items-start gap-3 px-4 py-3 transition-colors text-left"
                              style={{ color: W.text }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = W.glass)}
                              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                            >
                              <Icon className="w-4 h-4 mt-0.5 shrink-0" style={{ color: W.red }} />
                              <div>
                                <p className="text-sm font-semibold">{label}</p>
                                <p className="text-xs mt-0.5" style={{ color: W.muted }}>{desc}</p>
                              </div>
                            </button>
                          ))}
                          <div className="px-4 py-2 text-center text-xs" style={{ borderTop: `1px solid ${W.border}`, color: W.dim }}>998 prompt templates</div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Generate button */}
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: "0 0 40px rgba(220,38,38,0.45)" }}
            whileTap={{ scale: 0.97 }}
            disabled={genStatus === "processing"}
            onClick={handleGenerate}
            className="group w-full flex items-center justify-center gap-3 h-12 pl-6 pr-3 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition-all disabled:opacity-60"
            style={{ boxShadow: "0 0 24px rgba(220,38,38,0.28)" }}
          >
            {genStatus === "processing" ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Generating 4 images…</>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Generate · 1 credit
                <span className="flex items-center justify-center w-7 h-7 rounded-full ml-auto" style={{ background: "rgba(255,255,255,0.18)" }}>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* ══ RIGHT PANEL ══════════════════════════════════════════════════ */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="px-5 pt-5 pb-4">
          <AnimatePresence mode="wait">

            {/* Processing skeletons */}
            {genStatus === "processing" && (
              <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: W.muted }}>Generating 4 images…</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-w-150">
                  {[0, 1, 2, 3].map((i) => (
                    <motion.div key={i} initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.07 }}
                      className="aspect-square rounded-xl shimmer"
                      style={{ border: `1px solid ${W.border}` }}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* Done — 2×2 image grid */}
            {genStatus === "done" && generatedImages.length > 0 && (
              <motion.div key="done" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: "0 0 6px #4ade8088" }} />
                    <p className="text-xs font-semibold tracking-wide uppercase" style={{ color: W.muted }}>4 images ready</p>
                  </div>
                  <button
                    onClick={() => { setGenStatus("idle"); setGeneratedImages([]); setCaptions([]); setCaptionStatus("idle"); }}
                    className="text-[11px] px-2.5 py-1 rounded-lg transition-all"
                    style={{ color: W.dim, border: `1px solid transparent` }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = W.text; e.currentTarget.style.borderColor = W.border; e.currentTarget.style.background = W.glass; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = W.dim; e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.background = "transparent"; }}
                  >
                    Clear
                  </button>
                </div>

                {/* 2×2 grid — properly sized */}
                <div className="grid grid-cols-2 gap-3 max-w-sm">
                  {generatedImages.map((src, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.88 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.08, type: "spring", stiffness: 320, damping: 24 }}
                      onClick={() => { setSelectedImageIdx(i); setCaptions([]); setCaptionStatus("idle"); }}
                      className="relative group aspect-square rounded-2xl overflow-hidden cursor-pointer"
                      style={{
                        outline: selectedImageIdx === i ? "2px solid #f87171" : "none",
                        outlineOffset: "3px",
                        boxShadow: selectedImageIdx === i
                          ? "0 0 0 1px rgba(248,113,113,0.15), 0 8px 32px rgba(0,0,0,0.5)"
                          : "0 4px 20px rgba(0,0,0,0.4)",
                        border: selectedImageIdx !== i ? `1px solid ${W.border}` : "none",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`Output ${i + 1}`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-200" />

                      {/* Hover actions */}
                      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-2 translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-200">
                        <span className="text-[10px] font-bold text-white/80 bg-black/50 backdrop-blur-sm px-1.5 py-0.5 rounded-md">{i + 1}</span>
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="w-7 h-7 rounded-lg bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/80 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5 text-white" />
                        </button>
                      </div>

                      {/* Selected checkmark */}
                      {selectedImageIdx === i && (
                        <motion.div
                          initial={{ scale: 0 }} animate={{ scale: 1 }}
                          className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ background: "#dc2626", boxShadow: "0 0 10px rgba(220,38,38,0.5)" }}
                        >
                          <Check className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </div>
                <p className="text-[11px] mt-3" style={{ color: W.dim }}>Select an image below to generate captions for it</p>
              </motion.div>
            )}

            {/* Idle state — compact */}
            {genStatus === "idle" && (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {/* Compact placeholder */}
                <div className="flex items-center gap-4 py-5 mb-5 px-4 rounded-2xl" style={{ border: `1px solid ${W.border}`, background: W.glassDim }}>
                  <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{ border: "1px solid rgba(220,38,38,0.22)" }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    >
                      <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full" style={{ background: "rgba(220,38,38,0.7)" }} />
                    </motion.div>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.2)" }}>
                      <Sparkles className="w-4 h-4" style={{ color: "#f87171" }} />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-bold leading-tight" style={{ color: W.text }}>Your images will appear here</p>
                    <p className="text-xs mt-0.5" style={{ color: W.muted }}>Write a prompt or pick a template to generate</p>
                  </div>
                </div>

                {/* Quick example chips */}
                <p className="text-[10px] font-bold uppercase tracking-widest mb-2.5" style={{ color: W.dim }}>Quick examples</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { emoji: "🧴", label: "Skincare", prompt: "Premium skincare serum on white marble with soft natural light and dried flowers" },
                    { emoji: "👟", label: "Sneakers", prompt: "Minimalist white sneakers floating on a clean studio background with shadow" },
                    { emoji: "🕯️", label: "Candle", prompt: "Luxury soy candle on a concrete surface with moody warm ambient lighting" },
                    { emoji: "💍", label: "Jewelry", prompt: "Gold ring on black velvet with a dramatic single spotlight creating sparkle" },
                    { emoji: "👜", label: "Handbag", prompt: "Premium leather handbag on a wood table with warm afternoon window light" },
                    { emoji: "💄", label: "Beauty", prompt: "Lipstick and compact on pink satin fabric with soft studio fill lighting" },
                  ].map(({ emoji, label, prompt: p }, idx) => (
                    <motion.button
                      key={label}
                      initial={{ opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.05 + idx * 0.04 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => { setPrompt(p); (document.querySelector("textarea") as HTMLTextAreaElement)?.focus(); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                      style={{ border: `1px solid ${W.border}`, background: W.glassDim, color: W.muted }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(220,38,38,0.3)"; e.currentTarget.style.background = W.redBg; e.currentTarget.style.color = W.red; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = W.border; e.currentTarget.style.background = W.glassDim; e.currentTarget.style.color = W.muted; }}
                    >
                      <span>{emoji}</span>
                      {label}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Divider */}
        <div className="mx-5 h-px" style={{ background: W.border }} />

        {/* Caption generator */}
        <div className="px-5 py-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: W.redBg, border: `1px solid ${W.redBorder}` }}>
              <MessageSquareText className="w-3.5 h-3.5" style={{ color: W.red }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold leading-none" style={{ color: W.text }}>Caption Generator</p>
              <p className="text-[10px] mt-0.5" style={{ color: W.muted }}>
                {imagesReady ? `Image ${selectedImageIdx + 1} · ${activePlatform?.label} · ${captionTone}` : "Generate images first to unlock"}
              </p>
            </div>
            {imagesReady && (
              <Link href="/studio" className="text-[10px] font-semibold hover:underline underline-offset-2 shrink-0" style={{ color: W.red }}>
                Full studio →
              </Link>
            )}
          </div>

          {!imagesReady ? (
            <div className="flex items-center gap-3 py-3 px-4 rounded-xl" style={{ border: `1px dashed ${W.border}`, background: W.glassDim }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center opacity-40 shrink-0" style={{ background: W.glass }}>
                <MessageSquareText className="w-3.5 h-3.5" style={{ color: W.muted }} />
              </div>
              <p className="text-xs" style={{ color: W.muted }}>Generate images above, then click one to write captions for it</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Image strip */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: W.dim }}>Caption based on</p>
                <div className="flex gap-1.5">
                  {generatedImages.map((src, i) => (
                    <button key={i} onClick={() => { setSelectedImageIdx(i); setCaptions([]); setCaptionStatus("idle"); }}
                      className="relative w-10 h-10 rounded-lg overflow-hidden transition-all shrink-0"
                      style={{
                        outline: selectedImageIdx === i ? "2px solid #f87171" : `1px solid ${W.border}`,
                        outlineOffset: selectedImageIdx === i ? "1px" : "0",
                        opacity: selectedImageIdx === i ? 1 : 0.55,
                        transform: selectedImageIdx === i ? "scale(1.05)" : "scale(1)",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`Image ${i + 1}`} className="w-full h-full object-cover" />
                      {selectedImageIdx === i && (
                        <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(220,38,38,0.25)" }}>
                          <Check className="w-3 h-3" style={{ color: W.red }} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Platform */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: W.dim }}>Platform</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {CAPTION_PLATFORMS.map((p) => (
                    <button key={p.id} onClick={() => { setCaptionPlatform(p.id); setCaptions([]); setCaptionStatus("idle"); }}
                      className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-[11px] font-semibold transition-all"
                      style={captionPlatform === p.id
                        ? { border: `1px solid ${W.redBorder}`, background: W.redBg, color: W.red }
                        : { border: `1px solid ${W.border}`, background: W.glassDim, color: W.muted }}
                      onMouseEnter={(e) => { if (captionPlatform !== p.id) { e.currentTarget.style.background = W.glass; e.currentTarget.style.color = W.text; } }}
                      onMouseLeave={(e) => { if (captionPlatform !== p.id) { e.currentTarget.style.background = W.glassDim; e.currentTarget.style.color = W.muted; } }}
                    >
                      <span className="text-sm leading-none">{p.icon}</span>
                      <span className="truncate">{p.label.split("/")[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tone */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: W.dim }}>Tone</p>
                <div className="flex flex-wrap gap-1.5">
                  {CAPTION_TONES.map((tone) => (
                    <button key={tone} onClick={() => { setCaptionTone(tone); setCaptions([]); setCaptionStatus("idle"); }}
                      className="px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all"
                      style={captionTone === tone
                        ? { border: `1px solid ${W.redBorder}`, background: W.redBg, color: W.red }
                        : { border: `1px solid ${W.border}`, background: W.glassDim, color: W.muted }}
                      onMouseEnter={(e) => { if (captionTone !== tone) { e.currentTarget.style.background = W.glass; e.currentTarget.style.color = W.text; } }}
                      onMouseLeave={(e) => { if (captionTone !== tone) { e.currentTarget.style.background = W.glassDim; e.currentTarget.style.color = W.muted; } }}
                    >
                      {tone}
                    </button>
                  ))}
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02, boxShadow: "0 0 32px rgba(220,38,38,0.4)" }}
                whileTap={{ scale: 0.97 }}
                disabled={captionStatus === "generating"}
                onClick={handleGenerateCaption}
                className="w-full flex items-center justify-center gap-2 h-10 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition-all disabled:opacity-60"
                style={{ boxShadow: "0 0 18px rgba(220,38,38,0.22)" }}
              >
                {captionStatus === "generating" ? (
                  <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Analyzing Image {selectedImageIdx + 1}…</>
                ) : (
                  <><Sparkles className="w-3.5 h-3.5" />{captionStatus === "done" ? "Regenerate Captions" : "Generate Captions"}</>
                )}
              </motion.button>

              <AnimatePresence>
                {captionStatus === "done" && captions.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-2.5">
                    <div className="flex items-center gap-1.5">
                      <span>{activePlatform?.icon}</span>
                      <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: W.dim }}>
                        {activePlatform?.label} · {captionTone} · Image {selectedImageIdx + 1}
                      </p>
                    </div>
                    {captions.map((caption, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                        className="relative rounded-xl p-3 pr-10"
                        style={{ border: `1px solid ${W.border}`, background: W.glassDim }}
                      >
                        <p className="text-xs leading-relaxed whitespace-pre-line" style={{ color: W.muted }}>{caption}</p>
                        <button
                          onClick={() => handleCopy(caption, i)}
                          className="absolute top-2.5 right-2.5 w-6 h-6 rounded-lg flex items-center justify-center transition-all"
                          style={{ background: W.glass, border: `1px solid ${W.border}`, color: W.muted }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = W.redBg; e.currentTarget.style.borderColor = W.redBorder; e.currentTarget.style.color = W.red; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = W.glass; e.currentTarget.style.borderColor = W.border; e.currentTarget.style.color = W.muted; }}
                        >
                          {copiedIdx === i ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
