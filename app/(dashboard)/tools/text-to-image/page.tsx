"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Grid2X2, Layers, PenLine, Sparkles, Zap } from "lucide-react";
import { ToolPageShell } from "@/components/tools/ToolPageShell";

const TOOL_COLOR = "#8b5cf6";
const W = {
  border: "rgba(255,255,255,0.09)",
  glass: "rgba(255,255,255,0.05)",
  glassDim: "rgba(255,255,255,0.03)",
  muted: "rgba(255,255,255,0.45)",
  dim: "rgba(255,255,255,0.28)",
  text: "rgba(255,255,255,0.88)",
};

export default function TextToImagePage() {
  const [hovering, setHovering] = useState(false);

  return (
    <ToolPageShell
      title="Text to Image"
      description="Generate studio-quality product photos from a prompt"
      creditCost={1}
      accentColor={TOOL_COLOR}
    >
      <div className="flex flex-col items-center text-center py-12 max-w-md mx-auto">
        <motion.div
          className="relative w-24 h-24 flex items-center justify-center mb-6"
          onHoverStart={() => setHovering(true)}
          onHoverEnd={() => setHovering(false)}
        >
          <motion.div
            className="absolute inset-0 rounded-2xl"
            style={{ border: "2px solid rgba(139,92,246,0.2)" }}
            animate={{ rotate: hovering ? 15 : 0, scale: hovering ? 1.05 : 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 18 }}
          />
          <motion.div
            className="absolute inset-0 rounded-2xl"
            style={{ background: "radial-gradient(ellipse, rgba(139,92,246,0.2) 0%, transparent 70%)", filter: "blur(8px)" }}
            animate={{ opacity: hovering ? 1 : 0.4 }}
          />
          <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center z-10"
            style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.25)" }}>
            <Sparkles className="w-8 h-8" style={{ color: "#a78bfa" }} />
          </div>
        </motion.div>

        <h2 className="text-sm font-semibold mb-1.5" style={{ color: W.text }}>Text to Image</h2>
        <p className="text-xs leading-relaxed mb-6" style={{ color: W.muted }}>
          Generate professional product photography from any text description. Choose a template or write your own scene.
        </p>

        <div className="grid grid-cols-2 gap-2.5 w-full mb-6">
          {[
            { icon: PenLine,   label: "Custom prompt", desc: "Describe any scene" },
            { icon: Layers,    label: "12+ templates", desc: "One-click presets" },
            { icon: Zap,       label: "15 seconds",    desc: "Average generation" },
            { icon: Grid2X2,   label: "4 images",      desc: "Per generation" },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-center gap-3 p-3 rounded-xl text-left"
              style={{ border: `1px solid ${W.border}`, background: W.glassDim }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${TOOL_COLOR}14` }}>
                <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: TOOL_COLOR }} />
              </div>
              <div>
                <p className="text-xs font-semibold" style={{ color: W.text }}>{label}</p>
                <p className="text-[10px]" style={{ color: W.dim }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2.5 w-full">
          <Link href="/generate">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="w-full h-10 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 cursor-pointer transition-all"
              style={{ background: TOOL_COLOR }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Open Generate Studio
              <ArrowRight className="w-3.5 h-3.5" />
            </motion.div>
          </Link>
          <Link href="/templates">
            <div
              className="w-full h-10 rounded-xl font-medium text-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
              style={{ border: `1px solid ${W.border}`, background: W.glass, color: W.muted }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = W.text; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.18)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = W.muted; (e.currentTarget as HTMLElement).style.borderColor = W.border; }}
            >
              <Layers className="w-4 h-4" />
              Browse Templates First
            </div>
          </Link>
        </div>

        <p className="text-[11px] mt-4" style={{ color: W.dim }}>
          Text-to-image generation lives in the full Generate Studio with template support, caption generation, and more.
        </p>
      </div>
    </ToolPageShell>
  );
}
