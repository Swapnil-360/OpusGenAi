"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, ChevronRight, Crown, Layers, Lock, Search, Sparkles, X } from "lucide-react";
import {
  TEMPLATE_CATEGORIES, TEMPLATES, getTemplatesByCategory,
  type Template, type TemplateCategory,
} from "@/lib/templates-data";
import { toast } from "sonner";

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
  const [hoveredId, setHoveredId] = useState<string | null>(null);

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
      <div className="px-6 pt-6 pb-4 shrink-0" style={{ borderBottom: `1px solid ${W.border}` }}>
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: W.redBg, border: `1px solid ${W.redBorder}` }}>
                <Layers className="w-4 h-4" style={{ color: W.red }} />
              </div>
              <h1 className="text-2xl font-black tracking-tight" style={{ color: W.text }}>Templates</h1>
            </div>
            <p className="text-sm ml-10.5" style={{ color: W.muted }}>
              Professional visual styles — click any template to instantly apply it to a generation.
            </p>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: W.dim }} />
            <input
              placeholder="Search templates…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-8 rounded-xl text-sm outline-none transition-all"
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
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
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

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center text-center py-20">
            <Search className="w-10 h-10 mb-3" style={{ color: W.dim }} />
            <p className="text-sm font-semibold mb-1" style={{ color: W.muted }}>No templates match &ldquo;{search}&rdquo;</p>
            <button onClick={() => setSearch("")} className="text-xs hover:underline mt-2" style={{ color: W.red }}>Clear search</button>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {filtered.map((tpl, i) => (
                <motion.div
                  key={tpl.id}
                  layout
                  initial={{ opacity: 0, y: 16, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.04, duration: 0.25 }}
                  onHoverStart={() => setHoveredId(tpl.id)}
                  onHoverEnd={() => setHoveredId(null)}
                  className="group relative flex flex-col rounded-2xl overflow-hidden cursor-pointer"
                  style={{
                    background: W.card,
                    border: hoveredId === tpl.id ? `1px solid ${tpl.accentColor}40` : `1px solid ${W.border}`,
                    boxShadow: hoveredId === tpl.id ? `0 8px 32px ${tpl.accentColor}20, 0 0 0 1px ${tpl.accentColor}25` : "none",
                    transition: "all 0.22s ease",
                  }}
                  onClick={() => setPreview(tpl)}
                >
                  {/* Cover image */}
                  <div className="relative aspect-[4/3] overflow-hidden" style={{ background: W.glass }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://picsum.photos/seed/${tpl.coverSeed}/400/300`}
                      alt={tpl.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    {tpl.isPro && (
                      <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-1 rounded-lg bg-black/70 backdrop-blur-sm" style={{ border: "1px solid rgba(251,191,36,0.35)" }}>
                        <Crown className="w-3 h-3 text-amber-400" />
                        <span className="text-[10px] font-bold text-amber-400">PRO</span>
                      </div>
                    )}

                    <div className="absolute bottom-2.5 left-2.5">
                      <span
                        className="text-[10px] font-bold px-2 py-1 rounded-lg backdrop-blur-sm"
                        style={{ background: `${tpl.accentColor}28`, color: tpl.accentColor, border: `1px solid ${tpl.accentColor}40` }}
                      >
                        {tpl.category.charAt(0).toUpperCase() + tpl.category.slice(1)}
                      </span>
                    </div>

                    <motion.div
                      initial={false}
                      animate={{ opacity: hoveredId === tpl.id ? 1 : 0 }}
                      transition={{ duration: 0.18 }}
                      className="absolute inset-0 bg-black/35 flex items-center justify-center gap-2.5"
                    >
                      <button
                        onClick={(e) => { e.stopPropagation(); setPreview(tpl); }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-xs font-semibold transition-colors"
                        style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.25)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.22)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Preview
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); applyTemplate(tpl); }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-xs font-bold transition-colors"
                        style={tpl.isPro
                          ? { background: "rgba(245,158,11,0.85)", border: "1px solid rgba(251,191,36,0.4)" }
                          : { background: "rgba(220,38,38,0.85)", border: "1px solid rgba(239,68,68,0.5)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                      >
                        {tpl.isPro ? <Lock className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                        Use this
                      </button>
                    </motion.div>
                  </div>

                  {/* Card body */}
                  <div className="px-4 py-3 flex-1 flex flex-col">
                    <div className="flex items-start gap-2 mb-1.5">
                      <p className="text-sm font-bold leading-tight flex-1" style={{ color: W.text }}>{tpl.name}</p>
                      <ChevronRight className="w-4 h-4 shrink-0 mt-0.5 transition-all group-hover:translate-x-0.5" style={{ color: W.dim }} />
                    </div>
                    <p className="text-[11px] leading-relaxed line-clamp-2 flex-1" style={{ color: W.muted }}>{tpl.description}</p>
                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {tpl.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-[10px] rounded-md px-1.5 py-0.5 font-medium"
                          style={{ background: W.glass, border: `1px solid ${W.border}`, color: W.dim }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
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
              className="relative w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden z-10"
              style={{ background: "#0d0303", border: `1px solid ${W.border}` }}
            >
              {/* Cover */}
              <div className="relative aspect-[16/7] overflow-hidden" style={{ background: W.glass }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`https://picsum.photos/seed/${preview.coverSeed}/800/350`} alt={preview.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 0%, #0d0303 100%)" }} />
                <button onClick={() => setPreview(null)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-xl backdrop-blur-sm flex items-center justify-center transition-colors"
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
                    <h2 className="text-xl font-black tracking-tight" style={{ color: W.text }}>{preview.name}</h2>
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
                    <div key={i} className="aspect-square rounded-xl overflow-hidden" style={{ background: W.glass }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`https://picsum.photos/seed/${seed}/200/200`} alt="" className="w-full h-full object-cover" />
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
                    whileHover={{ scale: 1.02, boxShadow: preview.isPro ? "0 0 28px rgba(245,158,11,0.4)" : "0 0 28px rgba(220,38,38,0.4)" }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { setPreview(null); applyTemplate(preview); }}
                    className="flex-1 h-11 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all"
                    style={preview.isPro
                      ? { background: "#f59e0b", boxShadow: "0 0 16px rgba(245,158,11,0.25)" }
                      : { background: "#dc2626", boxShadow: "0 0 16px rgba(220,38,38,0.25)" }}
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
                    <span className="font-semibold cursor-pointer hover:underline" style={{ color: W.red }}>Upgrade for $20/mo</span>
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
