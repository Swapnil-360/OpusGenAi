"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Aperture, Check, ChevronDown, Download, ExternalLink,
  ImagePlus, Lock, RefreshCw, ScanText,
  Sparkles, Wand2, X, Zap, Layers,
  Globe, ShoppingBag, Megaphone, LayoutTemplate, Heart,
  Droplets, Gem, Watch, Pill, Footprints, Briefcase, Smartphone, Flame,
} from "lucide-react";
import { useTemplates } from "@/lib/hooks/use-templates";
import { fileToDataUrl } from "@/lib/mask-canvas";
import { createClient } from "@/lib/supabase/client";
import { DEFAULT_NOTIFICATION_PREFS, LOW_CREDIT_THRESHOLD, type NotificationPrefs } from "@/lib/notification-prefs";
import { QUALITY_TIERS, canUseQuality, isPlanAtLeast, type Plan, type Quality } from "@/lib/plans";
import { ImageToVideoPanel } from "@/components/tools/ImageToVideoPanel";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
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

const USE_CASES = [
  {
    label: "Website / Product Page",
    icon: Globe,
    prompt: "clean white seamless studio background, soft even lighting, minimal shadow, sharp focus, professional e-commerce product photography, centered composition",
  },
  {
    label: "Marketplace Listing",
    icon: ShoppingBag,
    prompt: "pure white background, bright even studio lighting, no shadows, sharp focus, standard e-commerce marketplace listing style",
  },
  {
    label: "Social Media Post",
    icon: Heart,
    prompt: "warm flat surface with soft natural light, blurred simple backdrop, shallow depth of field, trendy minimal social-media aesthetic, inviting mood, no busy interior scene",
  },
  {
    label: "Poster / Ad Banner",
    icon: LayoutTemplate,
    prompt: "bold dramatic background with strong negative space for text overlay, high contrast studio lighting, cinematic advertising style",
  },
  {
    label: "Marketing Campaign",
    icon: Megaphone,
    prompt: "editorial advertising background, moody cinematic lighting, premium brand campaign aesthetic, shallow depth of field",
  },
] as const;

// Scene-only prompts for product-photo (premium) mode — the product itself
// comes from your photo, so these only need to describe the environment.
// "Perfume / Body Spray" is the validated pattern (tested, worked well);
// the rest follow the same surface + lighting + mood structure.
const PRODUCT_SCENE_PRESETS = [
  {
    label: "Perfume / Body Spray",
    icon: Droplets,
    prompt: "on a solid pure white studio background with soft even lighting, subtle water droplets and a soft reflection below, professional cosmetic product photography",
  },
  {
    label: "Skincare",
    icon: Sparkles,
    prompt: "on a solid white marble surface with soft natural side lighting, a few water droplets nearby, clean minimalist skincare photography",
  },
  {
    label: "Jewelry",
    icon: Gem,
    prompt: "on a solid black velvet surface with a single dramatic spotlight creating sparkle and highlights, luxury jewelry photography",
  },
  {
    label: "Watch",
    icon: Watch,
    prompt: "on a brushed titanium surface with dramatic side lighting and sharp reflections, luxury watch photography",
  },
  {
    label: "Supplement / Bottle",
    icon: Pill,
    prompt: "on a solid white studio background with soft even lighting and a subtle floor reflection, clean pharmaceutical product photography",
  },
  {
    label: "Sneakers / Shoes",
    icon: Footprints,
    prompt: "floating on a solid white seamless background with soft studio lighting and a soft shadow beneath, clean sneaker product photography",
  },
  {
    label: "Handbag",
    icon: Briefcase,
    prompt: "on a warm wooden table with soft natural window light, editorial handbag product photography",
  },
  {
    label: "Electronics",
    icon: Smartphone,
    prompt: "on a solid dark gradient background with cool blue rim lighting and sharp reflections, modern tech product photography",
  },
  {
    label: "Candle",
    icon: Flame,
    prompt: "on a solid concrete surface with warm ambient lighting and a soft shadow, cozy lifestyle candle photography",
  },
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
  return (
    <Suspense>
      <GeneratePageInner />
    </Suspense>
  );
}

function GeneratePageInner() {
  const searchParams = useSearchParams();
  const { templates } = useTemplates();
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
  const [refFile, setRefFile] = useState<File | null>(null);
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>(DEFAULT_NOTIFICATION_PREFS);
  const [quality, setQuality] = useState<Quality>("standard");
  // UI affordance only — locking options here is purely so a Free/Basic user
  // isn't surprised by a 403. The server re-derives entitlement from the DB
  // independently on every request; this value is never trusted for cost.
  const [userPlan, setUserPlan] = useState<Plan>("free");
  // Admin bypasses entitlement server-side regardless of the plan column
  // (same as unlimited credits) — without this, an admin whose own row
  // hasn't been manually set to "pro" would see every gated option locked
  // even though the server would let the request through.
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const { data } = await supabase
        .from("profiles")
        .select("notification_prefs")
        .eq("id", session.user.id)
        .single();
      const saved = data?.notification_prefs as Partial<NotificationPrefs> | null;
      if (saved) setNotifPrefs((prev) => ({ ...prev, ...saved }));
    })();
    fetch("/api/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((me) => {
        if (me?.plan) setUserPlan(me.plan);
        if (typeof me?.isAdmin === "boolean") setIsAdmin(me.isAdmin);
      })
      .catch(() => {});
  }, []);
  const [fullViewSrc, setFullViewSrc] = useState<string | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function improvePrompt() {
    if (!prompt.trim() && !refFile) {
      toast.error("Add a photo or type a prompt first.");
      return;
    }
    setIsEnhancing(true);
    // duration acts purely as a backstop — every exit path dismisses by id.
    toast.loading("Analyzing…", { id: "enhance-progress", duration: 60000 });

    try {
      const image = refFile ? await fileToDataUrl(refFile) : undefined;
      const res = await fetch("/api/enhance-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), image, hasProductPhoto: !!refFile }),
      });

      toast.dismiss("enhance-progress");

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Couldn't improve the prompt. Try again.");
        return;
      }

      const { prompt: improved } = await res.json();
      setPrompt(improved);
      toast.success("Prompt improved!");
    } catch {
      toast.dismiss("enhance-progress");
      toast.error("Network error. Check your connection.");
    } finally {
      setIsEnhancing(false);
    }
  }

  async function handleDownload(src: string, extension: string = "png") {
    // data: URLs (product-preserving composite) download directly; remote
    // fal.media URLs (plain text-to-image, video) need fetch+blob or the
    // browser just navigates instead of downloading (download attr is
    // ignored cross-origin).
    const isRemote = src.startsWith("http");
    const url = isRemote ? URL.createObjectURL(await (await fetch(src)).blob()) : src;
    const a = document.createElement("a");
    a.href = url;
    a.download = `opusgen-${Date.now()}.${extension}`;
    a.click();
    if (isRemote) URL.revokeObjectURL(url);
    toast.success("Downloading…");
  }

  function closeAll() {
    setShowAiMenu(false);
    setShowSizePicker(false);
    setShowTemplatePicker(false);
  }

  // Premium product-preserving engine: fal-ai/gemini-25-flash-image/edit
  // (3 credits — real cost is ~13x the free flux/schnell path). Unlike the
  // old bg-removal+composite path, this regenerates the whole image via AI —
  // it does not guarantee pixel-identical product pixels, but in testing it
  // reliably preserved shape/logo/text and correctly followed scene prompts.
  async function generateWithProduct(productFile: File) {
    toast.loading("Generating with premium AI…", { id: "gen-progress", duration: 60000 });

    const imageDataUrl = await fileToDataUrl(productFile);

    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: prompt.trim(),
        ratio: selectedSize.ratio,
        templateId: selectedTemplate,
        templateType: appliedTemplate?.templateType,
        mode: "premium",
        quality,
        image: imageDataUrl,
      }),
    });

    toast.dismiss("gen-progress");

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Generation failed. Try again.");
    }

    const { image, credits } = await res.json();
    if (typeof credits === "number") {
      window.dispatchEvent(new CustomEvent("opusgen:credits", { detail: credits }));
    }
    return { image: image as string, credits: typeof credits === "number" ? credits : null };
  }

  async function generateFromPromptOnly() {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: prompt.trim(),
        ratio: selectedSize.ratio,
        templateId: selectedTemplate,
        templateType: appliedTemplate?.templateType,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Generation failed. Try again.");
    }

    const { image, credits } = await res.json();
    if (typeof credits === "number") {
      window.dispatchEvent(new CustomEvent("opusgen:credits", { detail: credits }));
    }
    return { image: image as string, credits: typeof credits === "number" ? credits : null };
  }

  async function handleGenerate() {
    if (genStatus === "processing") return;
    if (!prompt.trim()) { toast.error("Type a prompt first."); return; }
    closeAll();
    setGenStatus("processing");
    setGeneratedImage(null);

    try {
      const { image: finalImage, credits: remaining } = refFile
        ? await generateWithProduct(refFile)
        : await generateFromPromptOnly();
      setGeneratedImage(finalImage);
      setGenStatus("done");
      if (notifPrefs.generationDone) toast.success("Image generated!");
      if (notifPrefs.billing && remaining !== null && remaining <= LOW_CREDIT_THRESHOLD) {
        toast.warning(
          remaining === 0 ? "Out of credits" : `Low on credits — ${remaining} left`,
          { description: "Upgrade your plan to keep generating.", id: "low-credits" }
        );
      }
    } catch (err) {
      toast.dismiss("gen-progress");
      toast.error(err instanceof Error ? err.message : "Network error. Check your connection.");
      setGenStatus("idle");
    }
  }

  function handleSelectTemplate(id: string) {
    const tpl = templates.find((t) => t.id === id);
    if (!tpl) return;
    setSelectedTemplate(id);
    setPrompt(tpl.prompt);
    setShowTemplatePicker(false);
    toast.success(`Template applied: ${tpl.name}`);
  }

  // Deep link from /templates ("Use this template" → /generate?template=<id>).
  // Templates load async, so this waits for the fetch rather than firing once on mount.
  useEffect(() => {
    const id = searchParams.get("template");
    if (id && templates.length > 0) handleSelectTemplate(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, templates]);

  // Replaces the whole prompt with this use case's scene language — only the
  // latest click applies, it never merges with a previous selection.
  function applyUseCase(scenePrompt: string, label: string) {
    setPrompt(scenePrompt.charAt(0).toUpperCase() + scenePrompt.slice(1));
    toast.success(`${label} style added`);
  }

  const imagesReady = genStatus === "done" && !!generatedImage;
  const appliedTemplate = selectedTemplate ? templates.find((t) => t.id === selectedTemplate) : null;

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
            <Aperture className="w-3.5 h-3.5" style={{ color: W.red }} />
          </div>
          <div>
            <h1 className="text-sm font-semibold leading-none" style={{ color: W.text }}>Generate Images</h1>
            <p className="text-[11px] mt-0.5" style={{ color: W.muted }}>AI product photography · Upload your product for AI scene placement (3 credits · premium)</p>
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
                  <img src={refImage} alt="Product" className="w-8 h-8 rounded-lg object-cover shrink-0" style={{ border: `1px solid ${W.border}` }} />
                  <span className="text-[11px]" style={{ color: W.muted }}>Product photo — AI recreates the scene and automatically isolates it from any clutter in frame.</span>
                  <button onClick={() => { setRefImage(null); setRefFile(null); }} className="ml-auto shrink-0" style={{ color: W.dim }}>
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              {refImage && (
                <div className="flex items-center gap-1.5 px-4 pt-2.5">
                  {(Object.keys(QUALITY_TIERS) as Quality[]).map((q) => {
                    const tier = QUALITY_TIERS[q];
                    const unlocked = isAdmin || canUseQuality(userPlan, q);
                    const active = quality === q;
                    return (
                      <button
                        key={q}
                        onClick={() => {
                          if (!unlocked) {
                            toast.info(`${q.toUpperCase()} needs the ${tier.minPlan === "basic" ? "Basic" : "Pro"} plan.`, {
                              action: { label: "Upgrade", onClick: () => { window.location.href = "/account"; } },
                            });
                            return;
                          }
                          setQuality(q);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide transition-all"
                        style={{
                          border: `1px solid ${active ? W.redBorder : W.border}`,
                          background: active ? W.redBg : W.glass,
                          color: active ? W.red : unlocked ? W.muted : W.dim,
                          opacity: unlocked ? 1 : 0.6,
                        }}
                      >
                        {!unlocked && <Lock className="w-2.5 h-2.5" />}
                        {q} · {tier.creditCost}cr
                      </button>
                    );
                  })}
                  <span className="text-[10px] ml-1" style={{ color: W.dim }}>
                    Powered by {QUALITY_TIERS[quality].modelLabel}
                  </span>
                </div>
              )}

              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onFocus={() => setPromptFocused(true)}
                onBlur={() => setPromptFocused(false)}
                rows={6}
                placeholder={refFile
                  ? "Describe the full scene you want — e.g. on white marble surface with soft morning light, e-commerce product photography…"
                  : "Describe your product scene — e.g. luxury perfume bottle on black marble with cinematic side lighting, editorial style…"}
                className="w-full bg-transparent resize-none outline-none px-4 pt-4 pb-2 text-sm leading-relaxed placeholder:opacity-35"
                style={{ color: W.text }}
                maxLength={4000}
              />

              <div className="flex items-center justify-between px-4 pb-3">
                {/* Rendered via Radix's portal (DropdownMenuContent), not a
                 * manually-positioned absolute div — this card has
                 * overflow-hidden for its animated border glow, which was
                 * clipping the old dropdown's top edge since it opened
                 * upward from inside that same clipped container. */}
                <DropdownMenu
                  open={showAiMenu}
                  onOpenChange={(open) => {
                    setShowAiMenu(open);
                    if (open) { setShowSizePicker(false); setShowTemplatePicker(false); }
                  }}
                >
                  <DropdownMenuTrigger asChild>
                    <button
                      disabled={isEnhancing}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[11px] font-medium transition-all disabled:opacity-60"
                      style={showAiMenu
                        ? { border: `1px solid ${W.redBorder}`, background: W.redBg, color: W.red }
                        : { border: `1px solid ${W.border}`, background: W.glass, color: W.muted }}
                    >
                      {isEnhancing
                        ? <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        : <Sparkles className="w-3 h-3" />}
                      {isEnhancing ? "Analyzing…" : "Enhance"}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    side="top"
                    sideOffset={8}
                    className="w-60 rounded-2xl p-1.5"
                    style={{ background: W.card, border: `1px solid ${W.border}`, boxShadow: "0 20px 50px rgba(0,0,0,0.7)" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {AI_ACTIONS.map(({ icon: Icon, label, desc }) => (
                      <DropdownMenuItem
                        key={label}
                        disabled={isEnhancing}
                        onSelect={() => {
                          if (label === "Random Prompt") {
                            const pick = ALL_PROMPTS[Math.floor(Math.random() * ALL_PROMPTS.length)];
                            setPrompt(pick);
                            toast.success("Random prompt applied!");
                          } else if (label === "Improve Prompt") {
                            improvePrompt();
                          } else {
                            toast.info(`${label} — coming soon!`);
                          }
                        }}
                        className="flex items-start gap-3 px-3 py-2.5 rounded-xl cursor-pointer"
                        style={{ color: W.text }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = W.glass)}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <Icon className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: W.red }} />
                        <div>
                          <p className="text-[12px] font-semibold" style={{ color: W.text }}>{label}</p>
                          <p className="text-[10px]" style={{ color: W.muted }}>
                            {label === "Improve Prompt" && refFile ? "Analyzes your photo + prompt" : desc}
                          </p>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <span
                  className="text-[10px] font-mono"
                  style={{ color: prompt.length > 3600 ? "#fbbf24" : W.dim }}
                >
                  {prompt.length}/4000
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Add product photo ── */}
        {!refImage && (
          <div className="-mt-2">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) { setRefFile(f); setRefImage(URL.createObjectURL(f)); }
            }} />
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-left transition-all"
              style={{ border: `1px dashed ${W.border}`, background: W.glassDim }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = W.redBorder; e.currentTarget.style.background = W.redBg; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = W.border; e.currentTarget.style.background = W.glassDim; }}
            >
              <ImagePlus className="w-4 h-4 shrink-0" style={{ color: W.red }} />
              <div className="min-w-0">
                <p className="text-xs font-semibold" style={{ color: W.text }}>Add your product photo</p>
                <p className="text-[10px] mt-0.5" style={{ color: W.dim }}>Optional — AI places your exact product into the generated scene (premium, 3 credits)</p>
              </div>
            </button>
          </div>
        )}

        {/* ── Prompt ideas ── */}
        <div className="rounded-xl p-3.5 space-y-3" style={{ border: `1px solid ${W.border}`, background: W.glassDim }}>
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: W.dim }}>Prompt ideas</p>

          {refFile ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-semibold shrink-0" style={{ color: W.muted }}>For your product</span>
              {PRODUCT_SCENE_PRESETS.map(({ label, icon: Icon, prompt: p }) => (
                <button
                  key={label}
                  onClick={() => applyUseCase(p, label)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all"
                  style={{ border: `1px solid ${W.border}`, background: W.glass, color: W.muted }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = W.redBorder; e.currentTarget.style.background = W.redBg; e.currentTarget.style.color = W.red; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = W.border; e.currentTarget.style.background = W.glass; e.currentTarget.style.color = W.muted; }}
                >
                  <Icon className="w-3 h-3 shrink-0" />
                  {label}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-semibold shrink-0" style={{ color: W.muted }}>Try</span>
              {QUICK_EXAMPLES.map(({ label, prompt: p }) => (
                <button
                  key={label}
                  onClick={() => setPrompt(p)}
                  className="px-2.5 py-1 rounded-full text-[11px] font-medium transition-all"
                  style={{ border: `1px solid ${W.border}`, background: W.glass, color: W.muted }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = W.redBorder; e.currentTarget.style.background = W.redBg; e.currentTarget.style.color = W.red; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = W.border; e.currentTarget.style.background = W.glass; e.currentTarget.style.color = W.muted; }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-semibold shrink-0" style={{ color: W.muted }}>Use case</span>
            {USE_CASES.map(({ label, icon: Icon, prompt: p }) => (
              <button
                key={label}
                onClick={() => applyUseCase(p, label)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all"
                style={{ border: `1px solid ${W.border}`, background: W.glass, color: W.muted }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = W.redBorder; e.currentTarget.style.background = W.redBg; e.currentTarget.style.color = W.red; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = W.border; e.currentTarget.style.background = W.glass; e.currentTarget.style.color = W.muted; }}
              >
                <Icon className="w-3 h-3 shrink-0" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Settings + Generate ── */}
        <div className="flex items-center gap-2 flex-wrap pt-1 relative" style={{ borderTop: `1px solid ${W.border}` }}>

          {/* Template picker */}
          <div className="relative shrink-0 mt-3">
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
                  className="absolute bottom-full mb-2 left-0 z-50 w-72 rounded-2xl overflow-hidden"
                  style={{ background: "#130505", border: `1px solid ${W.border}`, boxShadow: "0 20px 50px rgba(0,0,0,0.8)" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-1.5 max-h-80 overflow-y-auto">
                    {([
                      { type: "production" as const, label: "Production — for your product photos" },
                      { type: "universal" as const, label: "Universal — for your own photos" },
                    ]).map(({ type, label }) => {
                      const group = templates.filter((t) => t.templateType === type).slice(0, 4);
                      if (group.length === 0) return null;
                      return (
                        <div key={type}>
                          <p className="text-[10px] font-bold uppercase tracking-widest px-2 pt-1.5 pb-1.5" style={{ color: W.dim }}>{label}</p>
                          {group.map((tpl) => (
                            <button
                              key={tpl.id}
                              onClick={() => handleSelectTemplate(tpl.id)}
                              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-all text-left"
                              style={selectedTemplate === tpl.id ? { background: W.redBg } : {}}
                              onMouseEnter={(e) => { if (selectedTemplate !== tpl.id) e.currentTarget.style.background = W.glass; }}
                              onMouseLeave={(e) => { if (selectedTemplate !== tpl.id) e.currentTarget.style.background = "transparent"; }}
                            >
                              {tpl.coverImageUrl ? (
                                <Image
                                  src={tpl.coverImageUrl}
                                  alt="" width={48} height={48}
                                  className="w-7 h-7 rounded-md object-cover shrink-0"
                                />
                              ) : (
                                <div
                                  className="w-7 h-7 rounded-md shrink-0"
                                  style={{ background: `linear-gradient(160deg, ${tpl.accentColor}45 0%, #0d0303 85%)` }}
                                />
                              )}
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
                        </div>
                      );
                    })}
                    <Link href="/templates" className="flex items-center justify-center text-xs font-semibold py-2 hover:underline" style={{ color: W.red }} onClick={() => setShowTemplatePicker(false)}>
                      All templates →
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Size picker */}
          <div className="relative shrink-0 mt-3">
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
                  className="absolute bottom-full mb-2 left-0 z-50 w-44 rounded-2xl overflow-hidden"
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

          <div className="flex-1" />

          {/* Generate button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            disabled={genStatus === "processing"}
            onClick={handleGenerate}
            className="h-9 px-6 rounded-full bg-red-600 hover:bg-red-500 text-white font-semibold text-sm flex items-center gap-2 shrink-0 transition-all disabled:opacity-60 mt-3"
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

              {imagesReady && (
                <ImageToVideoPanel
                  key={generatedImage}
                  imageUrl={generatedImage}
                  isEntitled={isAdmin || isPlanAtLeast(userPlan, "pro")}
                />
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
