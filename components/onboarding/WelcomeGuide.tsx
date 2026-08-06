"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Check, Coins, ImagePlus, Layers,
  Sparkles, Wand2, X,
} from "lucide-react";

// Versioned so the guide can be re-shown to everyone after a substantial
// rewrite by bumping the suffix, without disturbing anything else in storage.
const SEEN_KEY = "opusgen:welcome-guide-seen-v1";

const W = {
  panel: "#120404",
  border: "rgba(255,255,255,0.09)",
  glass: "rgba(255,255,255,0.05)",
  glassDim: "rgba(255,255,255,0.03)",
  text: "rgba(255,255,255,0.90)",
  muted: "rgba(255,255,255,0.55)",
  dim: "rgba(255,255,255,0.32)",
  red: "#f87171",
  redBg: "rgba(220,38,38,0.12)",
  redBorder: "rgba(220,38,38,0.35)",
};

type Step = {
  icon: typeof Sparkles;
  eyebrow: string;
  title: string;
  body: string;
  points: string[];
};

// Deliberately describes only what the app actually does today — every tool,
// count and credit figure here matches the shipped product.
const STEPS: Step[] = [
  {
    icon: Sparkles,
    eyebrow: "Welcome",
    title: "Studio-quality product photos, without the studio",
    body:
      "OpusGen AI turns a plain product photo into polished marketing visuals in seconds — no photographer, lightbox or editing software needed.",
    points: [
      "Upload a photo and describe the scene you want",
      "Your product stays accurate — shape, label and logo intact",
      "Results are ready to post or list straight away",
    ],
  },
  {
    icon: ImagePlus,
    eyebrow: "Step 1",
    title: "Generate your first image",
    body:
      "Head to Generate, upload your product, then describe the scene — or pick a template and let it write the prompt for you.",
    points: [
      "Add a photo for AI scene placement, or go text-only",
      "Use Enhance to sharpen a rough prompt into a detailed one",
      "Choose an aspect ratio to match where you'll publish",
    ],
  },
  {
    icon: Layers,
    eyebrow: "Step 2",
    title: "Start from a template",
    body:
      "Templates are ready-made looks — luxury marble, minimal studio, lifestyle and more — covering both product shots and personal photos.",
    points: [
      "Production templates for products, Universal for your own photos",
      "Browse by category or search, then preview before applying",
      "Applying one fills in the prompt so you can tweak it",
    ],
  },
  {
    icon: Wand2,
    eyebrow: "Step 3",
    title: "Refine with the image tools",
    body:
      "Six tools handle the cleanup work: remove or replace a background, erase distractions, expand the frame, or upscale for print.",
    points: [
      "Remove BG and Replace BG for clean or reimagined backdrops",
      "Cleanup paints out unwanted objects; Uncrop extends the frame",
      "Upscale 4× produces print-ready resolution",
    ],
  },
  {
    icon: Coins,
    eyebrow: "Credits",
    title: "How credits work",
    body:
      "Every account starts with 10 free credits and no card required. Each action costs credits based on how much AI work it takes.",
    points: [
      "Premium generation with your product photo costs 3 credits",
      "Cleanup and Uncrop cost 3, Replace BG and Upscale 2",
      "Your balance is always visible in the sidebar",
    ],
  },
];

/** True when this browser has never completed or skipped the guide. */
export function shouldAutoOpenGuide(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return !window.localStorage.getItem(SEEN_KEY);
  } catch {
    // Private mode / storage blocked — don't nag on every page load.
    return false;
  }
}

function markGuideSeen() {
  try {
    window.localStorage.setItem(SEEN_KEY, new Date().toISOString());
  } catch {
    /* storage unavailable — the guide simply shows again next time */
  }
}

export function WelcomeGuide({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;

  const finish = useCallback(() => {
    markGuideSeen();
    onClose();
  }, [onClose]);

  // Always reopen at the beginning rather than wherever it was last dismissed.
  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  // Held in a ref so the scroll-lock effect below depends only on `open`.
  // Callers pass an inline onClose, so `finish` changes identity every render;
  // depending on it re-ran this effect constantly, and the cleanup would
  // restore the "hidden" it had just set — leaving the page unscrollable
  // after the guide closed.
  const finishRef = useRef(finish);
  useEffect(() => { finishRef.current = finish; });

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") finishRef.current();
    }
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open]);

  const current = STEPS[step];
  const Icon = current.icon;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
        >
          <motion.div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={finish} />

          <motion.div
            initial={{ scale: 0.94, y: 18 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 12, opacity: 0 }}
            transition={{ type: "spring", stiffness: 340, damping: 30 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="welcome-guide-title"
            className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto no-scrollbar rounded-3xl shadow-2xl"
            style={{ background: W.panel, border: `1px solid ${W.border}` }}
          >
            <button
              onClick={finish}
              aria-label="Close guide"
              className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center transition-colors z-10"
              style={{ background: W.glass, border: `1px solid ${W.border}`, color: W.dim }}
              onMouseEnter={(e) => { e.currentTarget.style.color = W.text; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = W.dim; }}
            >
              <X className="w-4 h-4" />
            </button>

            <div className="p-6 sm:p-7">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 14 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -14 }}
                  transition={{ duration: 0.2 }}
                >
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4"
                    style={{ background: W.redBg, border: `1px solid ${W.redBorder}` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: W.red }} />
                  </div>

                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: W.red }}>
                    {current.eyebrow}
                  </p>
                  <h2
                    id="welcome-guide-title"
                    className="text-xl sm:text-2xl font-black tracking-tight leading-tight mb-2"
                    style={{ color: W.text }}
                  >
                    {current.title}
                  </h2>
                  <p className="text-sm leading-relaxed mb-4" style={{ color: W.muted }}>
                    {current.body}
                  </p>

                  <ul className="flex flex-col gap-2 mb-1">
                    {current.points.map((point) => (
                      <li
                        key={point}
                        className="flex items-start gap-2.5 p-2.5 rounded-xl"
                        style={{ background: W.glassDim, border: `1px solid ${W.border}` }}
                      >
                        <Check className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: W.red }} />
                        <span className="text-xs leading-relaxed" style={{ color: W.muted }}>{point}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </AnimatePresence>
            </div>

            <div
              className="flex items-center justify-between gap-3 px-6 sm:px-7 py-4 sticky bottom-0"
              style={{ borderTop: `1px solid ${W.border}`, background: W.panel }}
            >
              <div className="flex items-center gap-1.5" role="tablist" aria-label="Guide progress">
                {STEPS.map((s, i) => (
                  <button
                    key={s.eyebrow}
                    onClick={() => setStep(i)}
                    aria-label={`Go to step ${i + 1}: ${s.title}`}
                    aria-selected={i === step}
                    role="tab"
                    className="h-1.5 rounded-full transition-all"
                    style={{
                      width: i === step ? 20 : 6,
                      background: i === step ? W.red : "rgba(255,255,255,0.18)",
                    }}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                {step > 0 && (
                  <button
                    onClick={() => setStep((s) => s - 1)}
                    className="h-9 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
                    style={{ border: `1px solid ${W.border}`, background: W.glass, color: W.muted }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = W.text; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = W.muted; }}
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />Back
                  </button>
                )}
                {!isLast && (
                  <button
                    onClick={finish}
                    className="h-9 px-3 rounded-xl text-xs font-medium transition-colors"
                    style={{ color: W.dim }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = W.text; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = W.dim; }}
                  >
                    Skip
                  </button>
                )}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => (isLast ? finish() : setStep((s) => s + 1))}
                  className="h-9 px-4 rounded-xl text-xs font-bold text-white flex items-center gap-1.5"
                  style={{ background: "#dc2626" }}
                >
                  {isLast ? <>Get started<Sparkles className="w-3.5 h-3.5" /></> : <>Next<ArrowRight className="w-3.5 h-3.5" /></>}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
