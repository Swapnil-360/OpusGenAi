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

          {/* Content — height follows its own content; the grid row stretches
              every card in a row to match the tallest, so sizing stays even
              without a guessed fixed height. */}
          <div className="z-10 flex flex-col flex-1 p-5 sm:p-6">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-background/60 px-2.5 py-1 text-xs sm:text-sm font-medium text-foreground/80 backdrop-blur-sm w-fit">
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: badgeColor }}
              />
              {badgeText}
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-foreground mb-1.5 leading-tight">{title}</h3>
            <p className="text-sm text-foreground/70 flex-1">{description}</p>

            <a
              href={ctaHref}
              className="group mt-5 inline-flex items-center gap-2 text-sm font-semibold text-foreground"
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
