"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface CardItem {
  id: string | number;
  url: string;
  title: string;
  /** "video" renders a muted, looping <video> instead of <img>. */
  mediaType?: "image" | "video";
  /** Poster frame for a video card — shown before/while the video decodes. */
  posterUrl?: string;
}

export interface DiagonalMarqueeCarouselProps {
  cards?: CardItem[];
  angle?: number;
  baseSpeed?: number;
  alternateDirections?: boolean;
  /** How many scrolling rows to render. Real cards are split across rows
   *  round-robin (not repeated whole per row) so more rows means more of
   *  the actual catalogue is visible at once, not the same handful looping
   *  in parallel. Typically driven by the caller's own item count — see
   *  app/gallery/page.tsx for the sizing rule used there. */
  rows?: number;
  /** Card box size — also typically scaled by the caller's item count: more
   *  items can afford smaller cards without looking sparse. */
  cardWidth?: number;
  cardHeight?: number;
  /** Height of the whole banner in px. Not full-viewport by default — this
   *  is meant to sit inline as a section of a page, unlike the vendor
   *  demo's full-screen hero usage. Numeric (not a Tailwind class) because
   *  it's typically computed from the caller's item count, and an
   *  arbitrary-value class built from a runtime string won't be picked up
   *  by Tailwind's static scanner. Keep this comfortably below rows *
   *  cardHeight — the rotated strip must be thicker than the visible
   *  window or its corners show background through the gaps. */
  heightPx?: number;
  /** Solid color the top/bottom edges fade to. Defaults to this app's dark
   *  background rather than the vendor original's light/dark Tailwind
   *  variant, since this app doesn't do OS-driven light/dark theming. */
  fadeFromColor?: string;
  className?: string;
  cardClassName?: string;
}

const Card = ({
  card,
  width,
  height,
  className,
}: {
  card: CardItem;
  width: number;
  height: number;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "group relative shrink-0 cursor-pointer overflow-hidden rounded-xl shadow-2xl",
        className,
      )}
      style={{ width, height }}
    >
      {card.mediaType === "video" ? (
        <video
          src={card.url}
          poster={card.posterUrl}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="h-full w-full object-cover"
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={card.url} alt={card.title} className="h-full w-full object-cover" />
      )}
      <div className="absolute inset-0 bg-black/40" />
    </div>
  );
};

const MarqueeRow = ({
  cards,
  width,
  height,
  speed,
  direction,
  cardClassName,
}: {
  cards: CardItem[];
  width: number;
  height: number;
  speed: number;
  direction: 1 | -1;
  cardClassName?: string;
}) => {
  const animationClass = direction === -1 ? "animate-marquee-left" : "animate-marquee-right";

  return (
    <div className="flex w-full overflow-hidden">
      <div
        className={cn("flex shrink-0 cursor-pointer hover:[animation-play-state:paused]", animationClass)}
        style={{ "--speed": `${speed}s` } as React.CSSProperties}
      >
        <div className="flex shrink-0">
          {cards.map((card, idx) => (
            <div key={`${card.id}-${idx}`} className="shrink-0 pr-4 sm:pr-6">
              <Card card={card} width={width} height={height} className={cardClassName} />
            </div>
          ))}
        </div>
        <div className="flex shrink-0">
          {cards.map((card, idx) => (
            <div key={`${card.id}-${idx}-copy`} className="shrink-0 pr-4 sm:pr-6">
              <Card card={card} width={width} height={height} className={cardClassName} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/** Splits items round-robin across `rowCount` groups, so each row shows a
 *  different slice of the real catalogue instead of every row repeating the
 *  same full list (the vendor original's behavior — fine for a handful of
 *  demo images, but wasteful once this is wired to real, possibly numerous,
 *  gallery items). Each group is tripled so a short list still scrolls
 *  smoothly rather than visibly looping every second or two. */
function splitIntoRows(cards: CardItem[], rowCount: number): CardItem[][] {
  const groups: CardItem[][] = Array.from({ length: rowCount }, () => []);
  cards.forEach((card, i) => groups[i % rowCount].push(card));
  return groups.map((group) => (group.length > 0 ? [...group, ...group, ...group] : group));
}

export default function DiagonalMarqueeCarousel({
  cards = [],
  angle = -18,
  baseSpeed = 90,
  alternateDirections = true,
  rows = 3,
  cardWidth = 240,
  cardHeight = 170,
  heightPx = 320,
  fadeFromColor = "#0f0404",
  className = "",
  cardClassName = "",
}: DiagonalMarqueeCarouselProps) {
  if (cards.length === 0) return null;

  const rowCount = Math.max(1, Math.min(rows, cards.length));
  const rowGroups = splitIntoRows(cards, rowCount);

  return (
    <div className={cn("relative w-full overflow-hidden", className)} style={{ height: heightPx }}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes marquee-left {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-33.333%, 0, 0); }
        }
        @keyframes marquee-right {
          0% { transform: translate3d(-33.333%, 0, 0); }
          100% { transform: translate3d(0, 0, 0); }
        }
        .animate-marquee-left {
          animation: marquee-left var(--speed) linear infinite;
        }
        .animate-marquee-right {
          animation: marquee-right var(--speed) linear infinite;
        }
      `,
        }}
      />
      {/* Centered regardless of content height (rows * cardHeight varies with
          props), rather than left at its static top:0 position — off-center
          content is what would let the rotated strip's thickness undershoot
          the container at one edge even when the total thickness is enough. */}
      <div
        className="absolute z-0 top-1/2 left-1/2 flex w-[200vw] flex-col gap-4 sm:gap-6"
        style={{ transform: `translate(-50%, -50%) rotate(${angle}deg)` }}
      >
        {rowGroups.map((group, i) => (
          <MarqueeRow
            key={i}
            cards={group}
            width={cardWidth}
            height={cardHeight}
            speed={baseSpeed + i * 14}
            direction={alternateDirections && i % 2 === 1 ? 1 : -1}
            cardClassName={cardClassName}
          />
        ))}
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-1/4"
        style={{ background: `linear-gradient(180deg, ${fadeFromColor} 0%, transparent 100%)` }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-1/4"
        style={{ background: `linear-gradient(0deg, ${fadeFromColor} 0%, transparent 100%)` }}
      />
    </div>
  );
}

/**
 * Adapted from Great UI's Diagonal Marquee Carousel (https://great-ui.com,
 * MIT License, author Saurabh Sharma) — original renders a fixed 5-row,
 * full-viewport hero with a static demo image set. This version adds video
 * card support, row count / card size driven by the caller's real item
 * count, round-robin distribution of real items across rows, an inline
 * (non-fullscreen) height, and a solid dark fade matching this app's
 * always-dark theme instead of the original's OS-driven light/dark variant.
 */
