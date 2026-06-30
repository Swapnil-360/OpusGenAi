"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Zap, Sparkles, Scissors, Replace, Eraser, Maximize2, Frame, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tool } from "@/lib/tools-config";

const ICONS: Record<string, LucideIcon> = {
  "text-to-image": Sparkles,
  "remove-bg": Scissors,
  "replace-bg": Replace,
  cleanup: Eraser,
  upscale: Maximize2,
  uncrop: Frame,
};

interface ToolCardProps {
  tool: Tool;
  index: number;
}

export function ToolCard({ tool, index }: ToolCardProps) {
  const [hovered, setHovered] = useState(false);
  const Icon = ICONS[tool.id] ?? Sparkles;
  const after = `https://picsum.photos/seed/${tool.afterSeed}/480/300`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
    >
      <Link href={tool.href}>
        <div
          className="group relative flex flex-col rounded-2xl overflow-hidden cursor-pointer"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            background: "#120404",
            border: hovered ? `1px solid ${tool.accentColor}40` : "1px solid rgba(255,255,255,0.09)",
            boxShadow: hovered ? `0 8px 32px ${tool.accentColor}20, 0 0 0 1px ${tool.accentColor}25` : "none",
            transition: "all 0.22s ease",
          }}
        >
          {/* Cover image */}
          <div className="relative h-48 overflow-hidden" style={{ background: "rgba(255,255,255,0.03)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={after}
              alt={tool.label}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />

            {/* Credit chip */}
            <div className="absolute top-2.5 left-2.5 flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 px-2 py-0.5 text-[10px] font-bold text-white/95">
              <Zap className="w-2.5 h-2.5" style={{ color: tool.accentColor }} />
              {tool.creditCost} credit{tool.creditCost > 1 ? "s" : ""}
            </div>

            {/* Badge */}
            {tool.badge && (
              <div className="absolute top-2.5 right-2.5">
                <Badge
                  className="text-[10px] font-bold border-0 shadow-md"
                  style={{ backgroundColor: tool.accentColor, color: "#fff" }}
                >
                  {tool.badge}
                </Badge>
              </div>
            )}

            {/* Hover overlay — opacity only, GPU safe */}
            <motion.div
              initial={false}
              animate={{ opacity: hovered ? 1 : 0 }}
              transition={{ duration: 0.18 }}
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: "rgba(0,0,0,0.38)", backdropFilter: "blur(2px)" }}
            >
              <div
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-white text-xs font-semibold"
                style={{
                  background: `${tool.accentColor}cc`,
                  border: `1px solid ${tool.accentColor}`,
                  boxShadow: `0 4px 20px ${tool.accentColor}40`,
                }}
              >
                <Icon className="w-3.5 h-3.5" />
                Try {tool.label}
              </div>
            </motion.div>
          </div>

          {/* Card footer */}
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${tool.accentColor}20` }}
              >
                <Icon className="w-4 h-4" style={{ color: tool.accentColor }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <h3 className="font-bold text-[15px] tracking-tight text-white/90">{tool.label}</h3>
                  <ArrowUpRight
                    className="w-4 h-4 shrink-0 transition-all duration-200"
                    style={{
                      color: hovered ? tool.accentColor : "rgba(255,255,255,0.3)",
                      transform: hovered ? "translate(1px, -1px)" : "translate(0,0)",
                    }}
                  />
                </div>
                <p className="text-xs text-white/45 leading-relaxed">{tool.description}</p>
              </div>
            </div>
          </div>

          {/* Bottom accent bar — CSS transition, not Framer Motion */}
          <div
            className="absolute bottom-0 left-0 right-0 h-0.5 origin-left"
            style={{
              backgroundColor: tool.accentColor,
              transform: hovered ? "scaleX(1)" : "scaleX(0)",
              transition: "transform 0.3s ease",
            }}
          />
        </div>
      </Link>
    </motion.div>
  );
}
