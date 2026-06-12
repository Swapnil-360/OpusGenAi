"use client";

import { motion } from "framer-motion";

interface LogoBrandProps {
  imgClass?: string;
  textClass?: string;
}

export function LogoBrand({
  imgClass = "h-10 w-auto",
  textClass = "text-xl",
}: LogoBrandProps) {
  return (
    <span className="flex items-center gap-2.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo/OpusGen%20Ai(Orange).png"
        alt="OpusGen AI"
        className={imgClass}
      />
      <span className={`font-bold tracking-tight text-white ${textClass}`}>
        OpusGen
      </span>
      <motion.span
        className={`font-bold tracking-tight ${textClass}`}
        animate={{ color: ["#ef4444", "#f97316", "#fbbf24", "#f97316", "#ef4444"] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      >
        Ai
      </motion.span>
    </span>
  );
}
