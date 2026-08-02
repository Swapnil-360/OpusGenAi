"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ShieldCheck, LogOut } from "lucide-react";
import { toast } from "sonner";
import { LogoBrand } from "@/components/shared/LogoBrand";
import { createClient } from "@/lib/supabase/client";

export default function MfaChallengePage() {
  return (
    <Suspense>
      <MfaChallengeForm />
    </Suspense>
  );
}

function MfaChallengeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/generate";
  const supabase = createClient();

  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error || !data) { toast.error("Couldn't load your security factors."); setReady(true); return; }
      const verified = data.totp.find((f) => f.status === "verified");
      if (!verified) {
        // No verified factor after all — nothing to challenge, let middleware settle it.
        router.replace(redirectTo);
        return;
      }
      setFactorId(verified.id);
      setReady(true);
      setTimeout(() => inputRef.current?.focus(), 50);
    })();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId || code.length !== 6) return;
    setLoading(true);

    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });

    if (error) {
      toast.error(error.message || "Invalid code. Try again.");
      setCode("");
      inputRef.current?.focus();
      setLoading(false);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="w-full max-w-md"
    >
      <div className="relative rounded-3xl overflow-hidden" style={{ padding: "1.5px" }}>
        <div className="absolute inset-0 rounded-3xl" style={{ background: "rgba(180,18,18,0.32)" }} />
        <div
          className="relative rounded-3xl overflow-hidden px-8 py-10"
          style={{ background: "linear-gradient(160deg, #130505 0%, #0a0202 100%)" }}
        >
          <div className="flex flex-col items-center mb-8">
            <div className="mb-4">
              <LogoBrand imgClass="h-11 w-auto" />
            </div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.3)" }}>
              <ShieldCheck className="w-5 h-5" style={{ color: "#f87171" }} />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">Two-factor verification</h1>
            <p className="text-sm mt-1.5 text-center" style={{ color: "rgba(255,255,255,0.55)" }}>
              Enter the 6-digit code from your authenticator app
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              ref={inputRef}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              disabled={!ready || loading}
              className="w-full h-14 rounded-2xl text-center text-2xl font-black tracking-[0.5em] outline-none transition-all placeholder:opacity-30 disabled:opacity-50"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(220,38,38,0.65)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(220,38,38,0.1)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.boxShadow = "none"; }}
              required
            />

            <motion.button
              type="submit"
              whileHover={{ scale: 1.02, boxShadow: "0 0 48px rgba(220,38,38,0.5)" }}
              whileTap={{ scale: 0.97 }}
              disabled={!ready || loading || code.length !== 6}
              className="w-full flex items-center justify-center gap-2 h-13 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-[15px] transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none"
              style={{ boxShadow: "0 0 28px rgba(220,38,38,0.28)" }}
            >
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Verify"}
            </motion.button>
          </form>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-1.5 mt-5 text-xs font-medium transition-opacity hover:opacity-80"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            <LogOut className="w-3 h-3" />
            Not you? Sign out
          </button>
        </div>
      </div>
    </motion.div>
  );
}
