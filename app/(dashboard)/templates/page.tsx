"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Crown, Layers, Lock, Search, Sparkles, X } from "lucide-react";
import {
  PRODUCTION_CATEGORIES, UNIVERSAL_CATEGORIES, CAMPAIGN_CATEGORIES, VIDEO_CATEGORIES,
  getTemplatesByCategory, type Template, type TemplateType,
} from "@/lib/templates-data";
import { useTemplates } from "@/lib/hooks/use-templates";
import { toast } from "sonner";
import { FeaturedCarousel } from "@/components/templates/featured-carousel";
import { isPlanAtLeast, type Plan } from "@/lib/plans";

const W = {
  bg: "#0f0404",
  card: "#120404",
  cardHover: "#160505",
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

const TYPES: { id: TemplateType; label: string; hint: string }[] = [
  { id: "production", label: "Production", hint: "For your product photos" },
  { id: "universal", label: "Universal", hint: "For your own photos" },
  { id: "campaign", label: "Campaign", hint: "Full brand ad scenes" },
  { id: "video", label: "Video", hint: "Motion for the video generator" },
];

// useSearchParams needs a Suspense boundary under the App Router — same
// pattern the video generator page uses for its own ?template= deep link.
export default function TemplatesPage() {
  return (
    <Suspense fallback={<div className="h-full" style={{ background: "#0f0404" }} />}>
      <TemplatesPageInner />
    </Suspense>
  );
}

function TemplatesPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { templates, loading, error, refetch } = useTemplates({ authenticated: true });
  const requestedType = searchParams.get("type");
  const [activeType, setActiveType] = useState<TemplateType>(
    requestedType === "video" || requestedType === "campaign" || requestedType === "universal" ? requestedType : "production"
  );
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [preview, setPreview] = useState<Template | null>(null);
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

  const canBrowseVideo = isAdmin || isPlanAtLeast(userPlan, "basic");

  // Landing page's video template cards deep-link here with a specific
  // template id — open its preview automatically instead of leaving the
  // visitor to find it again in the grid themselves. Skipped for a video
  // template on a Free plan — the locked-tab state above is the right thing
  // to see, not a preview modal offering a template they can't use yet.
  useEffect(() => {
    const requestedTemplateId = searchParams.get("template");
    if (!requestedTemplateId || templates.length === 0) return;
    const match = templates.find((t) => t.id === requestedTemplateId);
    if (match && (match.templateType !== "video" || canBrowseVideo)) setPreview(match);
  }, [searchParams, templates, canBrowseVideo]);

  const categories =
    activeType === "production" ? PRODUCTION_CATEGORIES
    : activeType === "campaign" ? CAMPAIGN_CATEGORIES
    : activeType === "video" ? VIDEO_CATEGORIES
    : UNIVERSAL_CATEGORIES;
  const byType = templates.filter((t) => t.templateType === activeType);

  useEffect(() => {
    document.body.style.overflow = preview ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [preview]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) { if (e.key === "Escape") setPreview(null); }
    if (preview) document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [preview]);

  const filtered = getTemplatesByCategory(byType, activeCategory).filter((t) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  });

  function applyTemplate(tpl: Template) {
    toast.success(`Template applied: ${tpl.name}`);
    // Video templates are motion prompts for the video generator — sending
    // them to /generate would drop the prompt into the image pipeline.
    const destination = tpl.templateType === "video" ? "/tools/image-to-video" : "/generate";
    router.push(`${destination}?template=${tpl.id}`);
  }

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: W.bg }}>

      {/* Header */}
      <div className="px-5 pt-3 pb-3 shrink-0" style={{ borderBottom: `1px solid ${W.border}` }}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: W.redBg, border: `1px solid ${W.redBorder}` }}>
                <Layers className="w-3.5 h-3.5" style={{ color: W.red }} />
              </div>
              <h1 className="text-sm font-semibold" style={{ color: W.text }}>Templates</h1>
            </div>
            <p className="text-[11px] ml-9" style={{ color: W.muted }}>
              Professional visual styles — click any template to instantly apply it.
            </p>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: W.dim }} />
            <input
              placeholder="Search templates…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-8 pl-9 pr-8 rounded-lg text-xs outline-none transition-all"
              style={{
                background: W.glass,
                border: `1px solid ${W.border}`,
                color: W.text,
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = W.redBorder; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(220,38,38,0.08)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = W.border; e.currentTarget.style.boxShadow = "none"; }}
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 transition-colors" style={{ color: W.dim }}
                onMouseEnter={(e) => (e.currentTarget.style.color = W.text)}
                onMouseLeave={(e) => (e.currentTarget.style.color = W.dim)}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Type toggle */}
        <div className="flex gap-1.5 mb-2.5">
          {TYPES.map((t) => {
            const isActive = activeType === t.id;
            const count = templates.filter((tpl) => tpl.templateType === t.id).length;
            return (
              <button
                key={t.id}
                onClick={() => { setActiveType(t.id); setActiveCategory("all"); }}
                className="flex-1 sm:flex-none flex flex-col items-start px-3.5 py-1.5 rounded-xl transition-all"
                style={isActive
                  ? { border: `1px solid ${W.redBorder}`, background: W.redBg }
                  : { border: `1px solid ${W.border}`, background: W.glassDim }}
              >
                <span className="text-xs font-bold flex items-center gap-1.5" style={{ color: isActive ? W.red : W.text }}>
                  {t.label}
                  <span className="text-[9px] rounded-full px-1.5 py-0.5 font-bold" style={{ background: W.glass, color: W.dim }}>{count}</span>
                </span>
                <span className="text-[10px]" style={{ color: W.dim }}>{t.hint}</span>
              </button>
            );
          })}
        </div>

        {/* Category filters */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          {categories.map((cat) => {
            const count = cat.id === "all" ? byType.length : byType.filter((t) => t.category === cat.id).length;
            const isActive = activeCategory === cat.id;
            return (
              <motion.button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                whileTap={{ scale: 0.96 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0"
                style={isActive
                  ? { border: `1px solid ${W.redBorder}`, background: W.redBg, color: W.red }
                  : { border: `1px solid ${W.border}`, background: W.glassDim, color: W.muted }}
                onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = W.glass; e.currentTarget.style.color = W.text; } }}
                onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = W.glassDim; e.currentTarget.style.color = W.muted; } }}
              >
                <span>{cat.label}</span>
                <span className="text-[10px] rounded-full px-1.5 py-0.5 font-bold"
                  style={isActive ? { background: "rgba(220,38,38,0.25)", color: W.red } : { background: W.glass, color: W.dim }}>
                  {count}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Carousel */}
      <div className="flex-1 overflow-y-auto py-4">
        {activeType === "video" && !canBrowseVideo ? (
          // Video templates need at least Basic — shown here, before anyone
          // uploads a photo, rather than only failing later at generate time.
          <div className="flex flex-col items-center text-center py-20 px-6">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-3" style={{ background: W.redBg, border: `1px solid ${W.redBorder}` }}>
              <Lock className="w-5 h-5" style={{ color: W.red }} />
            </div>
            <p className="text-sm font-bold" style={{ color: W.text }}>Video templates need Basic or Pro</p>
            <p className="text-xs mt-1 max-w-xs" style={{ color: W.muted }}>
              Upgrade to bring your product photos to life with AI-generated motion.
            </p>
            <button
              onClick={() => { window.location.href = "/account"; }}
              className="mt-4 h-9 px-4 rounded-lg text-xs font-bold text-white"
              style={{ background: "#dc2626" }}
            >
              Upgrade plan
            </button>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: W.border, borderTopColor: W.red }} />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center text-center py-20">
            <p className="text-sm font-semibold mb-3" style={{ color: W.muted }}>Couldn&apos;t load templates.</p>
            <button onClick={refetch} className="text-xs hover:underline" style={{ color: W.red }}>Try again</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center text-center py-20">
            <Search className="w-10 h-10 mb-3" style={{ color: W.dim }} />
            <p className="text-sm font-semibold mb-1" style={{ color: W.muted }}>No templates match &ldquo;{search}&rdquo;</p>
            <button onClick={() => setSearch("")} className="text-xs hover:underline mt-2" style={{ color: W.red }}>Clear search</button>
          </div>
        ) : (
          <FeaturedCarousel items={filtered} onSelect={(tpl) => setPreview(tpl)} />
        )}

        {!loading && (
          <p className="text-[11px] text-center mt-6" style={{ color: W.dim }}>
            {filtered.length} of {byType.length} templates
          </p>
        )}
      </div>

      {/* Preview modal */}
      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <motion.div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setPreview(null)} />
            <motion.div
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.93, y: 16, opacity: 0 }}
              transition={{ type: "spring", stiffness: 340, damping: 28 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="template-modal-title"
              className="relative w-full max-w-4xl max-h-[90vh] md:h-[68vh] overflow-hidden rounded-3xl shadow-2xl z-10 flex flex-col md:flex-row"
              style={{ background: "#0d0303", border: `1px solid ${W.border}` }}
            >
              {/* Close sits on the modal (not the image) so it lands correctly
                  in both the stacked and side-by-side layouts. */}
              <button onClick={() => setPreview(null)} aria-label="Close"
                className="absolute top-3 right-3 z-20 w-9 h-9 rounded-xl backdrop-blur-sm flex items-center justify-center transition-colors"
                style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
              >
                <X className="w-4 h-4" />
              </button>

              {/* Image/video pane — object-contain against an accent-tinted
                  backdrop, so a square/portrait cover is shown whole rather
                  than cropped, and the leftover space reads as an intentional
                  preview mat. Fixed pane width/height on desktop means the
                  modal's own size no longer swings with each cover's aspect
                  ratio. */}
              <div
                className="relative shrink-0 md:w-[55%] md:h-full flex items-center justify-center p-3 md:p-5"
                style={{ background: `linear-gradient(155deg, ${preview.accentColor}1f 0%, #0a0202 80%)` }}
              >
                {preview.templateType === "video" && preview.previewVideoUrl ? (
                  <video
                    src={preview.previewVideoUrl}
                    poster={preview.coverImageUrl ?? undefined}
                    autoPlay muted loop playsInline preload="auto"
                    className="max-w-full max-h-[34vh] md:max-h-full object-contain rounded-xl"
                  />
                ) : preview.coverImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={preview.coverImageUrl}
                    alt={preview.name}
                    className="max-w-full max-h-[34vh] md:max-h-full object-contain rounded-xl"
                  />
                ) : (
                  <span className="text-[11px] py-16" style={{ color: W.dim }}>Preview generating…</span>
                )}
                {preview.isPro && (
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/70 backdrop-blur-md" style={{ border: "1px solid rgba(251,191,36,0.4)" }}>
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-xs font-bold text-amber-400">Pro Template</span>
                  </div>
                )}
              </div>

              {/* Details pane — scrolls internally, so the action buttons stay
                  pinned and visible no matter how long the prompt is. */}
              <div className="flex flex-col min-h-0 flex-1">
                <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 sm:px-6 pt-5 sm:pt-6">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="min-w-0">
                      <h2 id="template-modal-title" className="text-xl font-black tracking-tight" style={{ color: W.text }}>{preview.name}</h2>
                      <p className="text-sm mt-0.5" style={{ color: W.muted }}>{preview.description}</p>
                    </div>
                    <span className="mt-1 shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full"
                      style={{ background: `${preview.accentColor}20`, color: preview.accentColor, border: `1px solid ${preview.accentColor}35` }}>
                      {preview.category}
                    </span>
                  </div>

                  {/* The prompt itself is deliberately not shown while browsing —
                      it's the product's IP, and a browse surface is where it
                      would be easiest to copy out wholesale. It's applied on
                      "Use Template" and stays fully editable in the generator. */}
                  <div className="mb-4 p-3 rounded-xl flex items-start gap-2.5" style={{ background: W.glass, border: `1px solid ${W.border}` }}>
                    <Lock className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: W.dim }} />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: W.dim }}>Prompt included</p>
                      <p className="text-xs leading-relaxed" style={{ color: W.muted }}>
                        {preview.templateType === "video"
                          ? "A production-grade motion prompt is applied automatically — edit it in the video generator once your photo is added."
                          : "A production-grade prompt is applied automatically — edit it in the generator after you apply this template."}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pb-5">
                    {preview.tags.map((tag) => (
                      <span key={tag} className="text-xs rounded-lg px-2.5 py-1 font-medium"
                        style={{ background: W.glass, border: `1px solid ${W.border}`, color: W.muted }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="shrink-0 px-5 sm:px-6 py-4" style={{ borderTop: `1px solid ${W.border}` }}>
                  <div className="flex gap-2.5">
                    <button
                      onClick={() => setPreview(null)}
                      className="flex-1 h-11 rounded-xl font-semibold text-sm transition-all"
                      style={{ border: `1px solid ${W.border}`, background: W.glass, color: W.muted }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = W.glassDim; e.currentTarget.style.color = W.text; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = W.glass; e.currentTarget.style.color = W.muted; }}
                    >
                      Cancel
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => { setPreview(null); applyTemplate(preview); }}
                      className="flex-1 h-11 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all"
                      style={preview.isPro ? { background: "#f59e0b" } : { background: "#dc2626" }}
                    >
                      {preview.isPro ? (
                        <><Crown className="w-4 h-4" />Use Template</>
                      ) : (
                        <><Sparkles className="w-4 h-4" />Use Template</>
                      )}
                    </motion.button>
                  </div>

                  {preview.isPro && (
                    <p className="text-[11px] text-center mt-3 flex items-center justify-center gap-1" style={{ color: W.dim }}>
                      <Lock className="w-3 h-3" />
                      Requires Pro plan ·{" "}
                      <span className="font-semibold" style={{ color: W.muted }}>Pro plans coming soon</span>
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
