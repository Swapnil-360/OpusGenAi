"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Eye, EyeOff, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { LogoBrand } from "@/components/shared/LogoBrand";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  // Arriving here means /auth/callback already exchanged the recovery link's
  // code for a real session — checked so a direct/expired-link visit shows a
  // clear error instead of a form that fails confusingly on submit.
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session);
      setCheckingSession(false);
    });
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords don't match.");
      return;
    }
    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Password updated!");
    router.push("/generate");
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
          {checkingSession ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-white/20 border-t-red-500 rounded-full animate-spin" />
            </div>
          ) : !hasSession ? (
            <div className="flex flex-col items-center text-center">
              <div className="mb-4">
                <LogoBrand imgClass="h-11 w-auto" />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-white mb-1.5">Link expired</h1>
              <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.55)" }}>
                This password reset link is invalid or has expired. Request a new one to continue.
              </p>
              <Link
                href="/forgot-password"
                className="w-full flex items-center justify-center h-12 rounded-2xl font-bold text-sm text-white transition-all"
                style={{ background: "#dc2626" }}
              >
                Request new link
              </Link>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center mb-8">
                <div className="mb-4">
                  <LogoBrand imgClass="h-11 w-auto" />
                </div>
                <h1 className="text-2xl font-black tracking-tight text-white">Set a new password</h1>
                <p className="text-sm mt-1.5 text-center" style={{ color: "rgba(255,255,255,0.55)" }}>
                  Choose a new password for your account
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>
                    New password
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(255,255,255,0.35)" }} />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      minLength={6}
                      className="w-full h-12 rounded-2xl pl-11 pr-12 text-sm outline-none transition-all placeholder:opacity-50"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.9)" }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(220,38,38,0.65)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(220,38,38,0.1)"; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.boxShadow = "none"; }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center transition-opacity hover:opacity-80"
                      style={{ color: "rgba(255,255,255,0.55)" }}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>
                    Confirm password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    minLength={6}
                    className="w-full h-12 rounded-2xl px-4 text-sm outline-none transition-all placeholder:opacity-50"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.9)" }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(220,38,38,0.65)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(220,38,38,0.1)"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.boxShadow = "none"; }}
                    required
                  />
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
                      Update password
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
    </motion.div>
  );
}
