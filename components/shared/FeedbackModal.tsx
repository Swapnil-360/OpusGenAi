"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Star, X, Send, Check } from "lucide-react";

const W = {
  bg: "#0f0404",
  card: "#150505",
  border: "rgba(255,255,255,0.08)",
  glass: "rgba(255,255,255,0.04)",
  glassMid: "rgba(255,255,255,0.07)",
  text: "rgba(255,255,255,0.88)",
  muted: "rgba(255,255,255,0.45)",
  dim: "rgba(255,255,255,0.22)",
  red: "#dc2626",
  redLight: "#f87171",
};

const CATEGORIES = [
  { id: "bug", label: "Bug Report", emoji: "🐛" },
  { id: "feature", label: "Feature Request", emoji: "✨" },
  { id: "compliment", label: "Compliment", emoji: "❤️" },
  { id: "general", label: "General", emoji: "💬" },
] as const;

type Category = (typeof CATEGORIES)[number]["id"];

interface FeedbackButtonProps {
  variant?: "text" | "pill" | "icon";
}

export function FeedbackButton({ variant = "text" }: FeedbackButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {variant === "text" && (
        <button
          onClick={() => setOpen(true)}
          className="text-xs transition-colors"
          style={{ color: W.dim }}
          onMouseEnter={(e) => { e.currentTarget.style.color = W.muted; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = W.dim; }}
        >
          Send Feedback
        </button>
      )}
      {variant === "pill" && (
        <motion.button
          onClick={() => setOpen(true)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium w-full transition-all"
          style={{ background: W.glassMid, border: `1px solid ${W.border}`, color: W.muted }}
          onMouseEnter={(e) => { e.currentTarget.style.color = W.text; e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = W.muted; e.currentTarget.style.borderColor = W.border; }}
        >
          <MessageSquare className="w-3.5 h-3.5 shrink-0" />
          Give Feedback
        </motion.button>
      )}
      {variant === "icon" && (
        <button
          onClick={() => setOpen(true)}
          className="p-1.5 rounded-lg transition-all"
          style={{ color: W.muted }}
          onMouseEnter={(e) => { e.currentTarget.style.color = W.text; e.currentTarget.style.background = W.glassMid; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = W.muted; e.currentTarget.style.background = "transparent"; }}
          title="Send Feedback"
        >
          <MessageSquare className="w-4 h-4" />
        </button>
      )}

      <AnimatePresence>
        {open && <FeedbackModal onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </>
  );
}

function FeedbackModal({ onClose }: { onClose: () => void }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [category, setCategory] = useState<Category | null>(null);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const getEls = () => Array.from(modalRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
    getEls()[0]?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key !== "Tab") return;
      const els = getEls();
      if (!els.length) return;
      const first = els[0], last = els[els.length - 1];
      if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last.focus(); } }
      else { if (document.activeElement === last) { e.preventDefault(); first.focus(); } }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = ""; document.removeEventListener("keydown", onKeyDown); };
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || rating === 0 || !category) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    setSubmitting(false);
    setSubmitted(true);
    setTimeout(onClose, 2200);
  }

  const canSubmit = message.trim().length > 0 && rating > 0 && category !== null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-modal-title"
        className="relative w-full max-w-md rounded-2xl p-6 shadow-2xl"
        style={{
          background: W.card,
          border: `1px solid ${W.border}`,
          boxShadow: "0 40px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)",
        }}
        initial={{ scale: 0.94, y: 10, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.94, y: 8, opacity: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 32 }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg transition-all"
          style={{ color: W.muted }}
          onMouseEnter={(e) => { e.currentTarget.style.color = W.text; e.currentTarget.style.background = W.glassMid; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = W.muted; e.currentTarget.style.background = "transparent"; }}
        >
          <X className="w-4 h-4" />
        </button>

        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="success"
              className="flex flex-col items-center justify-center py-8 gap-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)" }}
              >
                <Check className="w-6 h-6" style={{ color: "#4ade80" }} />
              </div>
              <div className="text-center">
                <p className="text-base font-bold mb-1" style={{ color: W.text }}>Thank you!</p>
                <p className="text-sm" style={{ color: W.muted }}>Your feedback helps us improve OpusGen AI.</p>
              </div>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              onSubmit={handleSubmit}
              className="space-y-5"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Header */}
              <div className="flex items-center gap-3 pr-8">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.2)" }}
                >
                  <MessageSquare className="w-4 h-4" style={{ color: W.redLight }} />
                </div>
                <div>
                  <h2 id="feedback-modal-title" className="text-base font-black tracking-tight" style={{ color: W.text }}>
                    Share your feedback
                  </h2>
                  <p className="text-xs" style={{ color: W.muted }}>Help us make OpusGen AI better</p>
                </div>
              </div>

              {/* Star Rating */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: W.dim }}>
                  How would you rate your experience?
                </p>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const filled = star <= (hoverRating || rating);
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="transition-transform"
                        style={{ transform: filled ? "scale(1.1)" : "scale(1)" }}
                      >
                        <Star
                          className="w-7 h-7 transition-all"
                          style={{
                            fill: filled ? "#f59e0b" : "transparent",
                            color: filled ? "#f59e0b" : W.border,
                            filter: filled ? "drop-shadow(0 0 4px rgba(245,158,11,0.5))" : "none",
                          }}
                        />
                      </button>
                    );
                  })}
                  {(hoverRating || rating) > 0 && (
                    <span className="text-xs ml-2" style={{ color: W.muted }}>
                      {["", "Poor", "Fair", "Good", "Great", "Amazing!"][hoverRating || rating]}
                    </span>
                  )}
                </div>
              </div>

              {/* Category */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: W.dim }}>
                  Category
                </p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => {
                    const active = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                        style={{
                          background: active ? "rgba(220,38,38,0.14)" : W.glass,
                          border: `1px solid ${active ? "rgba(220,38,38,0.4)" : W.border}`,
                          color: active ? W.redLight : W.muted,
                        }}
                        onMouseEnter={(e) => { if (!active) { e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)"; e.currentTarget.style.color = W.text; } }}
                        onMouseLeave={(e) => { if (!active) { e.currentTarget.style.borderColor = W.border; e.currentTarget.style.color = W.muted; } }}
                      >
                        <span>{cat.emoji}</span>
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Message */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: W.dim }}>
                  Your message <span style={{ color: W.redLight }}>*</span>
                </p>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us what you think, what's broken, or what you'd love to see…"
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none transition-all"
                  style={{
                    background: W.glassMid,
                    border: `1px solid ${W.border}`,
                    color: W.text,
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(220,38,38,0.4)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(220,38,38,0.08)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = W.border; e.currentTarget.style.boxShadow = "none"; }}
                />
              </div>

              {/* Email (optional) */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: W.dim }}>
                  Email <span style={{ color: W.muted }}>(optional — for follow-up)</span>
                </p>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full h-9 px-3 rounded-xl text-sm outline-none transition-all"
                  style={{ background: W.glassMid, border: `1px solid ${W.border}`, color: W.text }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(220,38,38,0.4)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(220,38,38,0.08)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = W.border; e.currentTarget.style.boxShadow = "none"; }}
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 h-10 rounded-xl text-sm font-medium transition-all"
                  style={{ background: W.glass, border: `1px solid ${W.border}`, color: W.muted }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = W.text; e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = W.muted; e.currentTarget.style.borderColor = W.border; }}
                >
                  Cancel
                </button>
                <motion.button
                  type="submit"
                  disabled={!canSubmit || submitting}
                  whileHover={canSubmit ? { scale: 1.02, boxShadow: "0 0 24px rgba(220,38,38,0.45)" } : {}}
                  whileTap={canSubmit ? { scale: 0.97 } : {}}
                  className="flex-1 h-10 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all"
                  style={{
                    background: canSubmit ? W.red : "rgba(220,38,38,0.3)",
                    boxShadow: canSubmit ? "0 0 14px rgba(220,38,38,0.25)" : "none",
                    cursor: canSubmit ? "pointer" : "not-allowed",
                  }}
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Submit
                    </>
                  )}
                </motion.button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
