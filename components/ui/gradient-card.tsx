import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

const cardVariants = cva(
  "relative flex flex-col h-full w-full overflow-hidden rounded-2xl shadow-sm transition-shadow duration-300 hover:shadow-lg",
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
      rest: { y: 0 },
      hover: { y: -4 },
    };

    const imageAnimation = {
      rest: { scale: 1 },
      hover: { scale: 1.06 },
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
          {/* Image banner — its own slot in normal document flow, full card
              width. A real screenshot needs dedicated space, not a floating
              corner overlay that text can run into at narrow widths. */}
          <div className="relative w-full aspect-video overflow-hidden shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <motion.img
              src={imageUrl}
              alt={`${title} preview`}
              variants={imageAnimation}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>

          {/* Content — compact, professional density (not oversized): small
              type scale, tight padding, description capped to 2 lines so a
              longer blurb can't balloon one card taller than its row-mates. */}
          <div className="z-10 flex flex-col flex-1 p-3 sm:p-4">
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-background/60 px-2 py-0.5 text-[10px] sm:text-xs font-medium text-foreground/80 backdrop-blur-sm w-fit">
              <span
                className="h-1.5 w-1.5 rounded-full shrink-0"
                style={{ backgroundColor: badgeColor }}
              />
              {badgeText}
            </div>

            <h3 className="text-sm sm:text-base font-bold text-foreground mb-1 leading-tight">{title}</h3>
            <p className="text-xs sm:text-[13px] leading-relaxed text-foreground/70 flex-1 line-clamp-2">{description}</p>

            <a
              href={ctaHref}
              className="group mt-3 inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-foreground"
            >
              {ctaText}
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
            </a>
          </div>
        </div>
      </motion.div>
    );
  }
);
GradientCard.displayName = "GradientCard";

export { GradientCard, cardVariants };
