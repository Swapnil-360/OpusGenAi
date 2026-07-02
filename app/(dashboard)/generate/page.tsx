"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check, ChevronDown, Download, ExternalLink,
  ImagePlus, RefreshCw, ScanText,
  Sparkles, Wand2, X, Zap, Layers,
} from "lucide-react";
import { TEMPLATES } from "@/lib/templates-data";
import { toast } from "sonner";

/* ─── Static data ──────────────────────────────────────────────────── */
const SIZE_PRESETS = [
  { id: "square",      label: "Square",    ratio: "1:1",  w: 1, h: 1 },
  { id: "ig-portrait", label: "Portrait",  ratio: "4:5",  w: 4, h: 5 },
  { id: "ig-story",    label: "Story",     ratio: "9:16", w: 9, h: 16 },
  { id: "fb-post",     label: "FB Post",   ratio: "16:9", w: 16, h: 9 },
  { id: "linkedin",    label: "LinkedIn",  ratio: "4:3",  w: 4, h: 3 },
] as const;
type SizePreset = (typeof SIZE_PRESETS)[number];

const AI_ACTIONS = [
  { icon: RefreshCw,  label: "Random Prompt",  desc: "Fill with a random product prompt" },
  { icon: Wand2,      label: "Improve Prompt",  desc: "Enhance your prompt for better results" },
  { icon: Sparkles,   label: "Edit With AI",    desc: "Quick AI edits to your prompt" },
  { icon: ScanText,   label: "Describe Image",  desc: "Upload an image and describe it" },
] as const;

const ALL_PROMPTS = [
  "Premium skincare serum on white marble with soft natural light and dried flowers",
  "Minimalist white sneakers floating on a clean studio background with shadow",
  "Luxury soy candle on concrete surface with moody warm ambient lighting",
  "Gold ring on black velvet with dramatic single spotlight creating sparkle",
  "Premium leather handbag on wood table with warm afternoon window light",
  "Lipstick and compact on pink satin fabric with soft studio fill lighting",
  "Luxury mechanical watch on brushed titanium surface with dramatic side light",
  "Crystal perfume bottle on mirrored surface with soft bokeh city lights",
  "Sleek moisturizer bottle on frosted glass shelf with cool ambient light",
  "Sunglasses on sandy beach surface with harsh midday light and shadows",
  "Wireless earbuds on dark matte surface with purple and blue accent lighting",
  "Coffee beans and a minimal mug on white oak surface with morning light",
  "Artisan chocolate bar on black marble with gold foil and moody spotlight",
  "Running shoes on wet asphalt with reflections and motion-blur background",
  "Perfume bottle surrounded by red roses on dark editorial background",
  "Silk scarf draped over crystal vase with warm golden hour window light",
] as const;

const QUICK_EXAMPLES = [
  { label: "Skincare",  prompt: "Premium skincare serum on white marble with soft natural light and dried flowers" },
  { label: "Sneakers",  prompt: "Minimalist white sneakers floating on a clean studio background with shadow" },
  { label: "Candle",    prompt: "Luxury soy candle on concrete surface with moody warm ambient lighting" },
  { label: "Jewelry",   prompt: "Gold ring on black velvet with dramatic single spotlight creating sparkle" },
  { label: "Handbag",   prompt: "Premium leather handbag on wood table with warm afternoon window light" },
  { label: "Beauty",    prompt: "Lipstick and compact on pink satin fabric with soft studio fill lighting" },
  { label: "Watch",     prompt: "Luxury mechanical watch on brushed titanium surface with dramatic side light" },
  { label: "Perfume",   prompt: "Crystal perfume bottle on mirrored surface with soft bokeh city lights" },
] as const;

/* ─── Tokens ────────────────────────────────────────────────────────── */
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
  surface:   "#0d0303",
  card:      "#110404",
};

/* ─── Page ──────────────────────────────────────────────────────────── */
export default function GeneratePage() {
  const [prompt, setPrompt] = useState("");
  const [promptFocused, setPromptFocused] = useState(false);
  const [selectedSize, setSelectedSize] = useState<SizePreset>(SIZE_PRESETS[0]);
  const [showSizePicker, setShowSizePicker] = useState(false);
  const [showAiMenu, setShowAiMenu] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [genStatus, setGenStatus] = useState<"idle" | "processing" | "done">("idle");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [refImage, setRefImage] = useState<string | null>(null);
  const [fullViewSrc, setFullViewSrc] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleDownload(src: string) {
    const a = document.createElement("a");
    a.href = src;
    a.download = `opusgen-${Date.now()}.png`;
    a.click();
    toast.success("Downloading…");
  }

  function closeAll() {
    setShowAiMenu(false);
    setShowSizePicker(false);
    setShowTemplatePicker(false);
  }

  async function handleGenerate() {
    if (genStatus === "processing") return;
    if (!prompt.trim()) { toast.error("Type a prompt first."); return; }
    closeAll();
    setGenStatus("processing");
    setGeneratedImage(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          ratio: selectedSize.ratio,
          templateId: selectedTemplate,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Generation failed. Try again.");
        setGenStatus("idle");
        return;
      }

      const { image, credits } = await res.json();
      setGeneratedImage(image);
      setGenStatus("done");
      toast.success("Image generated!");

      // Server already persisted + charged; broadcast fresh balance to the sidebar
      if (typeof credits === "number") {
        window.dispatchEvent(new CustomEvent("opusgen:credits", { detail: credits }));
      }
    } catch {
      toast.error("Network error. Check your connection.");
      setGenStatus("idle");
    }
  }

  function handleSelectTemplate(id: string) {
    const tpl = TEMPLATES.find((t) => t.id === id);
    if (!tpl) return;
    setSelectedTemplate(id);
    setPrompt(tpl.prompt);
    setShowTemplatePicker(false);
    toast.success(`Template applied: ${tpl.name}`);
  }

  const imagesReady = genStatus === "done" && !!generatedImage;
  const appliedTemplate = selectedTemplate ? TEMPLATES.find((t) => t.id === selectedTemplate) : null;

  return (
    <div className="h-full overflow-y-auto" style={{ background: "#0f0404" }} onClick={() => closeAll()}>
      <div
        className="max-w-3xl mx-auto px-5 py-6 flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >

        {/* ── Page header ── */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: W.redBg, border: `1px solid ${W.redBorder}` }}
          >
            <Sparkles className="w-3.5 h-3.5" style={{ color: W.red }} />
          </div>
          <div>
            <h1 className="text-sm font-semibold leading-none" style={{ color: W.text }}>Generate Images</h1>
            <p className="text-[11px] mt-0.5" style={{ color: W.muted }}>AI product photography · 1 credit per image</p>
          </div>
        </div>

        {/* ── Prompt box ── */}
        <div className="relative">
          <motion.div
            className="absolute -inset-3 rounded-3xl pointer-events-none"
            animate={{ opacity: promptFocused ? 1 : 0 }}
            transition={{ duration: 0.4 }}
            style={{
              background: "radial-gradient(ellipse at 50% 30%, rgba(220,38,38,0.18) 0%, transparent 70%)",
              filter: "blur(18px)",
            }}
          />

          <div className="relative rounded-2xl overflow-hidden" style={{ padding: "1.5px" }}>
            <div className="absolute inset-0 rounded-2xl" style={{ background: "rgba(255,255,255,0.07)" }} />
            <motion.div
              className="absolute pointer-events-none"
              style={{
                width: "200%", height: "200%", top: "-50%", left: "-50%",
                willChange: "transform",
                background: "conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(255,255,255,0.10) 50deg, transparent 110deg)",
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute pointer-events-none"
              style={{
                width: "200%", height: "200%", top: "-50%", left: "-50%",
                willChange: "transform",
                background: "conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(251,113,133,0.45) 30deg, rgba(239,68,68,0.95) 60deg, rgba(251,146,60,0.5) 90deg, transparent 160deg)",
              }}
              animate={{ rotate: 360, opacity: promptFocused ? 1 : 0 }}
              transition={{
                rotate: { duration: 3.5, repeat: Infinity, ease: "linear" },
                opacity: { duration: 0.25 },
              }}
            />

            <div className="relative rounded-2xl overflow-hidden" style={{ background: W.surface }}>
              <motion.div
                className="absolute top-0 left-0 right-0 h-12 pointer-events-none"
                animate={{ opacity: promptFocused ? 1 : 0 }}
                transition={{ duration: 0.3 }}
                style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(220,38,38,0.10) 0%, transparent 70%)" }}
              />

              {refImage && (
                <div className="flex items-center gap-2 px-4 pt-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={refImage} alt="ref" className="w-8 h-8 rounded-lg object-cover shrink-0" style={{ border: `1px solid ${W.border}` }} />
                  <span className="text-[11px]" style={{ color: W.muted }}>Reference image</span>
                  <button onClick={() => setRefImage(null)} className="ml-auto shrink-0" style={{ color: W.dim }}>
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onFocus={() => setPromptFocused(true)}
                onBlur={() => setPromptFocused(false)}
                rows={4}
                placeholder="Describe your product scene — e.g. luxury perfume bottle on black marble with cinematic side lighting, editorial style…"
                className="w-full bg-transparent resize-none outline-none px-4 pt-4 pb-2 text-sm leading-relaxed placeholder:opacity-35"
                style={{ color: W.text }}
                maxLength={500}
              />

              <div className="flex justify-end px-4 pb-3">
                <span
                  className="text-[10px] font-mono"
                  style={{ color: prompt.length > 450 ? "#fbbf24" : W.dim }}
                >
                  {prompt.length}/500
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Controls bar ── */}
        <div className="flex items-center gap-2 flex-wrap -mt-1.5 relative">

          {/* Template picker */}
          <div className="relative shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); setShowTemplatePicker(!showTemplatePicker); setShowAiMenu(false); setShowSizePicker(false); }}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium transition-all"
              style={showTemplatePicker || appliedTemplate
                ? { border: `1px solid ${W.redBorder}`, background: W.redBg, color: W.red }
                : { border: `1px solid ${W.border}`, background: W.glass, color: W.muted }}
            >
              <Layers className="w-3.5 h-3.5 shrink-0" />
              <span className="max-w-24 truncate">{appliedTemplate ? appliedTemplate.name : "Template"}</span>
              <ChevronDown className={`w-3 h-3 shrink-0 transition-transform ${showTemplatePicker ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {showTemplatePicker && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.97 }}
                  transition={{ duration: 0.13 }}
                  className="absolute top-full mt-2 left-0 z-50 w-72 rounded-2xl overflow-hidden"
                  style={{ background: "#130505", border: `1px solid ${W.border}`, boxShadow: "0 20px 50px rgba(0,0,0,0.8)" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-1.5 max-h-64 overflow-y-auto">
                    <p className="text-[10px] font-bold uppercase tracking-widest px-2 pt-1.5 pb-1.5" style={{ color: W.dim }}>Templates</p>
                    {TEMPLATES.slice(0, 8).map((tpl) => (
                      <button
                        key={tpl.id}
                        onClick={() => handleSelectTemplate(tpl.id)}
                        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-all text-left"
                        style={selectedTemplate === tpl.id ? { background: W.redBg } : {}}
                        onMouseEnter={(e) => { if (selectedTemplate !== tpl.id) e.currentTarget.style.background = W.glass; }}
                        onMouseLeave={(e) => { if (selectedTemplate !== tpl.id) e.currentTarget.style.background = "transparent"; }}
                      >
                        <Image
                          src={`https://picsum.photos/seed/${tpl.coverSeed}/48/48`}
                          alt="" width={48} height={48}
                          className="w-7 h-7 rounded-md object-cover shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-semibold leading-none" style={{ color: selectedTemplate === tpl.id ? W.red : W.text }}>
                            {tpl.name}
                            {tpl.isPro && <span className="ml-1.5 text-[9px] bg-amber-400/20 text-amber-400 border border-amber-400/30 rounded-full px-1.5 font-bold">PRO</span>}
                          </p>
                          <p className="text-[10px] mt-0.5 truncate" style={{ color: W.muted }}>{tpl.description}</p>
                        </div>
                        {selectedTemplate === tpl.id && <Check className="w-3 h-3 shrink-0" style={{ color: W.red }} />}
                      </button>
                    ))}
                    <Link href="/templates" className="flex items-center justify-center text-xs font-semibold py-2 hover:underline" style={{ color: W.red }} onClick={() => setShowTemplatePicker(false)}>
                      All templates →
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Size picker */}
          <div className="relative shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); setShowSizePicker(!showSizePicker); setShowAiMenu(false); setShowTemplatePicker(false); }}
              className="flex items-center gap-1 h-8 px-2.5 rounded-lg text-xs font-semibold transition-all font-mono"
              style={showSizePicker
                ? { border: `1px solid ${W.redBorder}`, background: W.redBg, color: W.red }
                : { border: `1px solid ${W.border}`, background: W.glass, color: W.muted }}
            >
              {selectedSize.ratio}
              <ChevronDown className={`w-3 h-3 transition-transform ${showSizePicker ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {showSizePicker && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.97 }}
                  transition={{ duration: 0.13 }}
                  className="absolute top-full mt-2 left-0 z-50 w-44 rounded-2xl overflow-hidden"
                  style={{ background: W.card, border: `1px solid ${W.border}`, boxShadow: "0 20px 50px rgba(0,0,0,0.7)" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest px-2 pt-1.5 pb-1" style={{ color: W.dim }}>Size</p>
                    {SIZE_PRESETS.map((size) => (
                      <button
                        key={size.id}
                        onClick={() => { setSelectedSize(size); setShowSizePicker(false); }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-all"
                        style={selectedSize.id === size.id ? { background: W.redBg } : {}}
                        onMouseEnter={(e) => { if (selectedSize.id !== size.id) e.currentTarget.style.background = W.glass; }}
                        onMouseLeave={(e) => { if (selectedSize.id !== size.id) e.currentTarget.style.background = "transparent"; }}
                      >
                        <div
                          className="rounded shrink-0"
                          style={{
                            width:  Math.round(18 * (size.w / Math.max(size.w, size.h))),
                            height: Math.round(18 * (size.h / Math.max(size.w, size.h))),
                            background: selectedSize.id === size.id ? W.red : "rgba(255,255,255,0.2)",
                            minWidth: 10, minHeight: 10,
                          }}
                        />
                        <div>
                          <p className="text-[12px] font-medium leading-none" style={{ color: selectedSize.id === size.id ? W.red : W.text }}>{size.label}</p>
                          <p className="text-[10px] font-mono mt-0.5" style={{ color: W.dim }}>{size.ratio}</p>
                        </div>
                        {selectedSize.id === size.id && <Check className="w-3 h-3 ml-auto" style={{ color: W.red }} />}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Upload ref image */}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) setRefImage(URL.createObjectURL(f));
          }} />
          <button
            onClick={() => fileRef.current?.click()}
            title="Add reference image"
            className="h-8 w-8 rounded-lg flex items-center justify-center transition-all shrink-0"
            style={{ border: `1px solid ${W.border}`, background: W.glass, color: refImage ? W.red : W.muted }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = W.redBorder; e.currentTarget.style.color = W.red; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = W.border; e.currentTarget.style.color = refImage ? W.red : W.muted; }}
          >
            <ImagePlus className="w-3.5 h-3.5" />
          </button>

          {/* AI Enhance */}
          <div className="relative shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); setShowAiMenu(!showAiMenu); setShowSizePicker(false); setShowTemplatePicker(false); }}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium transition-all"
              style={showAiMenu
                ? { border: `1px solid ${W.redBorder}`, background: W.redBg, color: W.red }
                : { border: `1px solid ${W.border}`, background: W.glass, color: W.muted }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Enhance
            </button>
            <AnimatePresence>
              {showAiMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.97 }}
                  transition={{ duration: 0.13 }}
                  className="absolute top-full mt-2 right-0 z-50 w-60 rounded-2xl overflow-hidden"
                  style={{ background: W.card, border: `1px solid ${W.border}`, boxShadow: "0 20px 50px rgba(0,0,0,0.7)" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {AI_ACTIONS.map(({ icon: Icon, label, desc }) => (
                    <button
                      key={label}
                      onClick={() => {
                        if (label === "Random Prompt") {
                          const pick = ALL_PROMPTS[Math.floor(Math.random() * ALL_PROMPTS.length)];
                          setPrompt(pick);
                          toast.success("Random prompt applied!");
                        } else {
                          toast.info(`${label} — coming soon!`);
                        }
                        setShowAiMenu(false);
                      }}
                      className="w-full flex items-start gap-3 px-4 py-2.5 transition-colors text-left"
                      onMouseEnter={(e) => (e.currentTarget.style.background = W.glass)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <Icon className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: W.red }} />
                      <div>
                        <p className="text-[12px] font-semibold" style={{ color: W.text }}>{label}</p>
                        <p className="text-[10px]" style={{ color: W.muted }}>{desc}</p>
                      </div>
                    </button>
                  ))}
                  <div className="px-4 py-2 text-[10px] text-center" style={{ borderTop: `1px solid ${W.border}`, color: W.dim }}>998 prompt templates</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex-1" />

          {/* Generate button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            disabled={genStatus === "processing"}
            onClick={handleGenerate}
            className="h-9 px-6 rounded-full bg-red-600 hover:bg-red-500 text-white font-semibold text-sm flex items-center gap-2 shrink-0 transition-all disabled:opacity-60"
            style={{ boxShadow: "0 0 20px rgba(220,38,38,0.22)" }}
          >
            {genStatus === "processing" ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" />
                Generate
              </>
            )}
          </motion.button>
        </div>

        {/* ── Quick examples ── */}
        <div className="flex flex-wrap items-center gap-1.5 -mt-1.5">
          <span className="text-[10px] font-bold uppercase tracking-widest mr-1" style={{ color: W.dim }}>Try</span>
          {QUICK_EXAMPLES.map(({ label, prompt: p }) => (
            <button
              key={label}
              onClick={() => setPrompt(p)}
              className="px-2.5 py-1 rounded-full text-[11px] font-medium transition-all"
              style={{ border: `1px solid ${W.border}`, background: W.glassDim, color: W.muted }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = W.redBorder; e.currentTarget.style.background = W.redBg; e.currentTarget.style.color = W.red; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = W.border; e.currentTarget.style.background = W.glassDim; e.currentTarget.style.color = W.muted; }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Result ── */}
        <AnimatePresence>
          {genStatus !== "idle" && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="space-y-3"
            >
              {/* Status bar */}
              <div className="flex items-center gap-2" style={{ borderTop: `1px solid ${W.border}`, paddingTop: "1.25rem" }}>
                {genStatus === "processing" ? (
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: "0 0 5px #4ade8066" }} />
                )}
                <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: W.muted }}>
                  {genStatus === "processing" ? "Generating image…" : "Image ready"}
                </p>
                {genStatus === "done" && (
                  <button
                    onClick={() => { setGenStatus("idle"); setGeneratedImage(null); }}
                    className="ml-auto text-[11px] px-2.5 py-1 rounded-md transition-all"
                    style={{ color: W.dim }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = W.text; e.currentTarget.style.background = W.glass; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = W.dim; e.currentTarget.style.background = "transparent"; }}
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Image output */}
              {genStatus === "processing" ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative w-full max-w-sm mx-auto rounded-2xl overflow-hidden shimmer"
                  style={{
                    aspectRatio: `${selectedSize.w} / ${selectedSize.h}`,
                    border: `1px solid ${W.border}`,
                  }}
                />
              ) : generatedImage && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.93 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 22 }}
                  className="relative group w-full max-w-sm mx-auto rounded-2xl overflow-hidden cursor-pointer"
                  style={{ border: `1px solid ${W.border}` }}
                  onClick={() => setFullViewSrc(generatedImage)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={generatedImage}
                    alt="Generated"
                    className="w-full object-cover"
                  />
                  {/* Hover overlay */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end justify-between p-3"
                    style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)" }}
                  >
                    <button
                      onClick={(e) => { e.stopPropagation(); setFullViewSrc(generatedImage); }}
                      className="text-[10px] font-bold text-white/90 bg-black/50 px-2 py-1 rounded-lg hover:bg-black/70 transition-colors"
                    >
                      View full size
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDownload(generatedImage); }}
                      className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs font-semibold text-white transition-all"
                      style={{ background: "#dc2626" }}
                    >
                      <Download className="w-3 h-3" /> Download
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── Next steps card ── */}
              {imagesReady && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.22 }}
                  className="rounded-2xl p-4"
                  style={{ border: `1px solid ${W.border}`, background: W.card }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: W.dim }}>
                    What&apos;s next?
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    {/* Download CTA */}
                    <button
                      onClick={() => handleDownload(generatedImage!)}
                      className="flex-1 flex items-center gap-3 p-3 rounded-xl transition-all text-left group"
                      style={{ border: `1px solid ${W.border}`, background: W.glassDim }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = W.glass; e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = W.glassDim; e.currentTarget.style.borderColor = W.border; }}
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors"
                        style={{ background: W.glass }}>
                        <Download className="w-3.5 h-3.5" style={{ color: W.muted }} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold" style={{ color: W.text }}>Download image</p>
                        <p className="text-[10px] mt-0.5" style={{ color: W.dim }}>Save PNG to your device</p>
                      </div>
                    </button>

                    {/* Content Studio CTA */}
                    <Link href="/studio" className="flex-1">
                      <div
                        className="flex items-center gap-3 p-3 rounded-xl transition-all h-full group cursor-pointer"
                        style={{ border: `1px solid ${W.redBorder}`, background: W.redBg }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(220,38,38,0.18)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = W.redBg; }}
                      >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: "rgba(220,38,38,0.2)", border: `1px solid ${W.redBorder}` }}>
                          <Sparkles className="w-3.5 h-3.5" style={{ color: W.red }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold" style={{ color: W.text }}>Content Studio</p>
                          <p className="text-[10px] mt-0.5" style={{ color: W.muted }}>Generate captions & hashtags</p>
                        </div>
                        <ExternalLink className="w-3 h-3 shrink-0" style={{ color: W.red }} />
                      </div>
                    </Link>
                  </div>

                  <p className="text-[10px] mt-3 text-center" style={{ color: W.dim }}>
                    Download your image, then upload it to Content Studio to generate platform-ready captions.
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="h-4" />
      </div>

      {/* Fullscreen lightbox */}
      <AnimatePresence>
        {fullViewSrc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.88)" }}
            onClick={() => setFullViewSrc(null)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="relative max-w-2xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={fullViewSrc} alt="Full view" className="w-full rounded-2xl" style={{ border: `1px solid ${W.border}` }} />
              <div className="absolute top-3 right-3 flex gap-2">
                <button
                  onClick={() => handleDownload(fullViewSrc)}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold text-white transition-all"
                  style={{ background: "#dc2626" }}
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
                <button
                  onClick={() => setFullViewSrc(null)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white transition-all"
                  style={{ background: "rgba(0,0,0,0.6)", border: `1px solid ${W.border}` }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
