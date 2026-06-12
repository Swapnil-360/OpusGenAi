"use client";

import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreditBadgeProps {
  credits: number;
  className?: string;
  compact?: boolean;
}

export function CreditBadge({ credits, className, compact }: CreditBadgeProps) {
  const colorClass =
    credits === 0
      ? "text-destructive border-destructive/30 bg-destructive/10"
      : credits <= 5
      ? "text-amber-400 border-amber-400/30 bg-amber-400/10"
      : "text-emerald-400 border-emerald-400/30 bg-emerald-400/10";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold transition-colors",
        colorClass,
        compact && "px-2 py-0.5",
        className
      )}
    >
      <Zap className={cn("shrink-0", compact ? "w-2.5 h-2.5" : "w-3 h-3")} />
      <span>{credits}</span>
      {!compact && <span className="font-normal opacity-70">credits</span>}
    </div>
  );
}
