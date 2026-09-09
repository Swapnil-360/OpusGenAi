"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Sparkles, X, Zap } from "lucide-react";
import { PLAN_LIMITS, type Plan } from "@/lib/plans";
import { toast } from "sonner";

export function triggerUpgradeModal(suggestedPlan?: Plan) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("opusgen:upgrade", {
        detail: { plan: suggestedPlan },
      }),
    );
  }
}

export function UpgradeModal() {
  const [open, setOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"basic" | "pro">("pro");

  useEffect(() => {
    function handleOpen(e: Event) {
      const customEvent = e as CustomEvent<{ plan?: Plan }>;
      const target = customEvent.detail?.plan;
      if (target === "basic" || target === "pro") {
        setSelectedPlan(target);
      }
      setOpen(true);
    }

    window.addEventListener("opusgen:upgrade", handleOpen);
    return () => window.removeEventListener("opusgen:upgrade", handleOpen);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const [loadingPlan, setLoadingPlan] = useState<"basic" | "pro" | null>(null);

  const basic = PLAN_LIMITS.basic;
  const pro = PLAN_LIMITS.pro;

  async function handleCheckout(planKey: "basic" | "pro") {
    if (loadingPlan) return;
    setLoadingPlan(planKey);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planKey }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Failed to start checkout session.");
        return;
      }
      if (data.url) {
        toast.success("Redirecting to checkout…");
        window.location.href = data.url;
      } else {
        toast.error("Checkout URL not received.");
      }
    } catch {
      toast.error("Network error. Could not start checkout.");
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => setOpen(false)}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="relative w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl z-10 border border-white/10"
            style={{ background: "#0d0303" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 pb-4 border-b border-white/10 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="p-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
                    <Zap className="w-4 h-4" />
                  </span>
                  <h2 className="text-lg font-bold text-white">
                    Upgrade Your Plan
                  </h2>
                </div>
                <p className="text-xs text-white/50">
                  Choose the plan that fits your creative volume. Unlock higher
                  resolution, AI video, and monthly credits.
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Plans Grid */}
            <div className="p-6 grid sm:grid-cols-2 gap-4">
              {/* Basic Plan */}
              <div
                onClick={() => setSelectedPlan("basic")}
                className={`cursor-pointer rounded-xl p-5 border transition-all relative flex flex-col justify-between ${
                  selectedPlan === "basic"
                    ? "border-red-500/40 bg-red-950/20 shadow-lg shadow-red-950/30"
                    : "border-white/10 bg-white/[0.02] hover:border-white/20"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-white text-sm">
                      {basic.name}
                    </h3>
                  </div>
                  <div className="flex items-baseline gap-1 mb-3">
                    <span className="text-2xl font-black text-white">
                      ${basic.price}
                    </span>
                    <span className="text-xs text-white/40">/month</span>
                  </div>
                  <ul className="space-y-2 mb-6">
                    {basic.features.map((f, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-2 text-xs text-white/70"
                      >
                        <Check className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCheckout("basic");
                  }}
                  disabled={loadingPlan !== null}
                  className="w-full py-2.5 px-4 rounded-lg text-xs font-semibold border border-white/20 hover:bg-white/10 text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loadingPlan === "basic" ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Redirecting…
                    </>
                  ) : (
                    "Get Basic"
                  )}
                </button>
              </div>

              {/* Pro Plan */}
              <div
                onClick={() => setSelectedPlan("pro")}
                className={`cursor-pointer rounded-xl p-5 border transition-all relative flex flex-col justify-between ${
                  selectedPlan === "pro"
                    ? "border-red-500 bg-red-950/30 shadow-xl shadow-red-950/50 ring-1 ring-red-500/50"
                    : "border-white/10 bg-white/[0.02] hover:border-white/20"
                }`}
              >
                <div className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-600 text-white shadow-md flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> Popular
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-white text-sm">{pro.name}</h3>
                  </div>
                  <div className="flex items-baseline gap-1.5 mb-3">
                    <span className="text-2xl font-black text-white">
                      ${pro.price}
                    </span>
                    {pro.originalPrice && (
                      <span className="text-xs text-white/30 line-through">
                        ${pro.originalPrice}
                      </span>
                    )}
                    <span className="text-xs text-white/40">/month</span>
                  </div>
                  <ul className="space-y-2 mb-6">
                    {pro.features.map((f, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-2 text-xs text-white/80"
                      >
                        <Check className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCheckout("pro");
                  }}
                  disabled={loadingPlan !== null}
                  className="w-full py-2.5 px-4 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-900/30 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loadingPlan === "pro" ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Redirecting…
                    </>
                  ) : (
                    "Get Pro"
                  )}
                </button>
              </div>
            </div>

            {/* Footer notice */}
            <div className="px-6 py-3 border-t border-white/5 bg-white/[0.01] flex items-center justify-between text-[11px] text-white/40">
              <span>Subscriptions renew monthly. Cancel anytime.</span>
              <span>Credits refill each billing cycle</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
