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

const PROMPTS: Record<string, string> = {
  "text-to-image": "Skincare bottle on marble, soft studio light",
  "replace-bg": "A sunlit marble surface with gold accents",
};

interface ToolCardProps {
  tool: Tool;
  index: number;
}

export function ToolCard({ tool, index }: ToolCardProps) {
  const [hovered, setHovered] = useState(false);
  const Icon = ICONS[tool.id] ?? Sparkles;
  const before = `https://picsum.photos/seed/${tool.beforeSeed}/480/300`;
  const after = `https://picsum.photos/seed/${tool.afterSeed}/480/300`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.48, delay: index * 0.07, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <Link href={tool.href}>
        <motion.div
          className="group relative overflow-hidden rounded-2xl border border-border bg-card cursor-pointer"
          onHoverStart={() => setHovered(true)}
          onHoverEnd={() => setHovered(false)}
          whileHover={{
            y: -3,
            boxShadow: `0 16px 56px ${tool.accentColor}22, 0 4px 16px rgba(0,0,0,0.4)`,
          }}
          transition={{ duration: 0.28 }}
          style={{ borderColor: hovered ? `${tool.accentColor}30` : undefined }}
        >
          {/* Demo stage */}
          <div className="relative h-52 overflow-hidden bg-secondary select-none">
            <DemoStage tool={tool} hovered={hovered} before={before} after={after} />

            {/* Accent glow overlay on hover */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              animate={{ opacity: hovered ? 1 : 0 }}
              transition={{ duration: 0.3 }}
              style={{
                background: `radial-gradient(ellipse at 50% -10%, ${tool.accentColor}22 0%, transparent 65%)`,
              }}
            />

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
          </div>

          {/* Card footer */}
          <div className="p-5">
            <div className="flex items-start gap-3 mb-2">
              <motion.div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${tool.accentColor}20` }}
                animate={{ scale: hovered ? 1.08 : 1 }}
                transition={{ duration: 0.2 }}
              >
                <Icon className="w-4 h-4" style={{ color: tool.accentColor }} />
              </motion.div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold text-[15px] tracking-tight">{tool.label}</h3>
                  <motion.div
                    animate={{ x: hovered ? 1 : 0, y: hovered ? -1 : 0, opacity: hovered ? 1 : 0.4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ArrowUpRight className="w-4 h-4 shrink-0" style={{ color: hovered ? tool.accentColor : undefined }} />
                  </motion.div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{tool.description}</p>
              </div>
            </div>
          </div>

          {/* Bottom accent bar */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-[2px] origin-left"
            style={{ backgroundColor: tool.accentColor }}
            animate={{ scaleX: hovered ? 1 : 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </motion.div>
      </Link>
    </motion.div>
  );
}

function DemoStage({ tool, hovered, before, after }: { tool: Tool; hovered: boolean; before: string; after: string }) {
  const accent = tool.accentColor;

  switch (tool.id) {
    case "text-to-image":
      return (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <motion.img
            src={after}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            animate={{ scale: hovered ? 1.06 : 1, filter: hovered ? "saturate(1.15)" : "saturate(0.85)" }}
            transition={{ duration: 0.6 }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          <motion.div
            className="absolute left-3 right-3 bottom-3 flex items-center gap-2 rounded-xl bg-black/75 backdrop-blur-md border border-white/10 px-3 py-2"
            animate={{ y: hovered ? 0 : 16, opacity: hovered ? 1 : 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" style={{ color: accent }} />
            <span className="text-[11px] text-white/80 truncate flex-1">{PROMPTS["text-to-image"]}</span>
            <span className="text-[10px] font-bold text-white px-2 py-1 rounded-lg shrink-0" style={{ backgroundColor: accent }}>
              Generate
            </span>
          </motion.div>
        </>
      );

    case "remove-bg":
      return (
        <>
          <div className="absolute inset-0 checkerboard" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <motion.img
            src={after}
            alt=""
            className="absolute inset-0 m-auto w-[75%] h-[75%] object-cover rounded-lg"
            style={{ filter: "drop-shadow(0 12px 28px rgba(0,0,0,0.6))" }}
            animate={{ scale: hovered ? 1 : 1.3, opacity: hovered ? 1 : 0 }}
            transition={{ duration: 0.45 }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <motion.img
            src={before}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            animate={{ clipPath: hovered ? "inset(0 0 0 100%)" : "inset(0 0 0 0%)" }}
            transition={{ duration: 0.65, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_12px_rgba(255,255,255,0.9)]"
            animate={{ left: hovered ? "100%" : "0%", opacity: hovered ? [0, 1, 0] : 0 }}
            transition={{ duration: 0.65, ease: "easeInOut" }}
          />
        </>
      );

    case "replace-bg":
      return (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={before} alt="" className="absolute inset-0 w-full h-full object-cover" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <motion.img
            src={after}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            animate={{ opacity: hovered ? 1 : 0 }}
            transition={{ duration: 0.6 }}
          />
          <motion.div
            className="absolute left-1/2 top-4 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-black/80 backdrop-blur-md border border-white/15 px-3 py-1.5"
            animate={{ y: hovered ? 0 : -12, opacity: hovered ? 1 : 0 }}
            transition={{ duration: 0.35 }}
          >
            <Replace className="w-3 h-3 shrink-0" style={{ color: accent }} />
            <span className="text-[10px] text-white/90 whitespace-nowrap">{PROMPTS["replace-bg"]}</span>
          </motion.div>
        </>
      );

    case "cleanup":
      return (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <motion.img
            src={before}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            animate={{ opacity: hovered ? 0 : 1 }}
            transition={{ duration: 0.5, delay: hovered ? 0.2 : 0 }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={after} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <motion.div
            className="absolute"
            style={{ left: "32%", top: "38%" }}
            animate={hovered ? { scale: [1, 1.3, 0], opacity: [1, 1, 0] } : { scale: [1, 1.1, 1], opacity: 1 }}
            transition={hovered ? { duration: 0.5 } : { duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          >
            <div
              className="w-14 h-14 rounded-full border-2 border-dashed"
              style={{ borderColor: accent, boxShadow: `0 0 20px ${accent}66`, background: `${accent}1e` }}
            />
          </motion.div>
          <motion.div
            className="absolute w-10 h-10 rounded-full border border-white/40 bg-white/10 backdrop-blur-sm"
            initial={false}
            animate={hovered ? { left: ["20%", "58%"], top: ["30%", "46%"], opacity: [0, 1, 0] } : { opacity: 0 }}
            transition={{ duration: 0.6 }}
          />
        </>
      );

    case "upscale":
      return (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <motion.img
            src={after}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            animate={{ filter: hovered ? "blur(0px) contrast(1.06)" : "blur(5px) contrast(0.9)", scale: hovered ? 1 : 1.06 }}
            transition={{ duration: 0.55 }}
          />
          <motion.div
            className="absolute w-16 h-16 rounded-full border-2 border-white/75 bg-white/5 backdrop-blur-[1px]"
            style={{ boxShadow: `0 0 28px ${accent}55` }}
            initial={false}
            animate={hovered ? { left: ["10%", "62%"], top: ["58%", "18%"], opacity: [0, 1, 0] } : { opacity: 0 }}
            transition={{ duration: 0.75, ease: "easeOut" }}
          />
          <motion.div
            className="absolute right-3 bottom-3 text-[11px] font-bold text-white px-2.5 py-1 rounded-lg shadow-lg"
            style={{ backgroundColor: accent }}
            animate={{ scale: hovered ? 1 : 0.6, opacity: hovered ? 1 : 0 }}
            transition={{ type: "spring", stiffness: 340, damping: 18 }}
          >
            4K · 4×
          </motion.div>
        </>
      );

    case "uncrop":
      return (
        <>
          <div className="absolute inset-0 dotted-canvas" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <motion.img
            src={after}
            alt=""
            className="absolute inset-0 m-auto object-cover rounded-md"
            animate={{ width: hovered ? "60%" : "100%", height: hovered ? "60%" : "100%" }}
            transition={{ duration: 0.55, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute inset-[20%] rounded-md"
            style={{ outline: `1.5px solid ${accent}`, outlineOffset: "-1px" }}
            animate={{ opacity: hovered ? 1 : 0 }}
            transition={{ duration: 0.3, delay: hovered ? 0.2 : 0 }}
          >
            {["top-0 left-0", "top-0 right-0", "bottom-0 left-0", "bottom-0 right-0", "top-0 left-1/2", "bottom-0 left-1/2", "top-1/2 left-0", "top-1/2 right-0"].map((pos) => (
              <span
                key={pos}
                className={`absolute ${pos} w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white`}
                style={{ backgroundColor: accent }}
              />
            ))}
          </motion.div>
        </>
      );

    default:
      // eslint-disable-next-line @next/next/no-img-element
      return <img src={after} alt="" className="absolute inset-0 w-full h-full object-cover" />;
  }
}
