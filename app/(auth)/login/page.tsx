"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { LogoBrand } from "@/components/shared/LogoBrand";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/generate";

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  async function handleGoogle() {
    setGoogleLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${redirectTo}`,
      },
    });

    if (error) {
      toast.error(error.message);
      setGoogleLoading(false);
    }
  }

  const errorParam = searchParams.get("error");

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="w-full max-w-md"
    >
      {/* Spinning border card */}
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
          <div className="flex flex-col items-center mb-8">
            <div className="mb-4">
              <LogoBrand imgClass="h-11 w-auto" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">Welcome back</h1>
            <p className="text-sm mt-1.5" style={{ color: "rgba(255,255,255,0.55)" }}>
              Sign in to your OpusGen AI account
            </p>
          </div>

          {errorParam && (
            <div className="mb-4 px-4 py-3 rounded-xl text-sm text-red-400 text-center" style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.25)" }}>
              Authentication failed. Please try again.
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.02, borderColor: "rgba(255,255,255,0.2)" }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center gap-3 h-12 rounded-2xl font-semibold text-sm transition-all mb-5 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
            style={{
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.04)",
              color: "rgba(255,255,255,0.82)",
            }}
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
            <span
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 text-xs"
              style={{ background: "#0d0303", color: "rgba(255,255,255,0.50)" }}
            >
              or continue with email
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 rounded-2xl px-4 text-sm outline-none transition-all placeholder:opacity-50"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.9)" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(220,38,38,0.65)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(220,38,38,0.1)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.boxShadow = "none"; }}
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs font-medium hover:opacity-80 transition-opacity" style={{ color: "#f87171" }}>
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 rounded-2xl px-4 pr-12 text-sm outline-none transition-all placeholder:opacity-50"
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

            <motion.button
              type="submit"
              whileHover={{ scale: 1.02, boxShadow: "0 0 48px rgba(220,38,38,0.5)" }}
              whileTap={{ scale: 0.97 }}
              disabled={loading || googleLoading}
              className="group w-full flex items-center justify-center gap-3 h-13 pl-6 pr-2 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-[15px] transition-all mt-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none"
              style={{ boxShadow: "0 0 28px rgba(220,38,38,0.28)" }}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign in
                  <span className="flex items-center justify-center w-9 h-9 rounded-full" style={{ background: "rgba(255,255,255,0.18)" }}>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </>
              )}
            </motion.button>
          </form>
        </div>
      </div>

      <p className="text-center text-sm mt-5" style={{ color: "rgba(255,255,255,0.55)" }}>
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-semibold hover:opacity-80 transition-opacity" style={{ color: "#f87171" }}>
          Sign up free
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
