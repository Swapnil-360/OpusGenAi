"use client";

import * as React from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  type PanInfo,
  type MotionValue,
} from "motion/react";
import { ChevronLeft, ChevronRight, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Template } from "@/lib/templates-data";

interface CarouselConfig {
  distanceDivisor: number;
  velocityDivisor: number;
  sensitivity: number;
  xMultiplier: number;
  yMultiplier: number;
  rotationMultiplier: number;
  scaleReduction: number;
}

const getCarouselConfig = (width: number): CarouselConfig => {
  if (width < 640) {
    return { distanceDivisor: 120, velocityDivisor: 500, sensitivity: 180, xMultiplier: 68, yMultiplier: 12, rotationMultiplier: 6, scaleReduction: 0.08 };
  }
  if (width < 1024) {
    return { distanceDivisor: 160, velocityDivisor: 650, sensitivity: 220, xMultiplier: 96, yMultiplier: 16, rotationMultiplier: 7, scaleReduction: 0.1 };
  }
  return { distanceDivisor: 200, velocityDivisor: 800, sensitivity: 250, xMultiplier: 128, yMultiplier: 20, rotationMultiplier: 8, scaleReduction: 0.12 };
};

// How many neighbors stay visible on each side, regardless of how many
// items exist — keeps a 12+ item list looking like a tidy deck instead of
// a wide, over-rotated fan.
const VISIBLE_RANGE = 2.2;

interface FeaturedCarouselProps {
  items: Template[];
  onSelect: (tpl: Template) => void;
}

// A tap never lands on a perfect pixel — especially with a finger — so allow
// this much travel between pointerdown and click before calling it a drag.
const TAP_SLOP_PX = 10;

export function FeaturedCarousel({ items, onSelect }: FeaturedCarouselProps) {
  const scrollProgress = useMotionValue(0);
  const startProgress = React.useRef(0);
  const [windowWidth, setWindowWidth] = React.useState(0);
  // Where the current interaction started. Recorded fresh on every pointerdown
  // and compared against the click that ends it, so "was this a drag?" is
  // decided per interaction and can never carry over from a previous one.
  const pointerDownAt = React.useRef<{ x: number; y: number } | null>(null);

  const total = items.length;

  // Keyed on the actual template set, not the array identity: the parent
  // rebuilds `items` on every render, so depending on it snapped the deck
  // back to the first card on any unrelated state change (closing the modal,
  // typing in search…).
  const itemsKey = items.map((t) => t.id).join(",");
  React.useEffect(() => {
    scrollProgress.set(0);
  }, [itemsKey, scrollProgress]);

  React.useEffect(() => {
    setWindowWidth(window.innerWidth);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const config = React.useMemo(() => getCarouselConfig(windowWidth), [windowWidth]);

  const handleDragStart = () => {
    startProgress.current = scrollProgress.get();
  };

  /** True when the pointer travelled far enough between press and release that
   *  this was a swipe rather than a tap. */
  const wasDrag = (e: React.MouseEvent) => {
    // detail === 0 means a synthetic/keyboard-driven click, which carries no
    // meaningful coordinates — always treat those as a tap.
    if (e.detail === 0) return false;
    const start = pointerDownAt.current;
    if (!start) return false;
    return Math.hypot(e.clientX - start.x, e.clientY - start.y) > TAP_SLOP_PX;
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const dragDistance = info.offset.x;
    const velocity = info.velocity.x;

    const distanceShift = -dragDistance / config.distanceDivisor;
    const velocityShift = -velocity / config.velocityDivisor;

    let totalShift = Math.round(distanceShift + velocityShift);
    totalShift = Math.max(-3, Math.min(3, totalShift));

    const target = Math.round(startProgress.current) + totalShift;

    animate(scrollProgress, target, { type: "spring", stiffness: 260, damping: 32, mass: 1 });
  };

  const step = (dir: 1 | -1) => {
    const target = Math.round(scrollProgress.get()) + dir;
    animate(scrollProgress, target, { type: "spring", stiffness: 260, damping: 32, mass: 1 });
  };

  if (total === 0) return null;

  return (
    <div className="relative isolate flex flex-col items-center justify-center w-full max-w-5xl mx-auto select-none">
      <motion.div
        drag={total > 1 ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.15}
        onPointerDownCapture={(e) => {
          pointerDownAt.current = { x: e.clientX, y: e.clientY };
        }}
        onDragStart={handleDragStart}
        onDrag={(_, info) => {
          const delta = -info.delta.x / config.sensitivity;
          scrollProgress.set(scrollProgress.get() + delta);
        }}
        onDragEnd={handleDragEnd}
        className={cn(
          "relative w-full h-56 sm:h-72 lg:h-80 flex items-center justify-center overflow-hidden",
          total > 1 && "cursor-grab active:cursor-grabbing",
        )}
      >
        {items.map((tpl, i) => (
          <Card
            key={tpl.id}
            tpl={tpl}
            index={i}
            total={total}
            progress={scrollProgress}
            config={config}
            onSelect={(e) => { if (!wasDrag(e)) onSelect(tpl); }}
          />
        ))}
      </motion.div>

      {total > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous"
            onClick={() => step(-1)}
            className="absolute left-1 sm:left-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-colors"
            style={{ background: "rgba(0,0,0,0.45)", border: "1px solid rgba(255,255,255,0.12)" }}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={() => step(1)}
            className="absolute right-1 sm:right-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-colors"
            style={{ background: "rgba(0,0,0,0.45)", border: "1px solid rgba(255,255,255,0.12)" }}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  );
}

interface CardProps {
  tpl: Template;
  index: number;
  total: number;
  progress: MotionValue<number>;
  config: CarouselConfig;
  onSelect: (e: React.MouseEvent) => void;
}

const Card = ({ tpl, index, total, progress, config, onSelect }: CardProps) => {
  const offset = useTransform(progress, (p) => {
    let diff = (index - p) % total;
    if (diff > total / 2) diff -= total;
    if (diff < -total / 2) diff += total;
    return diff;
  });

  const x = useTransform(offset, (o) => o * config.xMultiplier);
  const rotate = useTransform(offset, (o) => {
    const clamped = Math.max(-VISIBLE_RANGE, Math.min(VISIBLE_RANGE, o));
    return Math.abs(clamped) < 0.05 ? 0 : clamped * config.rotationMultiplier;
  });
  const y = useTransform(offset, (o) => {
    const clamped = Math.max(-VISIBLE_RANGE, Math.min(VISIBLE_RANGE, o));
    return Math.abs(clamped) < 0.05 ? 0 : Math.abs(clamped) * config.yMultiplier;
  });
  const scale = useTransform(offset, (o) => 1 - Math.min(Math.abs(o), VISIBLE_RANGE + 1) * config.scaleReduction);
  const opacity = useTransform(
    offset,
    [-VISIBLE_RANGE - 0.6, -VISIBLE_RANGE, 0, VISIBLE_RANGE, VISIBLE_RANGE + 0.6],
    [0, 0.55, 1, 0.55, 0],
  );
  const zIndex = useTransform(offset, (o) => Math.round(30 - Math.min(Math.abs(o), VISIBLE_RANGE + 1) * 10));
  const pointerEvents = useTransform(offset, (o) => (Math.abs(o) > VISIBLE_RANGE + 0.6 ? "none" : "auto"));
  const dimOpacity = useTransform(offset, [-2, -0.5, 0, 0.5, 2], [0.5, 0.2, 0, 0.2, 0.5]);
  const textOpacity = useTransform(offset, [-0.5, 0, 0.5], [0, 1, 0]);

  return (
    <motion.div
      style={{ x, rotate, y, scale, opacity, zIndex, pointerEvents }}
      onClick={onSelect}
      className={cn(
        "absolute rounded-2xl overflow-hidden bg-muted group cursor-pointer shadow-2xl",
        "w-32 h-44 sm:w-44 sm:h-60 lg:w-52 lg:h-68",
      )}
    >
      {tpl.templateType === "video" && tpl.previewVideoUrl ? (
        // Same always-playing (not hover-to-play) treatment as the landing
        // page's video template grid — a visitor should see the actual
        // motion output here too, not just a static cover.
        <video
          src={tpl.previewVideoUrl}
          poster={tpl.coverImageUrl ?? undefined}
          autoPlay muted loop playsInline preload="auto"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-transform duration-700 group-hover:scale-110"
        />
      ) : tpl.coverImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={tpl.coverImageUrl}
          alt={tpl.name}
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-transform duration-700 group-hover:scale-110"
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(160deg, ${tpl.accentColor}35 0%, #0d0303 85%)` }}
        />
      )}

      <motion.div style={{ opacity: dimOpacity }} className="absolute inset-0 bg-black pointer-events-none" />

      <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

      {tpl.isPro && (
        <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-black/70 backdrop-blur-md pointer-events-none" style={{ border: "1px solid rgba(251,191,36,0.4)" }}>
          <Crown className="w-2.5 h-2.5 text-amber-400" />
          <span className="text-[9px] font-bold text-amber-400">PRO</span>
        </div>
      )}

      <span
        className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest backdrop-blur-md pointer-events-none"
        style={{ background: `${tpl.accentColor}30`, color: tpl.accentColor, border: `1px solid ${tpl.accentColor}45` }}
      >
        {tpl.category}
      </span>

      <div className="absolute bottom-3 left-2.5 right-2.5 sm:bottom-4 sm:left-3.5 sm:right-3.5 text-white text-left pointer-events-none">
        <motion.p style={{ opacity: textOpacity }} className="text-[11px] sm:text-sm lg:text-base font-bold leading-tight mb-0.5 drop-shadow-md">
          {tpl.name}
        </motion.p>
        <motion.p style={{ opacity: textOpacity }} className="hidden sm:block text-[10px] text-white/70 line-clamp-2 italic font-medium">
          {tpl.description}
        </motion.p>
      </div>
    </motion.div>
  );
};
