"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Mail, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { LogoBrand } from "@/components/shared/LogoBrand";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    setLoading(false);

    // Same confirmation whether or not the address has an account — this
    // page must not reveal which emails are registered.
    if (error) {
      toast.error("Something went wrong. Try again.");
      return;
    }
    setSent(true);
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
          className="card-spin absolute"
          style={{
            width: "200%",
            height: "200%",
            top: "-50%",
            left: "-50%",
            background:
              "conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(251,113,133,0.5) 18deg, rgba(239,68,68,1) 50deg, rgba(251,146,60,0.8) 72deg, rgba(239,68,68,0.5) 96deg, transparent 136deg, transparent 230deg, rgba(220,38,38,0.9) 278deg, rgba(251,113,133,0.4) 308deg, transparent 340deg)",
          }}
        />

        <div
          className="relative rounded-3xl overflow-hidden px-8 py-10"
          style={{ background: "linear-gradient(160deg, #130505 0%, #0a0202 100%)" }}
        >
          {sent ? (
            <div className="flex flex-col items-center text-center">
              <div className="mb-4">
                <LogoBrand imgClass="h-11 w-auto" />
              </div>
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.35)" }}
              >
                <MailCheck className="w-5 h-5" style={{ color: "#f87171" }} />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-white mb-1.5">Check your email</h1>
              <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.55)" }}>
                If an account exists for <span style={{ color: "rgba(255,255,255,0.8)" }}>{email}</span>, we&apos;ve sent a link to reset your password.
              </p>
              <Link
                href="/login"
                className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl font-semibold text-sm transition-all"
                style={{ border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.82)" }}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center mb-8">
                <div className="mb-4">
                  <LogoBrand imgClass="h-11 w-auto" />
                </div>
                <h1 className="text-2xl font-black tracking-tight text-white">Reset your password</h1>
                <p className="text-sm mt-1.5 text-center" style={{ color: "rgba(255,255,255,0.55)" }}>
                  Enter your email and we&apos;ll send you a reset link
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(255,255,255,0.35)" }} />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-12 rounded-2xl pl-11 pr-4 text-sm outline-none transition-all placeholder:opacity-50"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.9)" }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(220,38,38,0.65)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(220,38,38,0.1)"; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.boxShadow = "none"; }}
                      required
                    />
                  </div>
                </div>

                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02, boxShadow: "0 0 48px rgba(220,38,38,0.5)" }}
                  whileTap={{ scale: 0.97 }}
                  disabled={loading}
                  className="group w-full flex items-center justify-center gap-3 h-13 pl-6 pr-2 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-[15px] transition-all mt-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none"
                  style={{ boxShadow: "0 0 28px rgba(220,38,38,0.28)" }}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Send reset link
                      <span className="flex items-center justify-center w-9 h-9 rounded-full" style={{ background: "rgba(255,255,255,0.18)" }}>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </>
                  )}
                </motion.button>
              </form>
            </>
          )}
        </div>
      </div>

      {!sent && (
        <p className="text-center text-sm mt-5" style={{ color: "rgba(255,255,255,0.55)" }}>
          Remembered it?{" "}
          <Link href="/login" className="font-semibold hover:opacity-80 transition-opacity" style={{ color: "#f87171" }}>
            Back to sign in
          </Link>
        </p>
      )}
    </motion.div>
  );
}
