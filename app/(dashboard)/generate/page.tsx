"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Aperture,
  Check,
  ChevronDown,
  Download,
  ExternalLink,
  ImagePlus,
  Lock,
  RefreshCw,
  ScanText,
  Sparkles,
  Wand2,
  Loader2,
  X,
  Zap,
  Layers,
  Globe,
  ShoppingBag,
  Megaphone,
  LayoutTemplate,
  Heart,
  Droplets,
  Gem,
  Watch,
  Pill,
  Footprints,
  Briefcase,
  Smartphone,
  Flame,
} from "lucide-react";
import { useTemplates } from "@/lib/hooks/use-templates";
import { fileToUploadDataUrl } from "@/lib/mask-canvas";
import { readApiError } from "@/lib/api-error";
import { createClient } from "@/lib/supabase/client";
import {
  DEFAULT_NOTIFICATION_PREFS,
  LOW_CREDIT_THRESHOLD,
  type NotificationPrefs,
} from "@/lib/notification-prefs";
import { QUALITY_TIERS, canUseQuality, type Quality } from "@/lib/plans";
import { useMe } from "@/lib/hooks/use-me";
import { ImageToVideoPanel } from "@/components/tools/ImageToVideoPanel";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { triggerUpgradeModal } from "@/components/dashboard/UpgradeModal";
import { MultiPlatformBanner } from "@/components/dashboard/MultiPlatformBanner";
import { toast } from "sonner";

/* ─── Static data ──────────────────────────────────────────────────── */
const SIZE_PRESETS = [
  {
    id: "square",
    label: "1:1 Square",
    ratio: "1:1",
    w: 1,
    h: 1,
    platform: "Amazon / Shopify",
    platforms: ["Amazon", "Shopify", "Instagram"],
    desc: "Marketplace listings & square posts",
    dimensions: "2048 × 2048",
  },
  {
    id: "story",
    label: "9:16 Story / Reels",
    ratio: "9:16",
    w: 9,
    h: 16,
    platform: "TikTok / Stories",
    platforms: ["TikTok", "IG Stories", "Reels"],
    desc: "Fullscreen mobile videos & stories",
    dimensions: "1080 × 1920",
  },
  {
    id: "portrait-feed",
    label: "4:5 Portrait Feed",
    ratio: "4:5",
    w: 4,
    h: 5,
    platform: "Instagram / FB",
    platforms: ["Instagram", "Facebook"],
    desc: "Feed posts & sponsored social ads",
    dimensions: "1080 × 1350",
  },
  {
    id: "landscape-banner",
    label: "16:9 Landscape",
    ratio: "16:9",
    w: 16,
    h: 9,
    platform: "Shopify Hero / Web",
    platforms: ["Shopify Hero", "Website", "YouTube"],
    desc: "E-commerce headers & desktop banners",
    dimensions: "1920 × 1080",
  },
  {
    id: "catalog-pin",
    label: "3:4 Catalog Pin",
    ratio: "3:4",
    w: 3,
    h: 4,
    platform: "Etsy / Pinterest",
    platforms: ["Etsy", "Pinterest"],
    desc: "Vertical product cards & discovery pins",
    dimensions: "1200 × 1600",
  },
  {
    id: "classic",
    label: "4:3 Classic",
    ratio: "4:3",
    w: 4,
    h: 3,
    platform: "eBay / Catalog",
    platforms: ["eBay", "Marketplace"],
    desc: "Standard e-commerce catalog listings",
    dimensions: "1200 × 900",
  },
] as const;
type SizePreset = (typeof SIZE_PRESETS)[number];

const AI_ACTIONS = [
  {
    icon: ScanText,
    label: "Describe Image",
    desc: "Upload a photo and let AI write the prompt",
  },
  {
    icon: RefreshCw,
    label: "Random Prompt",
    desc: "Fill with a random studio prompt",
  },
] as const;

const AI_EDIT_STYLES = [
  {
    label: "Golden Hour",
    icon: "🌅",
    instruction:
      "Change lighting to warm golden hour sunlight with soft long shadows",
  },
  {
    label: "Moody Studio",
    icon: "🌑",
    instruction:
      "Make lighting moody, high contrast, and cinematic with dark dramatic shadows",
  },
  {
    label: "Clean White",
    icon: "⚪",
    instruction:
      "Place on clean seamless white studio background with soft even lighting",
  },
  {
    label: "Luxury Gold",
    icon: "✨",
    instruction:
      "Add luxury editorial aesthetic with subtle gold foil accents and premium reflective surface",
  },
  {
    label: "Botanical",
    icon: "🌿",
    instruction:
      "Add fresh botanical greenery and natural plant accents in the background with soft bokeh",
  },
  {
    label: "Water Droplets",
    icon: "💧",
    instruction:
      "Add crisp water droplets, subtle condensation, and clean splash elements",
  },
  {
    label: "Cyberpunk",
    icon: "🏙️",
    instruction:
      "Add futuristic cyberpunk aesthetic with blue and magenta neon edge lighting",
  },
  {
    label: "Minimalist",
    icon: "📐",
    instruction:
      "Simplify scene to clean minimalist architectural aesthetic with negative space",
  },
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
    label: "Product Page",
    icon: Globe,
    prompt:
      "clean white seamless studio background, soft even lighting, minimal shadow, sharp focus, professional e-commerce product photography, centered composition",
  },
  {
    label: "Marketplace",
    icon: ShoppingBag,
    prompt:
      "pure white background, bright even studio lighting, no shadows, sharp focus, standard e-commerce marketplace listing style",
  },
  {
    label: "Social Post",
    icon: Heart,
    prompt:
      "warm flat surface with soft natural light, blurred simple backdrop, shallow depth of field, trendy minimal social-media aesthetic, inviting mood, no busy interior scene",
  },
  {
    label: "Ad Banner",
    icon: LayoutTemplate,
    prompt:
      "bold dramatic background with strong negative space for text overlay, high contrast studio lighting, cinematic advertising style",
  },
  {
    label: "Campaign",
    icon: Megaphone,
    prompt:
      "editorial advertising background, moody cinematic lighting, premium brand campaign aesthetic, shallow depth of field",
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
    prompt:
      "on a solid pure white studio background with soft even lighting, subtle water droplets and a soft reflection below, professional cosmetic product photography",
  },
  {
    label: "Skincare",
    icon: Sparkles,
    prompt:
      "on a solid white marble surface with soft natural side lighting, a few water droplets nearby, clean minimalist skincare photography",
  },
  {
    label: "Jewelry",
    icon: Gem,
    prompt:
      "on a solid black velvet surface with a single dramatic spotlight creating sparkle and highlights, luxury jewelry photography",
  },
  {
    label: "Watch",
    icon: Watch,
    prompt:
      "on a brushed titanium surface with dramatic side lighting and sharp reflections, luxury watch photography",
  },
  {
    label: "Supplement / Bottle",
    icon: Pill,
    prompt:
      "on a solid white studio background with soft even lighting and a subtle floor reflection, clean pharmaceutical product photography",
  },
  {
    label: "Sneakers / Shoes",
    icon: Footprints,
    prompt:
      "floating on a solid white seamless background with soft studio lighting and a soft shadow beneath, clean sneaker product photography",
  },
  {
    label: "Handbag",
    icon: Briefcase,
    prompt:
      "on a warm wooden table with soft natural window light, editorial handbag product photography",
  },
  {
    label: "Electronics",
    icon: Smartphone,
    prompt:
      "on a solid dark gradient background with cool blue rim lighting and sharp reflections, modern tech product photography",
  },
  {
    label: "Candle",
    icon: Flame,
    prompt:
      "on a solid concrete surface with warm ambient lighting and a soft shadow, cozy lifestyle candle photography",
  },
] as const;

const QUICK_EXAMPLES = [
  {
    label: "Skincare",
    prompt:
      "Premium skincare serum on white marble with soft natural light and dried flowers",
  },
  {
    label: "Sneakers",
    prompt:
      "Minimalist white sneakers floating on a clean studio background with shadow",
  },
  {
    label: "Candle",
    prompt:
      "Luxury soy candle on concrete surface with moody warm ambient lighting",
  },
  {
    label: "Jewelry",
    prompt:
      "Gold ring on black velvet with dramatic single spotlight creating sparkle",
  },
  {
    label: "Handbag",
    prompt:
      "Premium leather handbag on wood table with warm afternoon window light",
  },
  {
    label: "Beauty",
    prompt:
      "Lipstick and compact on pink satin fabric with soft studio fill lighting",
  },
  {
    label: "Watch",
    prompt:
      "Luxury mechanical watch on brushed titanium surface with dramatic side light",
  },
  {
    label: "Perfume",
    prompt:
      "Crystal perfume bottle on mirrored surface with soft bokeh city lights",
  },
] as const;

/* ─── Tokens ────────────────────────────────────────────────────────── */
const W = {
  text: "rgba(255,255,255,0.90)",
  muted: "rgba(255,255,255,0.48)",
  dim: "rgba(255,255,255,0.26)",
  border: "rgba(255,255,255,0.08)",
  glass: "rgba(255,255,255,0.05)",
  glassDim: "rgba(255,255,255,0.03)",
  red: "#f87171",
  redBg: "rgba(220,38,38,0.12)",
  redBorder: "rgba(220,38,38,0.30)",
  surface: "#0d0303",
  card: "#110404",
};

interface UploadedRefImage {
  id: string;
  file: File;
  url: string;
}

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
  const { templates } = useTemplates({ authenticated: true });
  const [prompt, setPrompt] = useState("");
  const [promptFocused, setPromptFocused] = useState(false);
  const [selectedSize, setSelectedSize] = useState<SizePreset>(SIZE_PRESETS[0]);
  const [showSizePicker, setShowSizePicker] = useState(false);
  const [showAiMenu, setShowAiMenu] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  // Values for a template's [FIELD] placeholders — the only template text the
  // user supplies, since the prompt itself stays server-side.
  const [placeholderValues, setPlaceholderValues] = useState<
    Record<string, string>
  >({});
  const [genStatus, setGenStatus] = useState<"idle" | "processing" | "done">(
    "idle",
  );
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  // The "Animate this image" card below is keyed to generatedImage — running
  // a new image generation while a video is in progress would remount it and
  const [isVideoProcessing, setIsVideoProcessing] = useState(false);
  const [refImages, setRefImages] = useState<UploadedRefImage[]>([]);

  function addRefFiles(files: FileList | File[]) {
    const incoming = Array.from(files).filter((f) =>
      f.type.startsWith("image/"),
    );
    if (incoming.length === 0) return;
    setRefImages((prev) => {
      const availableSlots = 4 - prev.length;
      if (availableSlots <= 0) {
        toast.info("Maximum 4 reference images allowed.");
        return prev;
      }
      const toAdd = incoming.slice(0, availableSlots).map((file, idx) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${idx}`,
        file,
        url: URL.createObjectURL(file),
      }));
      if (incoming.length > availableSlots) {
        toast.info("Only up to 4 reference images can be added.");
      }
      return [...prev, ...toAdd];
    });
  }

  function removeRefImage(id: string) {
    setRefImages((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((item) => item.id !== id);
    });
  }

  function clearAllRefImages() {
    refImages.forEach((img) => URL.revokeObjectURL(img.url));
    setRefImages([]);
  }
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>(
    DEFAULT_NOTIFICATION_PREFS,
  );
  const [quality, setQuality] = useState<Quality>("standard");
  // Shared cache (lib/hooks/use-me.ts) — instant on navigation instead of
  // this page paying its own /api/me round trip every time it's visited.
  // UI affordance only — locking options here is purely so a Free/Basic user
  // isn't surprised by a 403. The server re-derives entitlement from the DB
  // independently on every request; this value is never trusted for cost.
  const { me } = useMe();
  const userPlan = me?.plan ?? "free";
  // Admin bypasses entitlement server-side regardless of the plan column
  // (same as unlimited credits) — without this, an admin whose own row
  // hasn't been manually set to "pro" would see every gated option locked
  // even though the server would let the request through.
  const isAdmin = me?.isAdmin ?? false;
  const standardVideosUsed = me?.standardVideosUsed ?? 0;

  useEffect(() => {
    if (!isVideoProcessing) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isVideoProcessing]);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) return;
      const { data } = await supabase
        .from("profiles")
        .select("notification_prefs")
        .eq("id", session.user.id)
        .single();
      const saved =
        data?.notification_prefs as Partial<NotificationPrefs> | null;
      if (saved) setNotifPrefs((prev) => ({ ...prev, ...saved }));
    })();
  }, []);
  const [fullViewSrc, setFullViewSrc] = useState<string | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function improvePrompt() {
    if (!prompt.trim() && refImages.length === 0 && !appliedTemplate) {
      toast.error("Add a photo, prompt, or select a template first.");
      return;
    }
    if (appliedTemplate && !prompt.trim() && refImages.length === 0) {
      toast.error("Enter your brand details or additional direction first to polish.");
      return;
    }
    setIsEnhancing(true);
    // duration acts purely as a backstop — every exit path dismisses by id.
    toast.loading(appliedTemplate ? "Polishing brand details with AI…" : "Analyzing…", {
      id: "enhance-progress",
      duration: 60000,
    });

    try {
      const image = refImages[0]
        ? await fileToUploadDataUrl(refImages[0].file)
        : undefined;
      const res = await fetch("/api/enhance-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          image,
          hasProductPhoto: refImages.length > 0,
          templateName: appliedTemplate?.name,
        }),
      });

      toast.dismiss("enhance-progress");

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Couldn't improve the prompt. Try again.");
        return;
      }

      const { prompt: improved } = await res.json();
      setPrompt(improved);
      toast.success(appliedTemplate ? "Brand details polished!" : "Prompt improved!");
    } catch {
      toast.dismiss("enhance-progress");
      toast.error("Network error. Check your connection.");
    } finally {
      setIsEnhancing(false);
    }
  }

  const [showAiEditor, setShowAiEditor] = useState(false);
  const [aiEditInput, setAiEditInput] = useState("");
  const describeFileInputRef = useRef<HTMLInputElement>(null);

  async function handleAiEdit(customInstruction: string) {
    const text = customInstruction.trim();
    if (!text) {
      toast.error("Enter an edit instruction or choose a style.");
      return;
    }
    setIsEnhancing(true);
    toast.loading("Applying AI edits…", {
      id: "edit-progress",
      duration: 60000,
    });

    try {
      const res = await fetch("/api/enhance-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          instruction: text,
          action: "edit",
        }),
      });

      toast.dismiss("edit-progress");

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Couldn't edit the prompt. Try again.");
        return;
      }

      const { prompt: updated } = await res.json();
      setPrompt(updated);
      setAiEditInput("");
      setShowAiEditor(false);
      toast.success("Prompt edited with AI!");
    } catch {
      toast.dismiss("edit-progress");
      toast.error("Network error. Check your connection.");
    } finally {
      setIsEnhancing(false);
    }
  }

  async function handleDescribeImage(file: File) {
    setIsEnhancing(true);
    toast.loading("Analyzing image with AI…", {
      id: "describe-progress",
      duration: 60000,
    });

    try {
      const dataUrl = await fileToUploadDataUrl(file);
      const res = await fetch("/api/enhance-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: dataUrl,
          action: "describe",
        }),
      });

      toast.dismiss("describe-progress");

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Couldn't analyze the image. Try again.");
        return;
      }

      const { prompt: generatedPrompt } = await res.json();
      setPrompt(generatedPrompt);
      toast.success("Prompt generated from image!");
    } catch {
      toast.dismiss("describe-progress");
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
    const url = isRemote
      ? URL.createObjectURL(await (await fetch(src)).blob())
      : src;
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
  async function generateWithProducts(productFiles: File[]) {
    toast.loading("Generating with premium AI…", {
      id: "gen-progress",
      duration: 60000,
    });

    const imageDataUrls = await Promise.all(
      productFiles.map((file) => fileToUploadDataUrl(file)),
    );

    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: prompt.trim(),
        ratio: selectedSize.ratio,
        templateId: selectedTemplate,
        placeholderValues,
        mode: "premium",
        quality,
        image: imageDataUrls[0],
        images: imageDataUrls,
      }),
    });

    toast.dismiss("gen-progress");

    if (!res.ok)
      throw new Error(await readApiError(res, "Generation failed. Try again."));

    const { image, credits } = await res.json();
    if (typeof credits === "number") {
      window.dispatchEvent(
        new CustomEvent("opusgen:credits", { detail: credits }),
      );
    }
    return {
      image: image as string,
      credits: typeof credits === "number" ? credits : null,
    };
  }

  async function generateFromPromptOnly() {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: prompt.trim(),
        ratio: selectedSize.ratio,
        templateId: selectedTemplate,
        placeholderValues,
      }),
    });

    if (!res.ok)
      throw new Error(await readApiError(res, "Generation failed. Try again."));

    const { image, credits } = await res.json();
    if (typeof credits === "number") {
      window.dispatchEvent(
        new CustomEvent("opusgen:credits", { detail: credits }),
      );
    }
    return {
      image: image as string,
      credits: typeof credits === "number" ? credits : null,
    };
  }

  async function handleGenerate() {
    if (genStatus === "processing") return;
    if (isVideoProcessing) {
      toast.error(
        "A video is still generating below — cancel it first, or wait for it to finish.",
      );
      return;
    }
    // With a template applied the prompt lives server-side, so the textarea is
    // optional — but any [FIELD] the template needs must be answered, or the
    // model would render the placeholder label as literal text.
    if (!selectedTemplate && !prompt.trim()) {
      toast.error("Type a prompt first.");
      return;
    }
    const missing = (appliedTemplate?.placeholders ?? []).filter(
      (p) => !placeholderValues[p]?.trim(),
    );
    if (missing.length > 0) {
      toast.error(`Fill in ${missing.join(", ")} before generating.`);
      return;
    }
    closeAll();
    setGenStatus("processing");
    setGeneratedImage(null);

    try {
      const { image: finalImage, credits: remaining } =
        refImages.length > 0
          ? await generateWithProducts(refImages.map((r) => r.file))
          : await generateFromPromptOnly();
      setGeneratedImage(finalImage);
      setGenStatus("done");
      if (notifPrefs.generationDone) toast.success("Image generated!");
      if (
        notifPrefs.billing &&
        remaining !== null &&
        remaining <= LOW_CREDIT_THRESHOLD
      ) {
        toast.warning(
          remaining === 0
            ? "Out of credits"
            : `Low on credits — ${remaining} left`,
          {
            description: "Upgrade your plan to keep generating.",
            id: "low-credits",
          },
        );
      }
    } catch (err) {
      toast.dismiss("gen-progress");
      toast.error(
        err instanceof Error
          ? err.message
          : "Network error. Check your connection.",
      );
      setGenStatus("idle");
    }
  }

  // The template's prompt is never sent to the browser — applying one just
  // records the id (sent to /api/generate, which resolves the real prompt
  // server-side). The textarea stays the user's own optional additions.
  function handleSelectTemplate(id: string) {
    const tpl = templates.find((t) => t.id === id);
    if (!tpl) return;
    setSelectedTemplate(id);
    setPlaceholderValues({});
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
  const appliedTemplate = selectedTemplate
    ? templates.find((t) => t.id === selectedTemplate)
    : null;

  return (
    <div
      className="h-full overflow-y-auto"
      style={{ background: "#0f0404" }}
      onClick={() => closeAll()}
    >
      <div
        className="max-w-3xl mx-auto px-5 py-6 flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Page header ── */}
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: W.redBg, border: `1px solid ${W.redBorder}` }}
            aria-hidden="true"
          >
            <Aperture className="w-4 h-4" style={{ color: W.red }} />
          </div>
          <div>
            <h1
              className="text-xl sm:text-2xl font-bold tracking-tight leading-tight"
              style={{ color: W.text }}
            >
              Generate Images
            </h1>
            <p
              className="text-xs sm:text-sm mt-0.5 leading-normal"
              style={{ color: "rgba(255, 255, 255, 0.65)" }}
            >
              AI product photography · Upload your product for AI scene
              placement (3 credits · premium)
            </p>
          </div>
        </div>

        {/* ── Multi-Platform Production Workflow Banner ── */}
        <MultiPlatformBanner userProductImage={refImages[0]?.url ?? null} />

        {/* ── Prompt box ── */}
        <div className="relative">
          <motion.div
            className="absolute -inset-2 rounded-2xl pointer-events-none"
            animate={{ opacity: promptFocused ? 1 : 0 }}
            transition={{ duration: 0.4 }}
            style={{
              background:
                "radial-gradient(ellipse at 50% 30%, rgba(220,38,38,0.18) 0%, transparent 70%)",
              filter: "blur(18px)",
            }}
          />

          <div
            className="relative rounded-2xl overflow-hidden"
            style={{ padding: "1.5px" }}
          >
            <div
              className="absolute inset-0 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.07)" }}
            />
            <motion.div
              className="absolute pointer-events-none"
              style={{
                width: "200%",
                height: "200%",
                top: "-50%",
                left: "-50%",
                willChange: "transform",
                background:
                  "conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(255,255,255,0.10) 50deg, transparent 110deg)",
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute pointer-events-none"
              style={{
                width: "200%",
                height: "200%",
                top: "-50%",
                left: "-50%",
                willChange: "transform",
                background:
                  "conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(251,113,133,0.45) 30deg, rgba(239,68,68,0.95) 60deg, rgba(251,146,60,0.5) 90deg, transparent 160deg)",
              }}
              animate={{ rotate: 360, opacity: promptFocused ? 1 : 0 }}
              transition={{
                rotate: { duration: 3.5, repeat: Infinity, ease: "linear" },
                opacity: { duration: 0.25 },
              }}
            />

            <div
              className="relative rounded-2xl overflow-hidden"
              style={{ background: W.surface }}
            >
              <motion.div
                className="absolute top-0 left-0 right-0 h-12 pointer-events-none"
                animate={{ opacity: promptFocused ? 1 : 0 }}
                transition={{ duration: 0.3 }}
                style={{
                  background:
                    "radial-gradient(ellipse at 50% 0%, rgba(220,38,38,0.10) 0%, transparent 70%)",
                }}
              />

              {refImages.length > 0 && (
                <div className="px-4 pt-3 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {refImages.map((img, idx) => {
                      const roleTag =
                        idx === 0
                          ? "Product"
                          : idx === 1
                            ? "Logo / Detail"
                            : idx === 2
                              ? "Angle"
                              : "Reference";
                      return (
                        <div
                          key={img.id}
                          className="group relative flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-lg border transition-all"
                          style={{
                            border: `1px solid ${idx === 0 ? W.redBorder : W.border}`,
                            background: idx === 0 ? W.redBg : W.glass,
                          }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={img.url}
                            alt={roleTag}
                            className="w-7 h-7 rounded-md object-cover shrink-0"
                          />
                          <div className="min-w-0 pr-1">
                            <span
                              className="text-[10px] font-bold block leading-none"
                              style={{ color: idx === 0 ? W.red : W.text }}
                            >
                              {roleTag}
                            </span>
                            <span
                              className="text-[9px] block truncate leading-tight mt-0.5"
                              style={{ color: W.dim }}
                            >
                              #{idx + 1}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeRefImage(img.id)}
                            className="p-0.5 rounded hover:bg-white/10 transition-colors cursor-pointer"
                            style={{ color: W.muted }}
                            title={`Remove ${roleTag} image`}
                            aria-label={`Remove image ${idx + 1}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}

                    {refImages.length < 4 && (
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="flex items-center gap-1 h-8 px-2.5 rounded-lg border text-[11px] font-medium transition-all cursor-pointer"
                        style={{
                          border: `1px dashed ${W.border}`,
                          background: W.glassDim,
                          color: W.muted,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = W.redBorder;
                          e.currentTarget.style.color = W.text;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = W.border;
                          e.currentTarget.style.color = W.muted;
                        }}
                        title="Add logo, detail shot, or additional angle (up to 4 total)"
                      >
                        <ImagePlus className="w-3 h-3 text-red-500" />
                        <span>+ Add Logo / Angle ({refImages.length}/4)</span>
                      </button>
                    )}

                    {refImages.length > 1 && (
                      <button
                        type="button"
                        onClick={clearAllRefImages}
                        className="text-[10px] underline ml-auto transition-opacity opacity-60 hover:opacity-100 cursor-pointer"
                        style={{ color: W.dim }}
                      >
                        Clear all
                      </button>
                    )}
                  </div>

                  <p className="text-[10px] leading-tight" style={{ color: W.muted }}>
                    {refImages.length === 1
                      ? "Primary product photo attached. You can add brand logos, detail shots, or angles (up to 4 images) for higher detail generation."
                      : `Multi-image reference active (${refImages.length}/4). AI fuses your product, logo, and angle references seamlessly into the output.`}
                  </p>
                </div>
              )}

              {refImages.length > 0 && (
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
                            toast.info(
                              `${q.toUpperCase()} needs the ${tier.minPlan === "basic" ? "Basic" : "Pro"} plan.`,
                              {
                                action: {
                                  label: "Upgrade",
                                  onClick: () => {
                                    window.location.href = "/account";
                                  },
                                },
                              },
                            );
                            triggerUpgradeModal(tier.minPlan);
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

              {/* Applied template — the prompt behind it stays server-side, so
                  this shows what's active and collects only the fields the
                  template genuinely needs from the user. */}
              {appliedTemplate && (
                <div
                  className="mx-4 mt-3 rounded-xl p-3"
                  style={{
                    border: `1px solid ${W.redBorder}`,
                    background: W.redBg,
                  }}
                >
                  <div className="flex items-start gap-2.5">
                    <Layers
                      className="w-3.5 h-3.5 mt-0.5 shrink-0"
                      style={{ color: W.red }}
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-xs font-bold"
                        style={{ color: W.text }}
                      >
                        {appliedTemplate.name}
                      </p>
                      <p
                        className="text-[10px] mt-0.5"
                        style={{ color: W.dim }}
                      >
                        {appliedTemplate.description}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedTemplate(null);
                        setPlaceholderValues({});
                      }}
                      className="shrink-0 p-1 rounded-md transition-opacity opacity-60 hover:opacity-100"
                      style={{ color: W.muted }}
                      aria-label="Remove template"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>

                  {appliedTemplate.placeholders.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p
                        className="text-[10px] font-bold uppercase tracking-wider"
                        style={{ color: W.dim }}
                      >
                        This template needs
                      </p>
                      {appliedTemplate.placeholders.map((field) => (
                        <input
                          key={field}
                          value={placeholderValues[field] ?? ""}
                          onChange={(e) =>
                            setPlaceholderValues((v) => ({
                              ...v,
                              [field]: e.target.value,
                            }))
                          }
                          placeholder={field
                            .toLowerCase()
                            .replace(/\b\w/g, (c) => c.toUpperCase())}
                          className="w-full h-8 px-2.5 rounded-lg text-xs outline-none"
                          style={{
                            background: W.glassDim,
                            border: `1px solid ${W.border}`,
                            color: W.text,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {appliedTemplate && (
                <div className="px-4 pt-3 pb-1 flex items-center justify-between border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">
                      Additional Info & Brand Details
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-red-500/15 text-red-300 border border-red-500/30">
                      Analyzed as Prompt
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={improvePrompt}
                    disabled={isEnhancing || !prompt.trim()}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 transition-all disabled:opacity-40 cursor-pointer"
                    title="Polish brand details with AI into high-impact prompt directions"
                  >
                    <Sparkles className="w-3 h-3 text-red-400" />
                    {isEnhancing ? "Polishing…" : "AI Polish Brand Info"}
                  </button>
                </div>
              )}

              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onFocus={() => setPromptFocused(true)}
                onBlur={() => setPromptFocused(false)}
                rows={appliedTemplate ? 3 : 6}
                placeholder={
                  appliedTemplate
                    ? "Showcase your brand name, brand story, product highlights, or custom scene direction (e.g. Brand: Lumina, luxury gold embossed packaging, dramatic dark stone podium)…"
                    : refImages.length > 0
                      ? "Describe the full scene you want — e.g. on white marble surface with soft morning light, e-commerce product photography…"
                      : "Describe your product scene — e.g. luxury perfume bottle on black marble with cinematic side lighting, editorial style…"
                }
                className="w-full bg-transparent resize-none outline-none px-4 pt-4 pb-2 text-sm leading-relaxed placeholder:opacity-35"
                style={{ color: W.text }}
                maxLength={4000}
              />

              {appliedTemplate && (
                <p className="text-[11px] text-zinc-400 px-4 pb-2">
                  Your brand name, story, and custom specifications are automatically analyzed and incorporated into the template&apos;s master prompt.
                </p>
              )}

              {/* ── Inline AI Prompt Editor Drawer ── */}
              <AnimatePresence>
                {showAiEditor && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                    style={{
                      borderTop: `1px solid ${W.border}`,
                      background: "rgba(255, 255, 255, 0.02)",
                    }}
                  >
                    <div className="p-3.5 space-y-3">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-5 h-5 rounded-md flex items-center justify-center"
                            style={{ background: W.redBg }}
                          >
                            <Sparkles
                              className="w-3 h-3"
                              style={{ color: W.red }}
                            />
                          </div>
                          <span
                            className="text-xs font-semibold"
                            style={{ color: W.text }}
                          >
                            Edit with AI
                          </span>
                          <span
                            className="text-[10px] hidden sm:inline"
                            style={{ color: W.dim }}
                          >
                            Pick a style modifier or describe custom adjustments
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowAiEditor(false)}
                          className="p-1 rounded-md transition-opacity opacity-60 hover:opacity-100"
                          style={{ color: W.muted }}
                          aria-label="Close AI editor"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Quick style pills */}
                      <div className="space-y-1.5">
                        <p
                          className="text-[10px] font-bold uppercase tracking-wider"
                          style={{ color: W.dim }}
                        >
                          Quick Styles
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {AI_EDIT_STYLES.map(
                            ({ label, icon, instruction }) => (
                              <button
                                key={label}
                                type="button"
                                disabled={isEnhancing}
                                onClick={() => handleAiEdit(instruction)}
                                className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-[11px] font-medium transition-all disabled:opacity-50"
                                style={{
                                  border: `1px solid ${W.border}`,
                                  background: W.glass,
                                  color: W.text,
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.borderColor =
                                    W.redBorder;
                                  e.currentTarget.style.background = W.redBg;
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.borderColor = W.border;
                                  e.currentTarget.style.background = W.glass;
                                }}
                              >
                                <span>{icon}</span>
                                <span>{label}</span>
                              </button>
                            ),
                          )}
                        </div>
                      </div>

                      {/* Custom edit instruction input row */}
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="text"
                          value={aiEditInput}
                          onChange={(e) => setAiEditInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleAiEdit(aiEditInput);
                            }
                          }}
                          placeholder="e.g. Change surface to dark marble, add water splashes, make lighting warmer…"
                          disabled={isEnhancing}
                          className="flex-1 h-8 px-3 rounded-lg text-xs outline-none transition-colors"
                          style={{
                            background: W.surface,
                            border: `1px solid ${W.border}`,
                            color: W.text,
                          }}
                        />
                        <button
                          type="button"
                          disabled={isEnhancing || !aiEditInput.trim()}
                          onClick={() => handleAiEdit(aiEditInput)}
                          className="h-8 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all disabled:opacity-40"
                          style={{
                            background: W.red,
                            color: "#fff",
                          }}
                        >
                          {isEnhancing ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Wand2 className="w-3 h-3" />
                          )}
                          <span>Apply</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap px-4 pb-3">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  {/* Split Enhance Button */}
                  <div
                    className="flex items-center rounded-lg overflow-hidden transition-all"
                    style={{
                      border: `1px solid ${W.border}`,
                      background: W.glass,
                    }}
                  >
                    <button
                      type="button"
                      disabled={isEnhancing}
                      onClick={(e) => {
                        e.stopPropagation();
                        improvePrompt();
                      }}
                      className="flex items-center gap-1.5 h-7 px-2.5 text-[11px] font-medium transition-all disabled:opacity-60"
                      style={{ color: W.muted }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = W.text;
                        e.currentTarget.style.background = W.glassDim;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = W.muted;
                        e.currentTarget.style.background = "transparent";
                      }}
                      title="Improve prompt with AI"
                    >
                      {isEnhancing ? (
                        <Loader2 className="w-3 h-3 animate-spin text-red-500 shrink-0" />
                      ) : (
                        <Sparkles className="w-3 h-3 text-red-500 shrink-0" />
                      )}
                      <span>
                        {isEnhancing
                          ? "Analyzing…"
                          : appliedTemplate
                            ? "Enhance Brand Info"
                            : "Enhance"}
                      </span>
                    </button>

                    <div
                      className="w-[1px] h-3.5"
                      style={{ background: W.border }}
                    />

                    <DropdownMenu
                      open={showAiMenu}
                      onOpenChange={(open) => {
                        setShowAiMenu(open);
                        if (open) {
                          setShowSizePicker(false);
                          setShowTemplatePicker(false);
                        }
                      }}
                    >
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          disabled={isEnhancing}
                          className="h-7 px-1.5 flex items-center justify-center transition-all disabled:opacity-60"
                          style={{ color: W.dim }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = W.text;
                            e.currentTarget.style.background = W.glassDim;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = W.dim;
                            e.currentTarget.style.background = "transparent";
                          }}
                          title="More AI prompt tools"
                          aria-label="More AI prompt tools"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="start"
                        side="bottom"
                        sideOffset={6}
                        avoidCollisions={true}
                        collisionPadding={12}
                        className="w-64 rounded-2xl p-1.5"
                        style={{
                          background: W.card,
                          border: `1px solid ${W.border}`,
                          boxShadow: "0 20px 50px rgba(0,0,0,0.7)",
                        }}
                      >
                        {AI_ACTIONS.map(({ icon: Icon, label, desc }) => (
                          <DropdownMenuItem
                            key={label}
                            disabled={isEnhancing}
                            onSelect={() => {
                              if (label === "Random Prompt") {
                                const pick =
                                  ALL_PROMPTS[
                                    Math.floor(
                                      Math.random() * ALL_PROMPTS.length,
                                    )
                                  ];
                                setPrompt(pick);
                                toast.success("Random prompt applied!");
                              } else if (label === "Describe Image") {
                                describeFileInputRef.current?.click();
                              }
                            }}
                            className="flex items-start gap-3 px-3 py-2.5 rounded-xl cursor-pointer"
                            style={{ color: W.text }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background = W.glass)
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.background = "transparent")
                            }
                          >
                            <Icon
                              className="w-3.5 h-3.5 mt-0.5 shrink-0"
                              style={{ color: W.red }}
                            />
                            <div>
                              <p
                                className="text-[12px] font-semibold"
                                style={{ color: W.text }}
                              >
                                {label}
                              </p>
                              <p
                                className="text-[10px]"
                                style={{ color: W.muted }}
                              >
                                {desc}
                              </p>
                            </div>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Dedicated Edit With AI Button */}
                  <button
                    type="button"
                    disabled={isEnhancing}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAiEditor((prev) => !prev);
                    }}
                    className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[11px] font-medium transition-all disabled:opacity-60"
                    style={{
                      border: showAiEditor
                        ? `1px solid ${W.redBorder}`
                        : `1px solid ${W.border}`,
                      background: showAiEditor ? W.redBg : W.glass,
                      color: showAiEditor ? W.red : W.muted,
                    }}
                    title="Edit prompt with AI instructions or styles"
                  >
                    <Wand2 className="w-3 h-3" />
                    <span>Edit with AI</span>
                  </button>
                </div>

                {/* Hidden input for Describe Image */}
                <input
                  ref={describeFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleDescribeImage(file);
                      e.target.value = "";
                    }
                  }}
                />

                <span
                  className="text-[10px] font-mono shrink-0 ml-auto"
                  style={{ color: prompt.length > 3600 ? "#fbbf24" : W.dim }}
                >
                  {prompt.length}/4000
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Hidden file input for product / reference photos */}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              addRefFiles(e.target.files);
              e.target.value = "";
            }
          }}
        />

        {/* ── Add product photo ── */}
        {refImages.length === 0 && (
          <div className="-mt-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-left transition-all cursor-pointer"
              style={{
                border: `1px dashed ${W.border}`,
                background: W.glassDim,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = W.redBorder;
                e.currentTarget.style.background = W.redBg;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = W.border;
                e.currentTarget.style.background = W.glassDim;
              }}
            >
              <ImagePlus
                className="w-4 h-4 shrink-0"
                style={{ color: W.red }}
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold" style={{ color: W.text }}>
                    Add product photos, logo or reference
                  </p>
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                    style={{ background: W.redBg, color: W.red }}
                  >
                    Up to 4 images
                  </span>
                </div>
                <p className="text-[10px] mt-0.5" style={{ color: W.dim }}>
                  Upload product angles, brand logo, or detail shots — AI integrates all references (premium, 3 credits)
                </p>
              </div>
            </button>
          </div>
        )}

        {/* ── Prompt ideas ── */}
        <div
          className="rounded-xl p-3.5 space-y-3"
          style={{ border: `1px solid ${W.border}`, background: W.glassDim }}
        >
          <p
            className="text-[10px] font-bold uppercase tracking-widest"
            style={{ color: W.dim }}
          >
            Prompt ideas
          </p>

          {refImages.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className="text-[10px] font-semibold shrink-0"
                style={{ color: W.muted }}
              >
                For your product
              </span>
              {PRODUCT_SCENE_PRESETS.map(({ label, icon: Icon, prompt: p }) => (
                <button
                  key={label}
                  onClick={() => applyUseCase(p, label)}
                  className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-xs font-medium border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 hover:text-white text-white/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                >
                  <Icon className="w-3 h-3 shrink-0" aria-hidden="true" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold shrink-0 text-white/50 mr-0.5">
                Try
              </span>
              {QUICK_EXAMPLES.map(({ label, prompt: p }) => (
                <button
                  key={label}
                  onClick={() => setPrompt(p)}
                  className="inline-flex items-center h-7 px-3 rounded-full text-xs font-medium border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 hover:text-white text-white/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold shrink-0 text-white/50 mr-0.5">
              Use case
            </span>
            <div className="flex flex-wrap items-center gap-1.5 flex-1">
              {USE_CASES.map(({ label, icon: Icon, prompt: p }) => (
                <button
                  key={label}
                  onClick={() => applyUseCase(p, label)}
                  className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-xs font-medium border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 hover:text-white text-white/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                >
                  <Icon className="w-3 h-3 shrink-0" aria-hidden="true" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Settings + Generate ── */}
        <div
          className="flex items-center gap-2 flex-wrap pt-1 relative"
          style={{ borderTop: `1px solid ${W.border}` }}
        >
          {/* Template picker */}
          <div className="relative shrink-0 mt-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowTemplatePicker(!showTemplatePicker);
                setShowAiMenu(false);
                setShowSizePicker(false);
              }}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium transition-all"
              style={
                showTemplatePicker || appliedTemplate
                  ? {
                      border: `1px solid ${W.redBorder}`,
                      background: W.redBg,
                      color: W.red,
                    }
                  : {
                      border: `1px solid ${W.border}`,
                      background: W.glass,
                      color: W.muted,
                    }
              }
            >
              <Layers className="w-3.5 h-3.5 shrink-0" />
              <span className="max-w-24 truncate">
                {appliedTemplate ? appliedTemplate.name : "Template"}
              </span>
              <ChevronDown
                className={`w-3 h-3 shrink-0 transition-transform ${showTemplatePicker ? "rotate-180" : ""}`}
              />
            </button>

            <AnimatePresence>
              {showTemplatePicker && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.97 }}
                  transition={{ duration: 0.13 }}
                  className="absolute bottom-full mb-2 left-0 z-50 w-72 rounded-2xl overflow-hidden"
                  style={{
                    background: "#130505",
                    border: `1px solid ${W.border}`,
                    boxShadow: "0 20px 50px rgba(0,0,0,0.8)",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-1.5 max-h-80 overflow-y-auto">
                    {[
                      {
                        type: "production" as const,
                        label: "Production — for your product photos",
                      },
                      {
                        type: "universal" as const,
                        label: "Universal — for your own photos",
                      },
                    ].map(({ type, label }) => {
                      const group = templates
                        .filter((t) => t.templateType === type)
                        .slice(0, 4);
                      if (group.length === 0) return null;
                      return (
                        <div key={type}>
                          <p
                            className="text-[10px] font-bold uppercase tracking-widest px-2 pt-1.5 pb-1.5"
                            style={{ color: W.dim }}
                          >
                            {label}
                          </p>
                          {group.map((tpl) => (
                            <button
                              key={tpl.id}
                              onClick={() => handleSelectTemplate(tpl.id)}
                              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-all text-left"
                              style={
                                selectedTemplate === tpl.id
                                  ? { background: W.redBg }
                                  : {}
                              }
                              onMouseEnter={(e) => {
                                if (selectedTemplate !== tpl.id)
                                  e.currentTarget.style.background = W.glass;
                              }}
                              onMouseLeave={(e) => {
                                if (selectedTemplate !== tpl.id)
                                  e.currentTarget.style.background =
                                    "transparent";
                              }}
                            >
                              {tpl.coverImageUrl ? (
                                <Image
                                  src={tpl.coverImageUrl}
                                  alt=""
                                  width={48}
                                  height={48}
                                  className="w-7 h-7 rounded-md object-cover shrink-0"
                                />
                              ) : (
                                <div
                                  className="w-7 h-7 rounded-md shrink-0"
                                  style={{
                                    background: `linear-gradient(160deg, ${tpl.accentColor}45 0%, #0d0303 85%)`,
                                  }}
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <p
                                  className="text-[12px] font-semibold leading-none"
                                  style={{
                                    color:
                                      selectedTemplate === tpl.id
                                        ? W.red
                                        : W.text,
                                  }}
                                >
                                  {tpl.name}
                                  {tpl.isPro && (
                                    <span className="ml-1.5 text-[9px] bg-amber-400/20 text-amber-400 border border-amber-400/30 rounded-full px-1.5 font-bold">
                                      PRO
                                    </span>
                                  )}
                                </p>
                                <p
                                  className="text-[10px] mt-0.5 truncate"
                                  style={{ color: W.muted }}
                                >
                                  {tpl.description}
                                </p>
                              </div>
                              {selectedTemplate === tpl.id && (
                                <Check
                                  className="w-3 h-3 shrink-0"
                                  style={{ color: W.red }}
                                />
                              )}
                            </button>
                          ))}
                        </div>
                      );
                    })}
                    <Link
                      href="/templates"
                      className="flex items-center justify-center text-xs font-semibold py-2 hover:underline"
                      style={{ color: W.red }}
                      onClick={() => setShowTemplatePicker(false)}
                    >
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
              onClick={(e) => {
                e.stopPropagation();
                setShowSizePicker(!showSizePicker);
                setShowAiMenu(false);
                setShowTemplatePicker(false);
              }}
              className="flex items-center gap-1.5 h-8 px-2.5 sm:px-3 rounded-lg text-xs font-semibold transition-all font-mono"
              style={
                showSizePicker
                  ? {
                      border: `1px solid ${W.redBorder}`,
                      background: W.redBg,
                      color: W.red,
                    }
                  : {
                      border: `1px solid ${W.border}`,
                      background: W.glass,
                      color: W.muted,
                    }
              }
              title={`${selectedSize.label} (${selectedSize.dimensions}) · ${selectedSize.platform}`}
            >
              {/* Scaled Mini Aspect Box */}
              <div
                className="rounded-xs shrink-0"
                style={{
                  width: Math.round(
                    14 * (selectedSize.w / Math.max(selectedSize.w, selectedSize.h)),
                  ),
                  height: Math.round(
                    14 * (selectedSize.h / Math.max(selectedSize.w, selectedSize.h)),
                  ),
                  background: showSizePicker ? W.red : "rgba(255,255,255,0.45)",
                  minWidth: 8,
                  minHeight: 8,
                }}
              />
              <span>{selectedSize.ratio}</span>
              <span className="hidden sm:inline font-sans text-[11px] font-normal opacity-85 truncate max-w-[120px]">
                · {selectedSize.platform}
              </span>
              <ChevronDown
                className={`w-3 h-3 transition-transform ${showSizePicker ? "rotate-180" : ""}`}
              />
            </button>
            <AnimatePresence>
              {showSizePicker && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.97 }}
                  transition={{ duration: 0.13 }}
                  className="absolute bottom-full mb-2 left-0 z-50 w-72 sm:w-80 rounded-2xl overflow-hidden"
                  style={{
                    background: "#130505",
                    border: `1px solid ${W.border}`,
                    boxShadow: "0 20px 50px rgba(0,0,0,0.8)",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-2 max-h-96 overflow-y-auto">
                    <div
                      className="px-2.5 pt-1.5 pb-2 border-b"
                      style={{ borderColor: "rgba(255,255,255,0.08)" }}
                    >
                      <p
                        className="text-[10px] font-bold uppercase tracking-widest"
                        style={{ color: W.dim }}
                      >
                        Aspect Ratio &amp; Target Platform
                      </p>
                      <p className="text-[11px] text-zinc-400 mt-0.5 leading-tight">
                        Optimized for e-commerce marketplaces &amp; social feeds
                      </p>
                    </div>

                    <div className="space-y-1 mt-1.5">
                      {SIZE_PRESETS.map((size) => {
                        const isSelected = selectedSize.id === size.id;
                        return (
                          <button
                            key={size.id}
                            type="button"
                            onClick={() => {
                              setSelectedSize(size);
                              setShowSizePicker(false);
                            }}
                            className="w-full flex items-start gap-2.5 px-2.5 py-2 rounded-xl transition-all text-left"
                            style={
                              isSelected
                                ? {
                                    background: W.redBg,
                                    border: `1px solid ${W.redBorder}`,
                                  }
                                : { border: "1px solid transparent" }
                            }
                            onMouseEnter={(e) => {
                              if (!isSelected) e.currentTarget.style.background = W.glass;
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) e.currentTarget.style.background = "transparent";
                            }}
                          >
                            {/* Scaled Aspect Ratio Preview Frame */}
                            <div
                              className="rounded shrink-0 mt-0.5 flex items-center justify-center"
                              style={{
                                width: 26,
                                height: 26,
                                background: "rgba(255,255,255,0.04)",
                                border: "1px solid rgba(255,255,255,0.1)",
                              }}
                            >
                              <div
                                className="rounded-xs"
                                style={{
                                  width: Math.round(
                                    20 * (size.w / Math.max(size.w, size.h)),
                                  ),
                                  height: Math.round(
                                    20 * (size.h / Math.max(size.w, size.h)),
                                  ),
                                  background: isSelected
                                    ? W.red
                                    : "rgba(255,255,255,0.45)",
                                  minWidth: 8,
                                  minHeight: 8,
                                }}
                              />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <p
                                  className="text-[12px] font-bold leading-tight"
                                  style={{
                                    color: isSelected ? W.red : W.text,
                                  }}
                                >
                                  {size.label}
                                </p>
                                <span
                                  className="text-[10px] font-mono shrink-0"
                                  style={{ color: isSelected ? W.red : W.dim }}
                                >
                                  {size.dimensions}
                                </span>
                              </div>

                              {/* Platform badges */}
                              <div className="flex items-center gap-1 mt-1 flex-wrap">
                                {size.platforms.map((p) => (
                                  <span
                                    key={p}
                                    className="text-[9px] font-semibold px-1.5 py-0.5 rounded"
                                    style={{
                                      background: isSelected
                                        ? "rgba(239, 68, 68, 0.25)"
                                        : "rgba(255, 255, 255, 0.08)",
                                      color: isSelected ? "#fca5a5" : "#e4e4e7",
                                    }}
                                  >
                                    {p}
                                  </span>
                                ))}
                              </div>

                              <p
                                className="text-[10px] mt-1 leading-snug"
                                style={{ color: W.muted }}
                              >
                                {size.desc}
                              </p>
                            </div>

                            {isSelected && (
                              <Check
                                className="w-3.5 h-3.5 shrink-0 mt-1"
                                style={{ color: W.red }}
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
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
              <div
                className="flex items-center gap-2"
                style={{
                  borderTop: `1px solid ${W.border}`,
                  paddingTop: "1.25rem",
                }}
              >
                {genStatus === "processing" ? (
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                ) : (
                  <div
                    className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                    style={{ boxShadow: "0 0 5px #4ade8066" }}
                  />
                )}
                <p
                  className="text-[11px] font-semibold uppercase tracking-widest"
                  style={{ color: W.muted }}
                >
                  {genStatus === "processing"
                    ? "Generating image…"
                    : "Image ready"}
                </p>
                {genStatus === "done" && (
                  <button
                    onClick={() => {
                      setGenStatus("idle");
                      setGeneratedImage(null);
                    }}
                    className="ml-auto text-[11px] px-2.5 py-1 rounded-md transition-all"
                    style={{ color: W.dim }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = W.text;
                      e.currentTarget.style.background = W.glass;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = W.dim;
                      e.currentTarget.style.background = "transparent";
                    }}
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
              ) : (
                generatedImage && (
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
                      style={{
                        background:
                          "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)",
                      }}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFullViewSrc(generatedImage);
                        }}
                        className="text-[10px] font-bold text-white/90 bg-black/50 px-2 py-1 rounded-lg hover:bg-black/70 transition-colors"
                      >
                        View full size
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(generatedImage);
                        }}
                        className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs font-semibold text-white transition-all"
                        style={{ background: "#dc2626" }}
                      >
                        <Download className="w-3 h-3" /> Download
                      </button>
                    </div>
                  </motion.div>
                )
              )}

              {/* ── Next steps card ── */}
              {imagesReady && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.22 }}
                  className="rounded-2xl p-4"
                  style={{
                    border: `1px solid ${W.border}`,
                    background: W.card,
                  }}
                >
                  <p
                    className="text-[10px] font-bold uppercase tracking-widest mb-3"
                    style={{ color: W.dim }}
                  >
                    What&apos;s next?
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    {/* Download CTA */}
                    <button
                      onClick={() => handleDownload(generatedImage!)}
                      className="flex-1 flex items-center gap-3 p-3 rounded-xl transition-all text-left group"
                      style={{
                        border: `1px solid ${W.border}`,
                        background: W.glassDim,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = W.glass;
                        e.currentTarget.style.borderColor =
                          "rgba(255,255,255,0.14)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = W.glassDim;
                        e.currentTarget.style.borderColor = W.border;
                      }}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors"
                        style={{ background: W.glass }}
                      >
                        <Download
                          className="w-3.5 h-3.5"
                          style={{ color: W.muted }}
                        />
                      </div>
                      <div>
                        <p
                          className="text-xs font-semibold"
                          style={{ color: W.text }}
                        >
                          Download image
                        </p>
                        <p
                          className="text-[10px] mt-0.5"
                          style={{ color: W.dim }}
                        >
                          Save PNG to your device
                        </p>
                      </div>
                    </button>

                    {/* Content Studio CTA */}
                    <Link href="/studio" className="flex-1">
                      <div
                        className="flex items-center gap-3 p-3 rounded-xl transition-all h-full group cursor-pointer"
                        style={{
                          border: `1px solid ${W.redBorder}`,
                          background: W.redBg,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background =
                            "rgba(220,38,38,0.18)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = W.redBg;
                        }}
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{
                            background: "rgba(220,38,38,0.2)",
                            border: `1px solid ${W.redBorder}`,
                          }}
                        >
                          <Sparkles
                            className="w-3.5 h-3.5"
                            style={{ color: W.red }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-xs font-semibold"
                            style={{ color: W.text }}
                          >
                            Content Studio
                          </p>
                          <p
                            className="text-[10px] mt-0.5"
                            style={{ color: W.muted }}
                          >
                            Generate captions & hashtags
                          </p>
                        </div>
                        <ExternalLink
                          className="w-3 h-3 shrink-0"
                          style={{ color: W.red }}
                        />
                      </div>
                    </Link>
                  </div>

                  <p
                    className="text-[10px] mt-3 text-center"
                    style={{ color: W.dim }}
                  >
                    Download your image, then upload it to Content Studio to
                    generate platform-ready captions.
                  </p>
                </motion.div>
              )}

              {imagesReady && (
                <ImageToVideoPanel
                  key={generatedImage}
                  imageUrl={generatedImage}
                  plan={userPlan}
                  isAdmin={isAdmin}
                  standardVideosUsed={standardVideosUsed}
                  onProcessingChange={setIsVideoProcessing}
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
              <img
                src={fullViewSrc}
                alt="Full view"
                className="w-full rounded-2xl"
                style={{ border: `1px solid ${W.border}` }}
              />
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
                  style={{
                    background: "rgba(0,0,0,0.6)",
                    border: `1px solid ${W.border}`,
                  }}
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
