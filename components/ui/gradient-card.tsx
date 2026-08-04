import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

const cardVariants = cva(
  "relative flex flex-col justify-between h-full w-full overflow-hidden rounded-2xl p-8 shadow-sm transition-shadow duration-300 hover:shadow-lg",
  {
    variants: {
      gradient: {
        orange: "bg-gradient-to-br from-orange-100 to-amber-200/50",
        gray: "bg-gradient-to-br from-slate-100 to-slate-200/50",
        purple: "bg-gradient-to-br from-purple-100 to-indigo-200/50",
        green: "bg-gradient-to-br from-emerald-100 to-teal-200/50",
      },
    },
    defaultVariants: {
      gradient: "gray",
    },
  }
);

export interface GradientCardProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {
  badgeText: string;
  badgeColor: string; // hex color, e.g. "#FF5733"
  title: string;
  description: string;
  ctaText: string;
  ctaHref: string;
  imageUrl: string;
}

const GradientCard = React.forwardRef<HTMLDivElement, GradientCardProps>(
  ({ className, gradient, badgeText, badgeColor, title, description, ctaText, ctaHref, imageUrl, ...props }, ref) => {
    const cardAnimation = {
      rest: { scale: 1, y: 0 },
      hover: { scale: 1.03, y: -4 },
    };

    const imageAnimation = {
      rest: { scale: 1, rotate: 0 },
      hover: { scale: 1.1, rotate: 3 },
    };

    return (
      <motion.div
        variants={cardAnimation}
        initial="rest"
        whileHover="hover"
        animate="rest"
        className="h-full"
        ref={ref}
      >
        <div
          className={cn(cardVariants({ gradient }), className)}
          {...props}
        >
          {/* Contained thumbnail, not a full-bleed background graphic — a real
              screenshot needs its edges intact (text near the border shouldn't
              get clipped), unlike an abstract decorative icon. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <motion.img
            src={imageUrl}
            alt={`${title} preview`}
            variants={imageAnimation}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            className="absolute right-4 bottom-4 w-2/5 aspect-video rounded-lg object-cover shadow-lg pointer-events-none"
            style={{ border: "1px solid rgba(255,255,255,0.4)" }}
          />

          <div className="z-10 flex flex-col h-full">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-background/50 px-3 py-1 text-sm font-medium text-foreground/80 backdrop-blur-sm w-fit">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: badgeColor }}
              />
              {badgeText}
            </div>

            <div className="flex-grow">
              <h3 className="text-2xl font-bold text-foreground mb-2">{title}</h3>
              <p className="text-foreground/70 max-w-xs">{description}</p>
            </div>

            <a
              href={ctaHref}
              className="group mt-6 inline-flex items-center gap-2 text-sm font-semibold text-foreground"
            >
              {ctaText}
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </a>
          </div>
        </div>
      </motion.div>
    );
  }
);
GradientCard.displayName = "GradientCard";

export { GradientCard, cardVariants };
