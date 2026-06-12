"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check, Copy, Download, Hash, ImagePlus, Layers, MessageSquareText,
  RefreshCw, Sparkles, TrendingUp, X, Zap,
} from "lucide-react";
import { MOCK_GENERATIONS } from "@/lib/mock-data";
import { toast } from "sonner";

const W = {
  bg: "#0f0404",
  card: "#120404",
  text: "rgba(255,255,255,0.88)",
  muted: "rgba(255,255,255,0.45)",
  dim: "rgba(255,255,255,0.28)",
  border: "rgba(255,255,255,0.09)",
  glass: "rgba(255,255,255,0.05)",
  glassDim: "rgba(255,255,255,0.03)",
  red: "#f87171",
  redBg: "rgba(220,38,38,0.12)",
  redBorder: "rgba(220,38,38,0.35)",
};

const PLATFORMS = [
  { id: "instagram", label: "Instagram", icon: "📸", maxChars: 2200, hashtagTip: "11–30 hashtags" },
  { id: "facebook", label: "Facebook", icon: "👥", maxChars: 63206, hashtagTip: "2–5 hashtags" },
  { id: "twitter", label: "Twitter / X", icon: "🐦", maxChars: 280, hashtagTip: "1–2 hashtags" },
  { id: "linkedin", label: "LinkedIn", icon: "💼", maxChars: 3000, hashtagTip: "3–5 hashtags" },
  { id: "pinterest", label: "Pinterest", icon: "📌", maxChars: 500, hashtagTip: "5–20 hashtags" },
  { id: "tiktok", label: "TikTok", icon: "🎵", maxChars: 2200, hashtagTip: "5–10 hashtags" },
] as const;
type PlatformId = (typeof PLATFORMS)[number]["id"];

const TONES = [
  { id: "luxury", label: "Luxury Brand", emoji: "💎", desc: "Aspirational, premium positioning" },
  { id: "professional", label: "Professional", emoji: "🏢", desc: "Authoritative and trustworthy" },
  { id: "casual", label: "Casual", emoji: "😊", desc: "Friendly and approachable" },
  { id: "trendy", label: "Trendy", emoji: "🔥", desc: "Current, energetic, youthful" },
  { id: "sales", label: "Sales Focused", emoji: "🛒", desc: "Urgency-driven, conversion first" },
] as const;
type ToneId = (typeof TONES)[number]["id"];

const CAPTION_BANK: Record<PlatformId, Record<ToneId, (product: string) => string[]>> = {
  instagram: {
    luxury: (p) => [
      `✨ Introducing: ${p}\n\nCrafted for those who appreciate the extraordinary. Every detail, meticulously considered. Every moment, elevated.\n\n#LuxuryLifestyle #PremiumQuality #Editorial #Elevated #NewArrival`,
      `Where precision meets artistry. 🖤\n\n${p} — the new standard.\n\n#Luxury #Craftsmanship #Premium #HighEnd #MustHave`,
      `Some things speak for themselves.\n\n${p} ✦\n\nAvailable now — shop the link in bio.\n\n#PremiumBrand #Luxury #Style #Aesthetic`,
    ],
    professional: (p) => [
      `Proud to introduce ${p}.\n\nEngineered for performance. Built to last. This is what quality looks like.\n\n#Innovation #Quality #Professional #Excellence`,
      `Our latest: ${p}. Precision-crafted with premium materials to deliver exceptional results.\n\nLearn more → link in bio\n\n#Product #Brand #Quality`,
    ],
    casual: (p) => [
      `okay we're obsessed 😍 introducing ${p}\n\nseriously can't stop staring at this one!! ✨ drop a 🙋 if you want it!\n\n#NewDrop #Obsessed #MustHave #Faves`,
      `plot twist: your new fave just dropped 🙌\n\n${p} is HERE and we're not okay 🥹\n\n#NewArrivals #Cute #Love`,
    ],
    trendy: (p) => [
      `POV: You just found the most aesthetic ${p} in existence 🤩✨\n\nMain character energy only 💅\n\n#fyp #aesthetic #trendy #viral #ShopNow`,
      `This dropped and the internet is NOT ready 🔥\n\n${p} — link in bio before it sells out!\n\n#NewDrop #Trending #Viral`,
    ],
    sales: (p) => [
      `⚡ LIMITED STOCK — Don't miss out!\n\n${p} is selling FAST. Get yours before it's gone.\n\n✅ Free shipping over $50\n✅ 30-day returns\n✅ 5-star quality\n\n👉 Shop link in bio\n\n#SaleAlert #LimitedEdition #GetItNow`,
      `🛒 SHOP NOW: ${p}\n\n⏰ Offer ends soon! Only a few left.\n\n#FlashSale #HurryUp #ShopNow`,
    ],
  },
  facebook: {
    luxury: (p) => [`We're thrilled to present ${p} — a masterpiece of form and function.\n\nFor those who demand only the best, this is the one. Click to explore the full collection.\n\n#LuxuryBrand #NewArrival`],
    professional: (p) => [`Excited to share our newest addition: ${p}.\n\nDesigned with precision and built to perform, this product represents our commitment to excellence. Visit our store to learn more.\n\n→ [Link]`],
    casual: (p) => [`Hey everyone! We just dropped something really exciting — meet ${p}! 🎉\n\nWe've been working so hard on this and can't wait for you all to try it. Drop your questions in the comments! ❤️`],
    trendy: (p) => [`Everyone's talking about ${p} and honestly… the hype is real 🔥\n\nDon't be the last one to know. Shop it now before it's gone!\n\n#Trending #HotRightNow`],
    sales: (p) => [`🚨 LIMITED TIME OFFER 🚨\n\n${p} is now available — and selling out FAST.\n\n✅ Free shipping over $50\n✅ 30-day returns\n✅ Secure checkout\n\nClaim yours now → [Link]`],
  },
  twitter: {
    luxury: (p) => [`Luxury redefined.\n\n${p} — now available. 🖤\n\n#NewDrop #Luxury`, `Some things are worth waiting for.\n\n${p} is here. → [link] ✨`],
    professional: (p) => [`Introducing ${p}. Precision-crafted for the ones who care about quality.\n\nLearn more → [link] #ProductLaunch`],
    casual: (p) => [`okay ${p} just dropped and it's SO good 😭 link → [link] #MustHave`],
    trendy: (p) => [`${p} just hit different 🔥 link in bio #fyp #viral`, `we made ${p} and you're gonna love it 💀 → [link]`],
    sales: (p) => [`⚡ FLASH SALE: ${p} — limited stock, grab it now → [link] #Sale`],
  },
  linkedin: {
    luxury: (p) => [`Excited to announce the launch of ${p}.\n\nThis product represents months of careful development and embodies our commitment to craftsmanship and quality. Every detail has been thoughtfully designed.\n\nWe'd love to hear your thoughts. 👇\n\n#ProductLaunch #Innovation #Luxury`],
    professional: (p) => [`I'm proud to share our latest product: ${p}.\n\nAfter extensive testing and refinement, we've created something that delivers real results. Check the link for the full breakdown.\n\n#B2B #ProductLaunch #Ecommerce`],
    casual: (p) => [`Really excited about this one — we just launched ${p}! 🎉\n\nBuilding this was a journey. Would love to connect with anyone in the space!\n\n#NewProduct #Startup`],
    trendy: (p) => [`The market was asking for something new. We built ${p}.\n\nAre you ready? 🚀\n\n#Disruption #Innovation #ProductLaunch`],
    sales: (p) => [`Launching today: ${p}.\n\nFor businesses looking to elevate their brand: this is it.\n\n→ Early-bird pricing available this week only.\n\n#B2B #SaaS #Ecommerce #Deal`],
  },
  pinterest: {
    luxury: (p) => [`${p} | Luxury Edition | Premium Materials | Shop the Collection | #Luxury #Style #Aesthetic #Curated #Premium`],
    professional: (p) => [`${p} | Professional Grade | Built to Last | Expert Quality | #Product #Design #Quality #Brand`],
    casual: (p) => [`${p} 😍 | so obsessed | shop it! | #MustHave #Faves #Inspo #Style`],
    trendy: (p) => [`${p} | Trending Now | aesthetic | viral | shop → | #Aesthetic #Trending #Viral`],
    sales: (p) => [`${p} | LIMITED STOCK | Free Shipping | 30-Day Returns | Shop Now | #Sale #Deal #ShopNow`],
  },
  tiktok: {
    luxury: (p) => [`POV: you finally found the most luxurious ${p} ✨🖤 #luxury #aesthetic #fyp #viral`, `the ${p} girlies will understand 💅✨ #luxury #premium #fyp`],
    professional: (p) => [`why ${p} is worth every penny 🙌 #product #review #fyp #quality`],
    casual: (p) => [`okay but this ${p} tho 😍😍😍 #fyp #obsessed #musthave`, `not me talking about ${p} for the 5th time this week 💀 #fyp`],
    trendy: (p) => [`${p} just dropped and I'm not okay 🔥 #fyp #viral #newdrop #trendy`, `the ${p} era has started and we're ALL invited 💅 #fyp #trend`],
    sales: (p) => [`🚨 ${p} is on SALE and almost GONE 🚨 shop fast!! #fyp #sale #deal #hurry`],
  },
};

const HASHTAG_SETS: Record<PlatformId, Record<string, string[]>> = {
  instagram: {
    luxury: ["#LuxuryBrand", "#Premium", "#Craftsmanship", "#Editorial", "#Aesthetic", "#HighEnd", "#MinimalistStyle", "#BlackAndGold", "#PremiumQuality", "#ElevatedLiving"],
    product: ["#ProductPhotography", "#NewArrivals", "#ShopNow", "#OnlineShop", "#Ecommerce", "#ProductLaunch", "#MustHave", "#ForYou", "#Trending"],
    brand: ["#SmallBusiness", "#BrandStory", "#ShopSmall", "#MadeWithLove", "#Authentic", "#Handcrafted"],
  },
  facebook: { general: ["#NewProduct", "#ShopNow", "#Exclusive"] },
  twitter: { general: ["#NewDrop", "#MustHave", "#Shop"] },
  linkedin: { professional: ["#ProductLaunch", "#Innovation", "#Ecommerce", "#B2B", "#StartupLife"] },
  pinterest: { style: ["#Style", "#Inspiration", "#Aesthetic", "#Curated", "#MoodBoard"] },
  tiktok: { viral: ["#fyp", "#foryou", "#viral", "#trending", "#aesthetic", "#NewDrop", "#MustHave", "#GenZ"] },
};

const ALL_IMAGES = MOCK_GENERATIONS.flatMap((g) =>
  g.images.map((src, i) => ({ src, seed: src.split("/seed/")[1]?.split("/")[0] ?? `img${i}`, promptPreview: g.prompt.slice(0, 50) }))
);

export default function StudioPage() {
  const [selectedImageIdx, setSelectedImageIdx] = useState<number | null>(null);
  const [platform, setPlatform] = useState<PlatformId>("instagram");
  const [tone, setTone] = useState<ToneId>("luxury");
  const [productName, setProductName] = useState("");
  const [genStatus, setGenStatus] = useState<"idle" | "generating" | "done">("idle");
  const [captions, setCaptions] = useState<string[]>([]);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [copiedCaptionIdx, setCopiedCaptionIdx] = useState<number | null>(null);
  const [hashtagsCopied, setHashtagsCopied] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  const selectedImage = selectedImageIdx !== null ? ALL_IMAGES[selectedImageIdx] : null;
  const activePlatform = PLATFORMS.find((p) => p.id === platform)!;
  const activeTone = TONES.find((t) => t.id === tone)!;

  function generate() {
    if (!selectedImage && !uploadedImage) { toast.error("Select or upload an image first."); return; }
    const name = productName.trim() || selectedImage?.promptPreview?.split(" ").slice(0, 3).join(" ") || "this product";
    setGenStatus("generating");
    setTimeout(() => {
      const allCaptions = CAPTION_BANK[platform][tone](name);
      setCaptions(allCaptions);
      const hashBank = HASHTAG_SETS[platform];
      const allTags = Object.values(hashBank).flat();
      setHashtags(allTags.sort(() => Math.random() - 0.5).slice(0, activePlatform.id === "tiktok" ? 8 : activePlatform.id === "instagram" ? 25 : 5));
      setGenStatus("done");
      toast.success("Captions generated!");
    }, 1600);
  }

  function copyCaption(text: string, idx: number) {
    navigator.clipboard.writeText(text);
    setCopiedCaptionIdx(idx);
    toast.success("Caption copied!");
    setTimeout(() => setCopiedCaptionIdx(null), 2000);
  }

  function copyHashtags() {
    navigator.clipboard.writeText(hashtags.join(" "));
    setHashtagsCopied(true);
    toast.success("Hashtags copied!");
    setTimeout(() => setHashtagsCopied(false), 2000);
  }

  function copyAll(captionText: string) {
    navigator.clipboard.writeText(`${captionText}\n\n${hashtags.join(" ")}`);
    toast.success("Full post copied to clipboard!");
  }

  return (
    <div className="h-full flex flex-col lg:flex-row overflow-hidden" style={{ background: W.bg }}>

      {/* ══ LEFT PANEL ═════════════════════════════════════════════════ */}
      <div className="h-[52vh] lg:h-auto lg:w-[360px] xl:w-[400px] shrink-0 flex flex-col overflow-y-auto"
        style={{ borderBottom: "1px solid transparent", borderRight: `1px solid ${W.border}` }}>

        <div className="px-5 pt-5 pb-4 shrink-0" style={{ borderBottom: `1px solid ${W.border}` }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)" }}>
              <MessageSquareText className="w-4 h-4" style={{ color: "#a78bfa" }} />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight" style={{ color: W.text }}>Content Studio</h1>
              <p className="text-xs" style={{ color: W.muted }}>Social media captions, hashtags &amp; copy</p>
            </div>
          </div>
        </div>

        <div className="flex-1 px-4 py-4 space-y-5 overflow-y-auto">

          {/* Step 1 — Image selection */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2.5 flex items-center gap-1.5" style={{ color: W.dim }}>
              <Layers className="w-3 h-3" /> Step 1 — Select image
            </p>
            <div className="grid grid-cols-4 gap-1.5 mb-2">
              {ALL_IMAGES.slice(0, 8).map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImageIdx(i)}
                  className="relative aspect-square rounded-xl overflow-hidden transition-all"
                  style={{
                    outline: selectedImageIdx === i ? "2px solid #f87171" : `1px solid ${W.border}`,
                    outlineOffset: selectedImageIdx === i ? "1px" : "0",
                    opacity: selectedImageIdx === i ? 1 : 0.6,
                    transform: selectedImageIdx === i ? "scale(1.05)" : "scale(1)",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.src} alt="" className="w-full h-full object-cover" />
                  {selectedImageIdx === i && (
                    <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(220,38,38,0.2)" }}>
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            {uploadedImage ? (
              <div className="flex items-center gap-2 p-2 rounded-xl" style={{ border: `1px solid ${W.redBorder}`, background: W.redBg }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={uploadedImage} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                <p className="text-xs flex-1 min-w-0 truncate" style={{ color: W.muted }}>Custom upload</p>
                <button onClick={() => setUploadedImage(null)} className="shrink-0 transition-colors" style={{ color: W.muted }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = W.text)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = W.muted)}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all"
                style={{ border: `1px dashed ${W.border}`, background: W.glassDim }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = W.redBorder; e.currentTarget.style.background = W.redBg; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = W.border; e.currentTarget.style.background = W.glassDim; }}
              >
                <ImagePlus className="w-4 h-4 shrink-0" style={{ color: W.muted }} />
                <span className="text-xs" style={{ color: W.muted }}>Or upload your own image</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setSelectedImageIdx(null); setUploadedImage(URL.createObjectURL(f)); } }} />
              </label>
            )}
          </div>

          {/* Step 2 — Product name */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2.5 flex items-center gap-1.5" style={{ color: W.dim }}>
              <Sparkles className="w-3 h-3" /> Step 2 — Product name
            </p>
            <input
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g. Lumière Serum, Air Max 95…"
              className="w-full h-10 px-3 rounded-xl text-sm outline-none transition-all"
              style={{ border: `1px solid ${W.border}`, background: W.glass, color: W.text }}
              onFocus={(e) => { e.currentTarget.style.borderColor = W.redBorder; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(220,38,38,0.08)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = W.border; e.currentTarget.style.boxShadow = "none"; }}
            />
          </div>

          {/* Step 3 — Platform */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2.5 flex items-center gap-1.5" style={{ color: W.dim }}>
              <TrendingUp className="w-3 h-3" /> Step 3 — Platform
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {PLATFORMS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { setPlatform(p.id); setGenStatus("idle"); }}
                  className="flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl text-center transition-all"
                  style={platform === p.id
                    ? { border: `1px solid ${W.redBorder}`, background: W.redBg, color: W.red }
                    : { border: `1px solid ${W.border}`, background: W.glassDim, color: W.muted }}
                  onMouseEnter={(e) => { if (platform !== p.id) { e.currentTarget.style.background = W.glass; e.currentTarget.style.color = W.text; } }}
                  onMouseLeave={(e) => { if (platform !== p.id) { e.currentTarget.style.background = W.glassDim; e.currentTarget.style.color = W.muted; } }}
                >
                  <span className="text-base leading-none">{p.icon}</span>
                  <span className="text-[10px] font-semibold leading-none">{p.label.split("/")[0]}</span>
                </button>
              ))}
            </div>
            <p className="text-[10px] mt-1.5 flex items-center gap-1" style={{ color: W.dim }}>
              <Hash className="w-3 h-3" />
              {activePlatform.hashtagTip} recommended
            </p>
          </div>

          {/* Step 4 — Tone */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2.5 flex items-center gap-1.5" style={{ color: W.dim }}>
              <Zap className="w-3 h-3" /> Step 4 — Tone
            </p>
            <div className="space-y-1.5">
              {TONES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => { setTone(t.id); setGenStatus("idle"); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left"
                  style={tone === t.id
                    ? { border: `1px solid ${W.redBorder}`, background: W.redBg }
                    : { border: `1px solid ${W.border}`, background: W.glassDim }}
                  onMouseEnter={(e) => { if (tone !== t.id) { e.currentTarget.style.background = W.glass; } }}
                  onMouseLeave={(e) => { if (tone !== t.id) { e.currentTarget.style.background = W.glassDim; } }}
                >
                  <span className="text-base shrink-0">{t.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold leading-none" style={{ color: tone === t.id ? W.red : W.text }}>{t.label}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: W.muted }}>{t.desc}</p>
                  </div>
                  {tone === t.id && <Check className="w-3.5 h-3.5 shrink-0" style={{ color: W.red }} />}
                </button>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <div className="pb-2">
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: "0 0 32px rgba(220,38,38,0.4)" }}
              whileTap={{ scale: 0.98 }}
              disabled={genStatus === "generating"}
              onClick={generate}
              className="w-full h-11 rounded-full text-white font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60"
              style={{ background: "#dc2626", boxShadow: "0 0 18px rgba(220,38,38,0.22)" }}
            >
              {genStatus === "generating" ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Writing captions…</>
              ) : (
                <><Sparkles className="w-4 h-4" />{genStatus === "done" ? "Regenerate" : "Generate Captions"}</>
              )}
            </motion.button>
          </div>
        </div>
      </div>

      {/* ══ RIGHT PANEL ════════════════════════════════════════════════ */}
      <div className="flex-1 overflow-y-auto min-h-0 px-5 py-5">
        <AnimatePresence mode="wait">

          {genStatus === "generating" && (
            <motion.div key="generating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center h-60 gap-4">
              <div className="relative w-16 h-16">
                <motion.div
                  className="absolute inset-0 rounded-full border-2"
                  style={{ borderColor: "rgba(220,38,38,0.2)", borderTopColor: "#dc2626" }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <div className="absolute inset-3 rounded-full flex items-center justify-center" style={{ background: W.redBg }}>
                  <MessageSquareText className="w-5 h-5" style={{ color: W.red }} />
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold mb-1" style={{ color: W.text }}>Writing your captions…</p>
                <p className="text-xs" style={{ color: W.muted }}>{activePlatform.label} · {activeTone.label} tone</p>
              </div>
            </motion.div>
          )}

          {genStatus === "idle" && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex flex-col items-center text-center py-10">
                <div className="relative w-20 h-20 flex items-center justify-center mb-5">
                  <motion.div
                    className="absolute inset-0 rounded-2xl"
                    style={{ border: "1px solid rgba(139,92,246,0.2)" }}
                    animate={{ rotate: [0, 5, 0, -5, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center z-10" style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)" }}>
                    <MessageSquareText className="w-7 h-7" style={{ color: "rgba(167,139,250,0.7)" }} />
                  </div>
                </div>
                <p className="text-base font-bold mb-2" style={{ color: W.text }}>Ready to write your captions</p>
                <p className="text-sm max-w-xs leading-relaxed" style={{ color: W.muted }}>Select an image, enter your product name, pick a platform and tone, then hit Generate.</p>
              </div>

              {/* Platform quick info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPlatform(p.id)}
                    className="flex items-center gap-3 p-3 rounded-xl transition-all text-left"
                    style={platform === p.id
                      ? { border: `1px solid ${W.redBorder}`, background: W.redBg }
                      : { border: `1px solid ${W.border}`, background: W.glassDim }}
                    onMouseEnter={(e) => { if (platform !== p.id) e.currentTarget.style.background = W.glass; }}
                    onMouseLeave={(e) => { if (platform !== p.id) e.currentTarget.style.background = W.glassDim; }}
                  >
                    <span className="text-xl shrink-0">{p.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold" style={{ color: platform === p.id ? W.red : W.text }}>{p.label}</p>
                      <p className="text-[10px]" style={{ color: W.dim }}>{p.hashtagTip}</p>
                    </div>
                    {platform === p.id && <Check className="w-3.5 h-3.5 shrink-0" style={{ color: W.red }} />}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {genStatus === "done" && (
            <motion.div key="done" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {/* Header */}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: W.muted }}>
                  {captions.length} captions · {activePlatform.icon} {activePlatform.label} · {activeTone.emoji} {activeTone.label}
                </p>
                <button onClick={generate} className="ml-auto flex items-center gap-1 text-[10px] transition-colors" style={{ color: W.dim }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = W.text)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = W.dim)}
                >
                  <RefreshCw className="w-3 h-3" />
                  Regenerate
                </button>
              </div>

              {/* Selected image */}
              {(selectedImage || uploadedImage) && (
                <div className="flex items-center gap-3 p-3 rounded-xl mb-5" style={{ border: `1px solid ${W.border}`, background: W.glassDim }}>
                  <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={uploadedImage || selectedImage?.src || ""} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ color: W.text }}>{productName || selectedImage?.promptPreview || "Product image"}</p>
                    <p className="text-[10px]" style={{ color: W.dim }}>{activePlatform.label} · {activeTone.label}</p>
                  </div>
                </div>
              )}

              {/* Captions */}
              <div className="space-y-3 mb-6">
                {captions.map((caption, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="group relative rounded-2xl p-4"
                    style={{ border: `1px solid ${W.border}`, background: W.glassDim }}
                  >
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <span className="text-sm">{activePlatform.icon}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: W.dim }}>Version {i + 1}</span>
                      <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-md font-medium"
                        style={caption.length > activePlatform.maxChars
                          ? { background: "rgba(220,38,38,0.2)", color: "#f87171" }
                          : { background: W.glass, color: W.dim }}>
                        {caption.length} chars
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: W.muted }}>{caption}</p>
                    <div className="flex gap-2 mt-3 pt-3" style={{ borderTop: `1px solid ${W.border}` }}>
                      <button
                        onClick={() => copyCaption(caption, i)}
                        className="h-7 text-[11px] px-2.5 rounded-lg flex items-center gap-1.5 transition-all"
                        style={{ color: W.muted }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = W.glass; e.currentTarget.style.color = W.text; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = W.muted; }}
                      >
                        {copiedCaptionIdx === i ? <><Check className="w-3 h-3 text-emerald-400" />Copied</> : <><Copy className="w-3 h-3" />Copy caption</>}
                      </button>
                      <button
                        onClick={() => copyAll(caption)}
                        className="h-7 text-[11px] px-2.5 rounded-lg flex items-center gap-1.5 transition-all ml-auto"
                        style={{ color: W.muted }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = W.glass; e.currentTarget.style.color = W.text; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = W.muted; }}
                      >
                        <Download className="w-3 h-3" />Copy full post
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Hashtag section */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-2xl p-4"
                style={{ border: `1px solid ${W.border}`, background: W.glassDim }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Hash className="w-4 h-4" style={{ color: W.red }} />
                  <p className="text-sm font-bold flex-1" style={{ color: W.text }}>Hashtag Pack</p>
                  <span className="text-[10px] rounded-md px-1.5 py-0.5 font-medium" style={{ background: W.glass, color: W.dim }}>{hashtags.length} tags</span>
                  <button
                    onClick={copyHashtags}
                    className="h-7 text-[11px] px-2.5 rounded-lg flex items-center gap-1 transition-all"
                    style={{ color: W.muted }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = W.glass; e.currentTarget.style.color = W.text; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = W.muted; }}
                  >
                    {hashtagsCopied ? <><Check className="w-3 h-3 text-emerald-400" />Copied!</> : <><Copy className="w-3 h-3" />Copy all</>}
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {hashtags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => { navigator.clipboard.writeText(tag); toast.success("Tag copied!"); }}
                      className="text-[11px] font-medium px-2.5 py-1 rounded-lg transition-colors"
                      style={{ background: W.redBg, border: `1px solid ${W.redBorder}`, color: W.red }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(220,38,38,0.2)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = W.redBg)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] mt-2" style={{ color: W.dim }}>Click any hashtag to copy individually</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
