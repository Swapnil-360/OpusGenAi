"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight, Check, Clock, Copy, Download, Grid3X3, History,
  List, Search, SlidersHorizontal, Sparkles, Star, X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { TEMPLATES } from "@/lib/templates-data";
import { formatTimeAgo, truncate } from "@/lib/utils";
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

type ViewMode = "grid" | "list";
type FilterStatus = "all" | "completed" | "failed";

type CombinedEntry = {
  id: string; prompt: string; status: "completed" | "processing" | "failed";
  images: string[]; creditsUsed: number; aspectRatio: string;
  createdAt: Date; templateId?: string;
};

export default function HistoryPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [starred, setStarred] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [allGenerations, setAllGenerations] = useState<CombinedEntry[]>([]);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("generations")
        .select("id, prompt, status, metadata, credit_cost, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (!data) return;
      setAllGenerations(
        data.map((g) => ({
          id: g.id,
          prompt: g.prompt ?? "",
          status: g.status as "completed" | "processing" | "failed",
          images: (g.metadata as { images?: string[] })?.images ?? [],
          creditsUsed: g.credit_cost ?? 1,
          aspectRatio: (g.metadata as { aspectRatio?: string })?.aspectRatio ?? "1:1",
          createdAt: new Date(g.created_at),
          templateId: (g.metadata as { templateId?: string })?.templateId,
        }))
      );
    }
    load();
  }, []);

  useEffect(() => {
    document.body.style.overflow = selected ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [selected]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) { if (e.key === "Escape") setSelected(null); }
    if (selected) document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [selected]);

  const generations = allGenerations.filter((g) => {
    if (filterStatus !== "all" && g.status !== filterStatus) return false;
    if (search.trim() && !g.prompt.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const selectedGen = selected ? allGenerations.find((g) => g.id === selected) : null;

  function toggleStar(id: string) {
    setStarred((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function copyPrompt(prompt: string, id: string) {
    navigator.clipboard.writeText(prompt);
    setCopiedId(id);
    toast.success("Prompt copied!");
    setTimeout(() => setCopiedId(null), 1800);
  }

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: W.bg }}>

      {/* Header */}
      <div className="px-5 pt-3 pb-3 shrink-0" style={{ borderBottom: `1px solid ${W.border}` }}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: W.redBg, border: `1px solid ${W.redBorder}` }}>
                <History className="w-3.5 h-3.5" style={{ color: W.red }} />
              </div>
              <h1 className="text-sm font-semibold" style={{ color: W.text }}>History</h1>
            </div>
            <p className="text-[11px] ml-9" style={{ color: W.muted }}>
              {allGenerations.length} generations · {allGenerations.reduce((a, g) => a + g.images.length, 0)} images
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* View toggle */}
            <div className="flex items-center gap-0.5 p-1 rounded-xl" style={{ border: `1px solid ${W.border}`, background: W.glassDim }}>
              {([["grid", Grid3X3], ["list", List]] as const).map(([mode, Icon]) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className="p-1.5 rounded-lg transition-all"
                  style={viewMode === mode
                    ? { background: "#dc2626", color: "#fff" }
                    : { color: W.muted }}
                  onMouseEnter={(e) => { if (viewMode !== mode) e.currentTarget.style.color = W.text; }}
                  onMouseLeave={(e) => { if (viewMode !== mode) e.currentTarget.style.color = W.muted; }}
                >
                  <Icon className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative flex-1 sm:flex-none sm:w-52">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: W.dim }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search prompts…"
                className="w-full h-9 pl-8 pr-7 rounded-xl text-xs outline-none transition-all"
                style={{ border: `1px solid ${W.border}`, background: W.glass, color: W.text }}
                onFocus={(e) => { e.currentTarget.style.borderColor = W.redBorder; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = W.border; }}
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 transition-colors" style={{ color: W.dim }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = W.text)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = W.dim)}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Filter */}
            <button className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-medium transition-colors"
              style={{ border: `1px solid ${W.border}`, background: W.glassDim, color: W.muted }}
              onMouseEnter={(e) => { e.currentTarget.style.background = W.glass; e.currentTarget.style.color = W.text; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = W.glassDim; e.currentTarget.style.color = W.muted; }}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {filterStatus === "all" ? "All" : filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}
            </button>
          </div>
        </div>

        {/* Status filter pills */}
        <div className="flex gap-1.5 flex-wrap">
          {(["all", "completed", "failed"] as FilterStatus[]).map((s) => {
            const count = s === "all" ? allGenerations.length : allGenerations.filter((g) => g.status === s).length;
            const isActive = filterStatus === s;
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                style={isActive
                  ? { border: `1px solid ${W.redBorder}`, background: W.redBg, color: W.red }
                  : { border: `1px solid ${W.border}`, background: W.glassDim, color: W.muted }}
                onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = W.glass; e.currentTarget.style.color = W.text; } }}
                onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = W.glassDim; e.currentTarget.style.color = W.muted; } }}
              >
                {s === "completed" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                {s === "failed" && <span className="w-1.5 h-1.5 rounded-full bg-red-500/70" />}
                {s.charAt(0).toUpperCase() + s.slice(1)}
                <span className="text-[10px] rounded-full px-1.5"
                  style={isActive ? { background: "rgba(220,38,38,0.25)", color: W.red } : { background: W.glass, color: W.dim }}>
                  {count}
                </span>
              </button>
            );
          })}
          {starred.size > 0 && (
            <span className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-amber-400"
              style={{ border: "1px solid rgba(251,191,36,0.3)", background: "rgba(251,191,36,0.08)" }}>
              <Star className="w-3 h-3 fill-amber-400" /> {starred.size} starred
            </span>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {generations.length === 0 ? (
          <div className="flex flex-col items-center text-center py-20">
            <Clock className="w-10 h-10 mb-3" style={{ color: W.dim }} />
            <p className="text-sm font-semibold mb-1" style={{ color: W.muted }}>No generations found</p>
            {search ? (
              <button onClick={() => setSearch("")} className="text-xs hover:underline" style={{ color: W.red }}>Clear search</button>
            ) : (
              <Link href="/generate" className="text-xs hover:underline" style={{ color: W.red }}>Generate your first image →</Link>
            )}
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {generations.map((gen, i) => {
              const template = gen.templateId ? TEMPLATES.find((t) => t.id === gen.templateId) : null;
              const isStarred = starred.has(gen.id);
              return (
                <motion.div
                  key={gen.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="group rounded-xl overflow-hidden cursor-pointer transition-all"
                  style={{ background: W.card, border: `1px solid ${W.border}` }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = W.border)}
                  onClick={() => setSelected(gen.id)}
                >
                  {/* Image grid */}
                  <div className="grid grid-cols-2 gap-0.5 h-36 relative">
                    {gen.images.slice(0, 4).map((src, ii) => (
                      <div key={ii} className="relative overflow-hidden" style={{ background: W.glass }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      </div>
                    ))}
                    <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent" />
                    <div className="absolute top-1.5 right-1.5 flex items-center gap-1.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleStar(gen.id); }}
                        className="w-7 h-7 rounded-lg backdrop-blur-sm flex items-center justify-center transition-all"
                        style={isStarred
                          ? { background: "rgba(251,191,36,0.25)", border: "1px solid rgba(251,191,36,0.4)", color: "#fbbf24" }
                          : { background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}
                        onMouseEnter={(e) => { if (!isStarred) e.currentTarget.style.color = "#fbbf24"; }}
                        onMouseLeave={(e) => { if (!isStarred) e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}
                      >
                        <Star className={`w-3.5 h-3.5 ${isStarred ? "fill-amber-400" : ""}`} />
                      </button>
                    </div>
                    <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-white/80 bg-black/50 backdrop-blur-sm rounded-md px-1.5 py-0.5">{gen.aspectRatio}</span>
                      {template && (
                        <span className="text-[10px] font-bold text-white/70 bg-black/50 backdrop-blur-sm rounded-md px-1.5 py-0.5 flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" />{template.name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card footer */}
                  <div className="px-3 py-2">
                    <p className="text-xs font-medium line-clamp-1 mb-1" style={{ color: W.text }}>{truncate(gen.prompt, 72)}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-[10px]" style={{ color: W.dim }}>
                        <Clock className="w-3 h-3" />
                        {formatTimeAgo(gen.createdAt)}
                      </div>
                      <span className="text-[10px]" style={{ color: W.dim }}>·</span>
                      <span className="text-[10px]" style={{ color: W.dim }}>{gen.images.length} images</span>
                      <div className="ml-auto flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); copyPrompt(gen.prompt, gen.id); }}
                          className="w-6 h-6 rounded-lg flex items-center justify-center transition-all"
                          style={{ color: W.dim }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = W.text; e.currentTarget.style.background = W.glass; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = W.dim; e.currentTarget.style.background = "transparent"; }}
                        >
                          {copiedId === gen.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                        <Link href={`/generate?prompt=${encodeURIComponent(gen.prompt)}`} onClick={(e) => e.stopPropagation()}>
                          <div className="w-6 h-6 rounded-lg flex items-center justify-center transition-all"
                            style={{ color: W.dim }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = W.red; e.currentTarget.style.background = W.glass; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = W.dim; e.currentTarget.style.background = "transparent"; }}
                          >
                            <ArrowUpRight className="w-3 h-3" />
                          </div>
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          /* List view */
          <div className="space-y-2">
            {generations.map((gen, i) => {
              const template = gen.templateId ? TEMPLATES.find((t) => t.id === gen.templateId) : null;
              const isStarred = starred.has(gen.id);
              return (
                <motion.div
                  key={gen.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="group flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all"
                  style={{ border: `1px solid ${W.border}`, background: W.glassDim }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = W.glass; e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = W.glassDim; e.currentTarget.style.borderColor = W.border; }}
                  onClick={() => setSelected(gen.id)}
                >
                  {/* Thumbnail strip */}
                  <div className="flex gap-1 shrink-0">
                    {gen.images.slice(0, 2).map((src, ii) => (
                      <div key={ii} className="w-11 h-11 rounded-lg overflow-hidden" style={{ background: W.glass }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium line-clamp-1" style={{ color: W.text }}>{truncate(gen.prompt, 80)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px]" style={{ color: W.dim }}>{formatTimeAgo(gen.createdAt)}</span>
                      <span className="text-[10px]" style={{ color: W.dim }}>·</span>
                      <span className="text-[10px]" style={{ color: W.dim }}>{gen.aspectRatio}</span>
                      {template && (
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md flex items-center gap-1 h-4"
                          style={{ background: W.glass, border: `1px solid ${W.border}`, color: W.dim }}>
                          <Sparkles className="w-2.5 h-2.5" />{template.name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0 opacity-40 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); toggleStar(gen.id); }}
                      className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
                      style={{ color: isStarred ? "#fbbf24" : W.dim }}
                      onMouseEnter={(e) => { if (!isStarred) e.currentTarget.style.color = "#fbbf24"; }}
                      onMouseLeave={(e) => { if (!isStarred) e.currentTarget.style.color = W.dim; }}
                    >
                      <Star className={`w-3.5 h-3.5 ${isStarred ? "fill-amber-400" : ""}`} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); copyPrompt(gen.prompt, gen.id); }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                      style={{ color: W.dim }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = W.text)}
                      onMouseLeave={(e) => (e.currentTarget.style.color = W.dim)}
                    >
                      {copiedId === gen.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <Link href={`/generate?prompt=${encodeURIComponent(gen.prompt)}`} onClick={(e) => e.stopPropagation()}>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                        style={{ color: W.dim }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = W.red)}
                        onMouseLeave={(e) => (e.currentTarget.style.color = W.dim)}
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </div>
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail drawer */}
      <AnimatePresence>
        {selectedGen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          >
            <motion.div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setSelected(null)} />
            <motion.div
              initial={{ y: 40, scale: 0.96 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 30, scale: 0.96, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="history-modal-title"
              className="relative w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden z-10 max-h-[85vh] flex flex-col"
              style={{ background: "#0d0303", border: `1px solid ${W.border}` }}
            >
              <div className="flex items-center justify-between px-5 pt-4 pb-3 shrink-0" style={{ borderBottom: `1px solid ${W.border}` }}>
                <div className="flex items-center gap-2">
                  {selectedGen.status === "completed" && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
                  <p id="history-modal-title" className="text-sm font-bold" style={{ color: W.text }}>{formatTimeAgo(selectedGen.createdAt)}</p>
                  <span className="text-xs" style={{ color: W.muted }}>{selectedGen.aspectRatio}</span>
                </div>
                <button onClick={() => setSelected(null)} aria-label="Close"
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
                  style={{ border: `1px solid ${W.border}`, background: W.glass, color: W.muted }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = W.text)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = W.muted)}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 p-5 space-y-4">
                {/* Image grid */}
                <div className="grid grid-cols-2 gap-2">
                  {selectedGen.images.map((src, i) => (
                    <div key={i} className="relative group aspect-square rounded-xl overflow-hidden" style={{ background: W.glass }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`Image ${i + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-end justify-end p-2 opacity-0 group-hover:opacity-100">
                        <button className="w-7 h-7 rounded-lg bg-black/60 flex items-center justify-center">
                          <Download className="w-3.5 h-3.5 text-white" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Prompt */}
                <div className="p-3 rounded-xl" style={{ background: W.glass, border: `1px solid ${W.border}` }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: W.dim }}>Prompt</p>
                  <p className="text-xs leading-relaxed" style={{ color: W.muted }}>{selectedGen.prompt}</p>
                </div>

                {/* Template */}
                {selectedGen.templateId && (() => {
                  const tpl = TEMPLATES.find((t) => t.id === selectedGen.templateId);
                  return tpl ? (
                    <div className="flex items-center gap-2.5 p-2.5 rounded-xl" style={{ border: `1px solid ${W.border}`, background: W.glassDim }}>
                      <Image src={`https://picsum.photos/seed/${tpl.coverSeed}/48/48`} alt="" width={48} height={48} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                      <div>
                        <p className="text-xs font-semibold" style={{ color: W.text }}>{tpl.name}</p>
                        <p className="text-[10px]" style={{ color: W.dim }}>{tpl.category} template</p>
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>

              <div className="px-5 pb-5 pt-3 flex gap-2 shrink-0" style={{ borderTop: `1px solid ${W.border}` }}>
                <button
                  onClick={() => copyPrompt(selectedGen.prompt, selectedGen.id)}
                  className="flex-1 h-9 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                  style={{ border: `1px solid ${W.border}`, background: W.glass, color: W.muted }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = W.glassDim; e.currentTarget.style.color = W.text; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = W.glass; e.currentTarget.style.color = W.muted; }}
                >
                  {copiedId === selectedGen.id
                    ? <><Check className="w-3.5 h-3.5 text-emerald-400" />Copied!</>
                    : <><Copy className="w-3.5 h-3.5" />Copy prompt</>}
                </button>
                <Link href={`/generate?prompt=${encodeURIComponent(selectedGen.prompt)}`} className="flex-1">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setSelected(null)}
                    className="w-full h-9 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5"
                    style={{ background: "#dc2626" }}
                  >
                    <Sparkles className="w-3.5 h-3.5" />Reuse prompt
                  </motion.button>
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
