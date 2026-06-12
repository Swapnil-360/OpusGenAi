"use client";

import { Glow } from "@/components/ui/glow";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function GlowHeroDemo() {
  return (
    <div className="min-h-[600px] w-full relative bg-background flex flex-col items-center justify-center p-8">
      {/* Background with Glow */}
      <div className="absolute inset-0 overflow-hidden">
        <Glow
          variant="interactive"
          className={cn(
            "opacity-50",
            "scale-125",
            "blur-3xl"
          )}
        />
      </div>

      {/* Card Content */}
      <Card className="relative z-10 p-8 bg-background size-40 border-none shadow-2xl">

      </Card>
    </div>
  );
}
