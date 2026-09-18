"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Film,
  Crown,
  Check,
  X,
  Clock,
  ArrowRight,
  Info,
  Wand2,
} from "lucide-react";
import {
  VIDEO_CATEGORIES,
  getTemplateDurationOption,
  type Template,
} from "@/lib/templates-data";

interface VideoTemplatePickerProps {
  templates: Template[];
  selectedTemplateId: string | null;
  onSelectTemplate: (template: Template | null) => void;
  onClose?: () => void;
  isModal?: boolean;
}

export function VideoTemplatePicker({
  templates,
  selectedTemplateId,
  onSelectTemplate,
  onClose,
  isModal = false,
}: VideoTemplatePickerProps) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const videoTemplates = useMemo(() => {
    return templates.filter((t) => t.templateType === "video");
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    return videoTemplates.filter((t) => {
      const matchesCategory =
        activeCategory === "all" || t.category === activeCategory;
      const matchesSearch =
        !searchQuery.trim() ||
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.tags?.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase()),
        );
      return matchesCategory && matchesSearch;
    });
  }, [videoTemplates, activeCategory, searchQuery]);

  const categoryLabel = (catId: string) => {
    return VIDEO_CATEGORIES.find((c) => c.id === catId)?.label ?? catId;
  };

  const content = (
    <div className="flex flex-col h-full space-y-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-3 pb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <Film className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              Choose a Video Template
            </h3>
            <p className="text-[11px] text-zinc-400">
              Commercial motion prompts tuned for high-converting product ads
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Custom Mode Option button */}
          <button
            type="button"
            onClick={() => {
              onSelectTemplate(null);
              onClose?.();
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              !selectedTemplateId
                ? "bg-red-600 text-white shadow-md shadow-red-600/30"
                : "bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10"
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            Custom Prompt Mode
          </button>

          {isModal && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Advisory Guidance Notice */}
      <div className="p-3 rounded-xl bg-gradient-to-r from-red-950/40 via-red-900/20 to-transparent border border-red-500/20 flex items-start gap-2.5 text-xs text-zinc-300">
        <Info className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-white">
            Important: Read the template details before generating
          </p>
          <p className="text-[11px] leading-relaxed text-zinc-300">
            Each template is engineered for specific product categories with
            pre-set camera movement, surface reflections, and lighting. Extra
            style and camera movement buttons are disabled when a template is
            active so the output precisely reflects the template&apos;s
            commercial direction.
          </p>
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search templates by product, keyword, style…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-xl text-xs bg-white/[0.04] border border-white/10 text-white placeholder:text-zinc-500 outline-none focus:border-red-500/50"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none text-[11px]">
          {VIDEO_CATEGORIES.map((cat) => {
            const active = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-2.5 py-1 rounded-full whitespace-nowrap font-medium transition-all cursor-pointer ${
                  active
                    ? "bg-red-600 text-white shadow-sm"
                    : "bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-zinc-200 border border-white/5"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="flex-1 overflow-y-auto max-h-[52vh] pr-1 scrollbar-thin">
        {filteredTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-500">
            <Film className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-xs font-semibold text-zinc-400">
              No matching templates found
            </p>
            <p className="text-[11px] mt-1 text-zinc-500">
              Try a different search term or category filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredTemplates.map((tpl) => {
              const isSelected = selectedTemplateId === tpl.id;
              const durationOpt =
                tpl.durationOption || getTemplateDurationOption(tpl.tags);
              const durationLabel =
                durationOpt === "5s"
                  ? "5s only"
                  : durationOpt === "10s"
                    ? "10s only"
                    : "5s or 10s";

              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => {
                    onSelectTemplate(tpl);
                    onClose?.();
                  }}
                  className={`group relative text-left rounded-2xl overflow-hidden border transition-all duration-200 cursor-pointer flex flex-col ${
                    isSelected
                      ? "border-red-500 ring-2 ring-red-500/30 bg-red-950/20"
                      : "border-white/10 hover:border-white/25 bg-[#140606]"
                  }`}
                >
                  {/* Aspect Thumbnail / Clip */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-black/60">
                    {tpl.previewVideoUrl ? (
                      <video
                        src={tpl.previewVideoUrl}
                        poster={tpl.coverImageUrl ?? undefined}
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : tpl.coverImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={tpl.coverImageUrl}
                        alt={tpl.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-600">
                        <Film className="w-6 h-6" />
                      </div>
                    )}

                    {/* Top Badges */}
                    <div className="absolute top-1.5 inset-x-1.5 flex items-center justify-between z-10 pointer-events-none">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-black/80 backdrop-blur-xs text-white border border-white/10">
                        {categoryLabel(tpl.category)}
                      </span>
                      {tpl.isPro && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-amber-500/90 text-black flex items-center gap-0.5">
                          <Crown className="w-2.5 h-2.5" /> PRO
                        </span>
                      )}
                    </div>

                    {/* Selected Badge */}
                    {isSelected && (
                      <div className="absolute inset-0 bg-red-600/30 backdrop-blur-xs flex items-center justify-center z-20">
                        <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Body Info */}
                  <div className="p-2.5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <p className="text-xs font-bold text-white truncate group-hover:text-red-400 transition-colors">
                          {tpl.name}
                        </p>
                      </div>
                      <p className="text-[10px] text-zinc-400 line-clamp-2 leading-snug">
                        {tpl.description}
                      </p>
                    </div>

                    <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5 text-zinc-400" />
                        {durationLabel}
                      </span>
                      <span className="text-red-400 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                        {isSelected ? "Active" : "Use"}{" "}
                        <ArrowRight className="w-2.5 h-2.5" />
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl bg-[#0e0404] border border-white/10 shadow-2xl p-4 sm:p-6"
          onClick={(e) => e.stopPropagation()}
        >
          {content}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-4 bg-[#110404] border border-white/10">
      {content}
    </div>
  );
}
