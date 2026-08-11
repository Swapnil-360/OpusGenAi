"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight, Check, Clock, Copy, Download, Expand, Grid3X3, History,
  List, Play, Search, SlidersHorizontal, Sparkles, Star, X,
} from "lucide-react";
import { useTemplates } from "@/lib/hooks/use-templates";
import { VIDEO_TIERS, type VideoQuality } from "@/lib/plans";
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
  images: string[]; videoUrl: string | null; videoQuality: VideoQuality | null;
  creditsUsed: number; aspectRatio: string;
  createdAt: Date; templateId?: string;
};

export default function HistoryPage() {
  const { templates } = useTemplates();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [fullViewSrc, setFullViewSrc] = useState<string | null>(null);
  const [starred, setStarred] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [allGenerations, setAllGenerations] = useState<CombinedEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/history", { cache: "no-store" });
        if (!res.ok) return;
        const { generations: data } = await res.json();
        setAllGenerations(
          (data ?? []).map((g: { id: string; prompt: string | null; status: string; metadata: unknown; credit_cost: number | null; created_at: string }) => {
            const meta = g.metadata as { images?: string[]; videoUrl?: string; quality?: VideoQuality; aspectRatio?: string; templateId?: string };
            return {
              id: g.id,
              prompt: g.prompt ?? "",
              status: g.status as "completed" | "processing" | "failed",
              images: meta?.images ?? [],
              videoUrl: meta?.videoUrl ?? null,
              videoQuality: meta?.quality ?? null,
              creditsUsed: g.credit_cost ?? 1,
              aspectRatio: meta?.aspectRatio ?? "1:1",
              createdAt: new Date(g.created_at),
              templateId: meta?.templateId,
            };
          })
        );
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    document.body.style.overflow = selected ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [selected]);

  useEffect(() => {
    // Escape closes the lightbox first, then the detail drawer behind it —
    // one press per layer, not both at once.
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (fullViewSrc) setFullViewSrc(null);
      else setSelected(null);
    }
    if (selected) document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [selected, fullViewSrc]);

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

  async function downloadFile(src: string, extension: string = "png") {
    try {
      // data: URLs download directly; remote URLs (fal.media) need fetch+blob
      // or the browser just navigates instead of downloading.
      const isRemote = src.startsWith("http");
      const url = isRemote ? URL.createObjectURL(await (await fetch(src)).blob()) : src;
      const a = document.createElement("a");
      a.href = url;
      a.download = `opusgen-${Date.now()}.${extension}`;
      a.click();
      if (isRemote) URL.revokeObjectURL(url);
      toast.success("Downloading…");
    } catch {
      toast.error("Download failed.");
    }
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
              {loading ? "Loading…" : (
                <>
                  {allGenerations.length} generations · {allGenerations.reduce((a, g) => a + g.images.length, 0)} images
                  {allGenerations.some((g) => g.videoUrl) && ` · ${allGenerations.filter((g) => g.videoUrl).length} videos`}
                </>
              )}
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
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden shimmer h-44" style={{ background: W.card, border: `1px solid ${W.border}` }} />
            ))}
          </div>
        ) : generations.length === 0 ? (
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
              const template = gen.templateId ? templates.find((t) => t.id === gen.templateId) : null;
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
                  {/* Image grid (or a single video tile) */}
                  <div className="grid grid-cols-2 gap-0.5 h-36 relative">
                    {gen.videoUrl ? (
                      <div className="col-span-2 relative overflow-hidden" style={{ background: W.glass }}>
                        <video src={gen.videoUrl} muted preload="metadata" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-sm"
                            style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.2)" }}>
                            <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      gen.images.slice(0, 4).map((src, ii) => (
                        <div key={ii} className="relative overflow-hidden" style={{ background: W.glass }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={src} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        </div>
                      ))
                    )}
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
                      <span className="text-[10px]" style={{ color: W.dim }}>{gen.videoUrl ? "1 video" : `${gen.images.length} images`}</span>
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
              const template = gen.templateId ? templates.find((t) => t.id === gen.templateId) : null;
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
                  {/* Thumbnail strip (or a single video thumbnail) */}
                  <div className="flex gap-1 shrink-0">
                    {gen.videoUrl ? (
                      <div className="relative w-11 h-11 rounded-lg overflow-hidden" style={{ background: W.glass }}>
                        <video src={gen.videoUrl} muted preload="metadata" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Play className="w-3.5 h-3.5 text-white fill-white" style={{ filter: "drop-shadow(0 0 2px rgba(0,0,0,0.8))" }} />
                        </div>
                      </div>
                    ) : (
                      gen.images.slice(0, 2).map((src, ii) => (
                        <div key={ii} className="w-11 h-11 rounded-lg overflow-hidden" style={{ background: W.glass }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={src} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))
                    )}
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
                {selectedGen.videoUrl ? (
                  /* Video — always-visible download button, native controls
                   * already occupy the bottom edge so hover-reveal (used for
                   * images below) would fight the controls for the same space. */
                  <div className="relative rounded-xl overflow-hidden" style={{ background: W.glass }}>
                    <video src={selectedGen.videoUrl} controls loop muted autoPlay className="w-full rounded-xl" />
                    <button
                      onClick={(e) => { e.stopPropagation(); downloadFile(selectedGen.videoUrl!, "mp4"); }}
                      aria-label="Download video"
                      className="absolute top-2 left-2 flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold text-white bg-black/60 hover:bg-black/80 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </button>
                  </div>
                ) : null}
                {selectedGen.videoUrl && selectedGen.videoQuality && (
                  <p className="text-[10px] text-center -mt-2" style={{ color: W.dim }}>
                    Generated with {VIDEO_TIERS[selectedGen.videoQuality].modelLabel}
                    {VIDEO_TIERS[selectedGen.videoQuality].includesAudio && " · includes AI audio"}
                  </p>
                )}
                {!selectedGen.videoUrl && (
                  /* Image grid */
                  <div className="grid grid-cols-2 gap-2">
                    {selectedGen.images.map((src, i) => (
                      <div
                        key={i}
                        className="relative group aspect-square rounded-xl overflow-hidden cursor-pointer"
                        style={{ background: W.glass }}
                        onClick={(e) => { e.stopPropagation(); setFullViewSrc(src); }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt={`Image ${i + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-end justify-between p-2 opacity-0 group-hover:opacity-100">
                          <button
                            onClick={(e) => { e.stopPropagation(); setFullViewSrc(src); }}
                            aria-label="View full size"
                            className="w-7 h-7 rounded-lg bg-black/60 flex items-center justify-center transition-colors hover:bg-black/80"
                          >
                            <Expand className="w-3.5 h-3.5 text-white" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); downloadFile(src); }}
                            aria-label="Download image"
                            className="w-7 h-7 rounded-lg bg-black/60 flex items-center justify-center transition-colors hover:bg-black/80"
                          >
                            <Download className="w-3.5 h-3.5 text-white" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Prompt */}
                <div className="p-3 rounded-xl" style={{ background: W.glass, border: `1px solid ${W.border}` }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: W.dim }}>Prompt</p>
                  <p className="text-xs leading-relaxed" style={{ color: W.muted }}>{selectedGen.prompt}</p>
                </div>

                {/* Template */}
                {selectedGen.templateId && (() => {
                  const tpl = templates.find((t) => t.id === selectedGen.templateId);
                  return tpl ? (
                    <div className="flex items-center gap-2.5 p-2.5 rounded-xl" style={{ border: `1px solid ${W.border}`, background: W.glassDim }}>
                      {tpl.coverImageUrl ? (
                        <Image src={tpl.coverImageUrl} alt="" width={48} height={48} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg shrink-0" style={{ background: `linear-gradient(160deg, ${tpl.accentColor}45 0%, #0d0303 85%)` }} />
                      )}
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

      {/* Fullscreen lightbox — same pattern as /generate's own full-view */}
      <AnimatePresence>
        {fullViewSrc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-60 flex items-center justify-center p-4"
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
                  onClick={() => downloadFile(fullViewSrc)}
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
