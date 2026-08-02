"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Crown, Layers, Lock, Search, Sparkles, X } from "lucide-react";
import {
  TEMPLATE_CATEGORIES, TEMPLATES, getTemplatesByCategory,
  type Template, type TemplateCategory,
} from "@/lib/templates-data";
import { toast } from "sonner";
import { FeaturedCarousel } from "@/components/templates/featured-carousel";

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

export default function TemplatesPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<TemplateCategory>("all");
  const [search, setSearch] = useState("");
  const [preview, setPreview] = useState<Template | null>(null);

  useEffect(() => {
    document.body.style.overflow = preview ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [preview]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) { if (e.key === "Escape") setPreview(null); }
    if (preview) document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [preview]);

  const filtered = getTemplatesByCategory(activeCategory).filter((t) => {
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
    router.push(`/generate?template=${tpl.id}`);
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

        {/* Category filters */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          {TEMPLATE_CATEGORIES.map((cat) => {
            const count = cat.id === "all" ? TEMPLATES.length : TEMPLATES.filter((t) => t.category === cat.id).length;
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
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center text-center py-20">
            <Search className="w-10 h-10 mb-3" style={{ color: W.dim }} />
            <p className="text-sm font-semibold mb-1" style={{ color: W.muted }}>No templates match &ldquo;{search}&rdquo;</p>
            <button onClick={() => setSearch("")} className="text-xs hover:underline mt-2" style={{ color: W.red }}>Clear search</button>
          </div>
        ) : (
          <FeaturedCarousel items={filtered} onSelect={(tpl) => setPreview(tpl)} />
        )}

        <p className="text-[11px] text-center mt-6" style={{ color: W.dim }}>
          {filtered.length} of {TEMPLATES.length} templates · 3 require Pro plan
        </p>
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
              className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto no-scrollbar rounded-3xl shadow-2xl z-10"
              style={{ background: "#0d0303", border: `1px solid ${W.border}` }}
            >
              {/* Cover */}
              <div className="relative aspect-[16/7] overflow-hidden" style={{ background: W.glass }}>
                <Image src={`https://picsum.photos/seed/${preview.coverSeed}/800/350`} alt={preview.name} fill sizes="(max-width: 768px) 100vw, 672px" className="object-cover" />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 0%, #0d0303 100%)" }} />
                <button onClick={() => setPreview(null)} aria-label="Close"
                  className="absolute top-3 right-3 w-9 h-9 rounded-xl backdrop-blur-sm flex items-center justify-center transition-colors"
                  style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
                >
                  <X className="w-4 h-4" />
                </button>
                {preview.isPro && (
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/70 backdrop-blur-md" style={{ border: "1px solid rgba(251,191,36,0.4)" }}>
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-xs font-bold text-amber-400">Pro Template</span>
                  </div>
                )}
              </div>

              {/* Body */}
              <div className="px-6 pb-6 -mt-2">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h2 id="template-modal-title" className="text-xl font-black tracking-tight" style={{ color: W.text }}>{preview.name}</h2>
                    <p className="text-sm mt-0.5" style={{ color: W.muted }}>{preview.description}</p>
                  </div>
                  <span className="mt-1 shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full"
                    style={{ background: `${preview.accentColor}20`, color: preview.accentColor, border: `1px solid ${preview.accentColor}35` }}>
                    {preview.category}
                  </span>
                </div>

                {/* Preview gallery */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[preview.coverSeed, ...preview.previewSeeds].slice(0, 3).map((seed, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden" style={{ background: W.glass }}>
                      <Image src={`https://picsum.photos/seed/${seed}/200/200`} alt="" fill sizes="200px" className="object-cover" />
                    </div>
                  ))}
                </div>

                {/* Prompt */}
                <div className="mb-5 p-3 rounded-xl" style={{ background: W.glass, border: `1px solid ${W.border}` }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: W.dim }}>Prompt Applied</p>
                  <p className="text-xs leading-relaxed font-mono" style={{ color: W.muted }}>…{preview.prompt}</p>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {preview.tags.map((tag) => (
                    <span key={tag} className="text-xs rounded-lg px-2.5 py-1 font-medium"
                      style={{ background: W.glass, border: `1px solid ${W.border}`, color: W.muted }}>
                      {tag}
                    </span>
                  ))}
                </div>

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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
