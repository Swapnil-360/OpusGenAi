"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { LogoBrand } from "@/components/shared/LogoBrand";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agreed) return;
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    setEmailSent(true);
    setLoading(false);
  }

  async function handleGoogle() {
    setGoogleLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      toast.error(error.message);
      setGoogleLoading(false);
    }
  }

  const inputStyle = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "rgba(255,255,255,0.9)",
  };

  if (emailSent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md text-center"
      >
        <div className="relative rounded-3xl overflow-hidden" style={{ padding: "1.5px" }}>
          <div className="absolute inset-0 rounded-3xl" style={{ background: "rgba(180,18,18,0.32)" }} />
          <div
            className="card-spin absolute"
            style={{
              width: "200%", height: "200%", top: "-50%", left: "-50%",
              background: "conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(251,113,133,0.5) 18deg, rgba(239,68,68,1) 50deg, rgba(251,146,60,0.8) 72deg, rgba(239,68,68,0.5) 96deg, transparent 136deg, transparent 230deg, rgba(220,38,38,0.9) 278deg, rgba(251,113,133,0.4) 308deg, transparent 340deg)",
            }}
          />
          <div className="relative rounded-3xl px-8 py-12" style={{ background: "linear-gradient(160deg, #130505 0%, #0a0202 100%)" }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: "rgba(220,38,38,0.15)", border: "1.5px solid rgba(220,38,38,0.4)" }}>
              <Check className="w-8 h-8 text-red-400" strokeWidth={2.5} />
            </div>
            <h2 className="text-2xl font-black text-white mb-3">Check your email</h2>
            <p className="text-sm leading-relaxed mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>
              We sent a confirmation link to
            </p>
            <p className="text-sm font-semibold mb-6" style={{ color: "rgba(255,255,255,0.85)" }}>{email}</p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
              Click the link in the email to activate your account. Check spam if you don&apos;t see it.
            </p>
          </div>
        </div>
        <p className="text-center text-sm mt-5" style={{ color: "rgba(255,255,255,0.55)" }}>
          Already confirmed?{" "}
          <Link href="/login" className="font-semibold hover:opacity-80 transition-opacity" style={{ color: "#f87171" }}>
            Sign in
          </Link>
        </p>
      </motion.div>
    );
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
            width: "200%", height: "200%", top: "-50%", left: "-50%",
            background: "conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(251,113,133,0.5) 18deg, rgba(239,68,68,1) 50deg, rgba(251,146,60,0.8) 72deg, rgba(239,68,68,0.5) 96deg, transparent 136deg, transparent 230deg, rgba(220,38,38,0.9) 278deg, rgba(251,113,133,0.4) 308deg, transparent 340deg)",
          }}
        />

        <div
          className="relative rounded-3xl overflow-hidden px-8 py-10"
          style={{ background: "linear-gradient(160deg, #130505 0%, #0a0202 100%)" }}
        >
          <div className="flex flex-col items-center mb-7">
            <div className="relative mb-4">
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(220,38,38,0.25) 0%, transparent 70%)", filter: "blur(14px)", transform: "scale(1.8)" }}
              />
              <LogoBrand imgClass="h-11 w-auto" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">Create account</h1>
            <p className="text-sm mt-1.5" style={{ color: "rgba(255,255,255,0.55)" }}>
              Join OpusGen AI — free to start
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center gap-3 h-12 rounded-2xl font-semibold text-sm transition-all mb-5 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
            style={{ border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.82)" }}
            onClick={handleGoogle}
            disabled={googleLoading || loading}
          >
            {googleLoading ? (
              <div className="w-4 h-4 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            Continue with Google
          </motion.button>

          <div className="relative mb-5">
            <div className="w-full" style={{ height: "1px", background: "rgba(255,255,255,0.08)" }} />
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 text-xs" style={{ background: "#0d0303", color: "rgba(255,255,255,0.50)" }}>
              or sign up with email
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>Full name</label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                placeholder="Your name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full h-12 rounded-2xl px-4 text-sm outline-none transition-all placeholder:opacity-50"
                style={inputStyle}
                onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(220,38,38,0.65)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(220,38,38,0.1)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.boxShadow = "none"; }}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 rounded-2xl px-4 text-sm outline-none transition-all placeholder:opacity-50"
                style={inputStyle}
                onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(220,38,38,0.65)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(220,38,38,0.1)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.boxShadow = "none"; }}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>Password</label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Min. 8 characters"
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 rounded-2xl px-4 pr-12 text-sm outline-none transition-all placeholder:opacity-50"
                  style={inputStyle}
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

            <label className="flex items-start gap-3 cursor-pointer pt-1" onClick={() => setAgreed((v) => !v)}>
              <div
                className="mt-0.5 w-5 h-5 rounded-md shrink-0 flex items-center justify-center transition-all"
                style={{
                  background: agreed ? "#dc2626" : "rgba(255,255,255,0.05)",
                  border: `1.5px solid ${agreed ? "#dc2626" : "rgba(255,255,255,0.15)"}`,
                  boxShadow: agreed ? "0 0 10px rgba(220,38,38,0.4)" : "none",
                }}
              >
                <AnimatePresence>
                  {agreed && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 25 }}
                    >
                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <p className="text-xs leading-relaxed select-none" style={{ color: "rgba(255,255,255,0.55)" }}>
                I agree to the{" "}
                <Link href="/terms" target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-2 hover:opacity-80" style={{ color: "#f87171" }} onClick={(e) => e.stopPropagation()}>
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-2 hover:opacity-80" style={{ color: "#f87171" }} onClick={(e) => e.stopPropagation()}>
                  Privacy Policy
                </Link>
              </p>
            </label>

            <motion.button
              type="submit"
              disabled={!agreed || loading || googleLoading}
              whileHover={agreed ? { scale: 1.02, boxShadow: "0 0 48px rgba(220,38,38,0.5)" } : {}}
              whileTap={agreed ? { scale: 0.97 } : {}}
              className="group w-full flex items-center justify-center gap-3 h-13 pl-6 pr-2 rounded-full text-white font-bold text-[15px] transition-all mt-1"
              style={{
                background: agreed ? "#dc2626" : "rgba(220,38,38,0.3)",
                boxShadow: agreed ? "0 0 28px rgba(220,38,38,0.28)" : "none",
                cursor: agreed ? "pointer" : "not-allowed",
              }}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Create account
                  <span className="flex items-center justify-center w-9 h-9 rounded-full" style={{ background: agreed ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.08)" }}>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </>
              )}
            </motion.button>
          </form>
        </div>
      </div>

      <p className="text-center text-sm mt-5" style={{ color: "rgba(255,255,255,0.55)" }}>
        Already have an account?{" "}
        <Link href="/login" className="font-semibold hover:opacity-80 transition-opacity" style={{ color: "#f87171" }}>
          Sign in
        </Link>
      </p>
    </motion.div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-label="Google logo" role="img">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335" />
    </svg>
  );
}
