"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  Bell,
  Check,
  ChevronRight,
  LogOut,
  MessageSquare,
  Shield,
  Star,
  TrendingUp,
  Users,
  X,
  Zap,
  Archive,
  Eye,
  AlertTriangle,
  Megaphone,
  Sparkles,
  Wrench,
  Clock,
  Tag,
  Pencil,
  RefreshCw,
} from "lucide-react";
import {
  ADMIN_EMAILS,
  BANNER_KEY,
  WELCOME_KEY,
  ADMIN_SESSION_KEY,
  DEFAULT_BANNER,
  DEFAULT_WELCOME,
  type BannerConfig,
  type BannerMode,
  type WelcomeConfig,
} from "@/lib/admin-config";
import { MOCK_FEEDBACK, type MockFeedback } from "@/lib/mock-data";

// ─── theme tokens ────────────────────────────────────────────────────────────
const T = {
  bg: "#080101",
  card: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)",
  text: "rgba(255,255,255,0.88)",
  muted: "rgba(255,255,255,0.45)",
  dim: "rgba(255,255,255,0.22)",
  red: "#f87171",
  redPrimary: "#dc2626",
  redBg: "rgba(220,38,38,0.08)",
  redBorder: "rgba(220,38,38,0.2)",
  green: "#4ade80",
  greenBg: "rgba(74,222,128,0.06)",
  yellow: "#fbbf24",
  yellowBg: "rgba(251,191,36,0.08)",
  blue: "#60a5fa",
  blueBg: "rgba(96,165,250,0.08)",
};

// ─── mock data ────────────────────────────────────────────────────────────────
const MOCK_USERS = [
  { id: "u1", name: "Sarah Chen", email: "sarah@skinglow.co", plan: "Pro", joined: "2026-01-14", generations: 284, status: "active" },
  { id: "u2", name: "Marcus Reed", email: "marcus@studiomr.io", plan: "Basic", joined: "2026-02-03", generations: 97, status: "active" },
  { id: "u3", name: "Priya Nair", email: "priya@nairbeauty.com", plan: "Free", joined: "2026-03-11", generations: 12, status: "active" },
  { id: "u4", name: "Jordan Lee", email: "jlee@capsule.studio", plan: "Pro", joined: "2025-12-22", generations: 531, status: "active" },
  { id: "u5", name: "Aisha Okafor", email: "aisha@lumaphotos.ng", plan: "Basic", joined: "2026-04-01", generations: 43, status: "active" },
  { id: "u6", name: "Tom Varga", email: "tom@vargacraft.eu", plan: "Free", joined: "2026-05-18", generations: 6, status: "inactive" },
  { id: "u7", name: "Nina Sousa", email: "nina@ninacreates.pt", plan: "Pro", joined: "2026-01-30", generations: 402, status: "active" },
  { id: "u8", name: "Kevin Park", email: "kpark@productlab.kr", plan: "Basic", joined: "2026-03-27", generations: 58, status: "active" },
];

const STATS = {
  totalUsers: 2847,
  subscribed: 412,
  free: 2435,
  generationsToday: 1203,
  totalGenerations: 48291,
  apiHealthPct: 98.7,
  monthlyRevenue: 5846,
  avgRating: +(MOCK_FEEDBACK.reduce((a, f) => a + f.rating, 0) / MOCK_FEEDBACK.length).toFixed(1),
  newFeedback: MOCK_FEEDBACK.filter((f) => f.status === "new").length,
};

// ─── small helpers ────────────────────────────────────────────────────────────
function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const colors = ["#dc2626", "#7c3aed", "#0891b2", "#059669", "#d97706"];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className="rounded-full flex items-center justify-center shrink-0 text-white font-bold"
      style={{ width: size, height: size, background: color, fontSize: size * 0.35 }}>
      {initials}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color = T.red }:
  { icon: React.ElementType; label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="p-5 rounded-2xl" style={{ background: T.card, border: `1px solid ${T.border}` }}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: T.muted }}>{label}</p>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
      </div>
      <p className="text-2xl font-black" style={{ color: T.text }}>{value}</p>
      {sub && <p className="text-xs mt-1" style={{ color: T.dim }}>{sub}</p>}
    </div>
  );
}

// ─── BANNER MODE CONFIG ───────────────────────────────────────────────────────
const BANNER_MODES: { mode: BannerMode; label: string; icon: React.ElementType; color: string; preview: string }[] = [
  { mode: "normal", label: "Normal", icon: Check, color: T.green, preview: "No banner shown" },
  { mode: "maintenance", label: "Maintenance", icon: Wrench, color: T.yellow, preview: "Site is temporarily under maintenance. We'll be back shortly." },
  { mode: "coming_soon", label: "Coming Soon", icon: Clock, color: T.blue, preview: "An exciting new update is coming soon — stay tuned!" },
  { mode: "new_version", label: "New Version", icon: Sparkles, color: "#a78bfa", preview: "Version {version} is live — see what's new." },
  { mode: "custom", label: "Custom", icon: Pencil, color: T.red, preview: "Write your own message below." },
];

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function AdminPage() {
  const [authState, setAuthState] = useState<"idle" | "google-picker" | "checking" | "authenticated" | "denied">("idle");
  const [adminEmail, setAdminEmail] = useState("");
  const [mockEmailInput, setMockEmailInput] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "messages" | "feedback" | "users">("overview");
  const [banner, setBanner] = useState<BannerConfig>(DEFAULT_BANNER);
  const [welcome, setWelcome] = useState<WelcomeConfig>(DEFAULT_WELCOME);
  const [feedbackList, setFeedbackList] = useState<MockFeedback[]>(MOCK_FEEDBACK);
  const [fbFilter, setFbFilter] = useState<string>("all");
  const [bannerSaved, setBannerSaved] = useState(false);
  const [welcomeSaved, setWelcomeSaved] = useState(false);

  // ── restore session on mount ────────────────────────────────────────────────
  useEffect(() => {
    const session = localStorage.getItem(ADMIN_SESSION_KEY);
    if (session) {
      setAdminEmail(session);
      setAuthState("authenticated");
    }
    const savedBanner = localStorage.getItem(BANNER_KEY);
    if (savedBanner) setBanner(JSON.parse(savedBanner));
    const savedWelcome = localStorage.getItem(WELCOME_KEY);
    if (savedWelcome) setWelcome(JSON.parse(savedWelcome));
  }, []);

  // ── Google mock sign-in ──────────────────────────────────────────────────────
  function handleGoogleContinue() {
    if (!mockEmailInput.trim()) return;
    setAuthState("checking");
    setTimeout(() => {
      const email = mockEmailInput.trim().toLowerCase();
      if ((ADMIN_EMAILS as readonly string[]).includes(email)) {
        localStorage.setItem(ADMIN_SESSION_KEY, email);
        setAdminEmail(email);
        setAuthState("authenticated");
      } else {
        setAuthState("denied");
      }
    }, 1200);
  }

  function handleSignOut() {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    setAuthState("idle");
    setAdminEmail("");
    setMockEmailInput("");
  }

  // ── banner save ──────────────────────────────────────────────────────────────
  const saveBanner = useCallback(() => {
    localStorage.setItem(BANNER_KEY, JSON.stringify(banner));
    setBannerSaved(true);
    setTimeout(() => setBannerSaved(false), 2000);
  }, [banner]);

  const saveWelcome = useCallback(() => {
    localStorage.setItem(WELCOME_KEY, JSON.stringify(welcome));
    setWelcomeSaved(true);
    setTimeout(() => setWelcomeSaved(false), 2000);
  }, [welcome]);

  // ── feedback actions ─────────────────────────────────────────────────────────
  function markRead(id: string) {
    setFeedbackList((prev) => prev.map((f) => f.id === id ? { ...f, status: "read" as const } : f));
  }
  function archiveFeedback(id: string) {
    setFeedbackList((prev) => prev.map((f) => f.id === id ? { ...f, status: "archived" as const } : f));
  }

  const filteredFeedback = feedbackList.filter((f) => {
    if (fbFilter === "all") return true;
    if (fbFilter === "unread") return f.status === "new";
    return f.category === fbFilter || f.status === fbFilter;
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: LOGIN
  // ─────────────────────────────────────────────────────────────────────────────
  if (authState !== "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4"
        style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(120,0,0,0.18) 0%, #080101 55%)" }}>

        {/* Login card */}
        <AnimatePresence mode="wait">
          {(authState === "idle" || authState === "denied") && (
            <motion.div key="login"
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-sm">

              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full" style={{ background: "rgba(220,38,38,0.2)", filter: "blur(20px)", transform: "scale(2)" }} />
                  <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: T.redBg, border: `1px solid ${T.redBorder}` }}>
                    <Shield className="w-8 h-8" style={{ color: T.red }} />
                  </div>
                </div>
              </div>

              <h1 className="text-2xl font-black text-center mb-1" style={{ color: T.text }}>Admin Access</h1>
              <p className="text-sm text-center mb-2" style={{ color: T.muted }}>OpusGen AI Control Panel</p>
              <p className="text-xs text-center mb-8" style={{ color: T.dim }}>Authorized personnel only</p>

              {/* Access denied message */}
              {authState === "denied" && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="mb-5 p-4 rounded-xl flex items-start gap-3"
                  style={{ background: "rgba(220,38,38,0.1)", border: `1px solid rgba(220,38,38,0.25)` }}>
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: T.red }} />
                  <div>
                    <p className="text-sm font-bold" style={{ color: T.red }}>Access denied</p>
                    <p className="text-xs mt-0.5" style={{ color: T.muted }}>This email is not authorized. Use an admin account.</p>
                  </div>
                </motion.div>
              )}

              {/* Google button */}
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={() => setAuthState("google-picker")}
                className="w-full flex items-center justify-center gap-3 h-12 rounded-2xl font-semibold text-sm transition-all"
                style={{ background: "rgba(255,255,255,0.06)", border: `1px solid rgba(255,255,255,0.12)`, color: T.text }}>
                <GoogleLogo />
                Continue with Google
              </motion.button>

              <p className="text-[11px] text-center mt-6" style={{ color: T.dim }}>
                This page is not publicly accessible.<br />Do not share this URL.
              </p>
            </motion.div>
          )}

          {/* Google picker modal */}
          {authState === "google-picker" && (
            <motion.div key="picker"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="w-full max-w-sm rounded-3xl overflow-hidden"
              style={{ background: "#1a1a1a", border: `1px solid rgba(255,255,255,0.1)` }}>

              {/* Google header */}
              <div className="p-7 pb-5">
                <div className="flex justify-center mb-5">
                  <GoogleLogo size={32} />
                </div>
                <h2 className="text-xl font-bold text-center mb-1" style={{ color: T.text }}>Sign in with Google</h2>
                <p className="text-xs text-center" style={{ color: T.muted }}>to continue to <strong style={{ color: T.text }}>OpusGen AI Admin</strong></p>
              </div>

              <div className="px-7 pb-7 space-y-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: T.muted }}>Email or phone</label>
                  <input
                    type="email" autoFocus
                    value={mockEmailInput}
                    onChange={(e) => setMockEmailInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleGoogleContinue()}
                    placeholder="Enter your Google email"
                    className="w-full h-11 rounded-xl px-4 text-sm outline-none"
                    style={{ background: "rgba(255,255,255,0.06)", border: `1px solid rgba(255,255,255,0.12)`, color: T.text }}
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button onClick={() => { setAuthState("idle"); setMockEmailInput(""); }}
                    className="text-sm font-semibold transition-opacity hover:opacity-70"
                    style={{ color: "#60a5fa" }}>
                    Cancel
                  </button>
                  <motion.button whileTap={{ scale: 0.96 }}
                    onClick={handleGoogleContinue}
                    disabled={!mockEmailInput.trim()}
                    className="h-9 px-6 rounded-full text-sm font-bold text-white transition-opacity"
                    style={{ background: "#1a73e8", opacity: mockEmailInput.trim() ? 1 : 0.4 }}>
                    Next
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Checking state */}
          {authState === "checking" && (
            <motion.div key="checking"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-2 rounded-full animate-spin"
                style={{ borderColor: "rgba(220,38,38,0.2)", borderTopColor: T.redPrimary }} />
              <p className="text-sm" style={{ color: T.muted }}>Verifying access…</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: DASHBOARD
  // ─────────────────────────────────────────────────────────────────────────────
  const TABS = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "messages", label: "Messages", icon: Megaphone },
    { id: "feedback", label: "Feedback", icon: MessageSquare },
    { id: "users", label: "Users", icon: Users },
  ] as const;

  return (
    <div className="min-h-screen" style={{ background: T.bg }}>

      {/* ── Top bar ────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-6 h-14"
        style={{ background: "rgba(8,1,1,0.9)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${T.border}` }}>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: T.redBg, border: `1px solid ${T.redBorder}` }}>
            <Shield className="w-3.5 h-3.5" style={{ color: T.red }} />
          </div>
          <span className="text-sm font-black" style={{ color: T.text }}>OpusGen AI</span>
          <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
            style={{ background: T.redBg, color: T.red, border: `1px solid ${T.redBorder}` }}>Admin</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Avatar name={adminEmail} size={28} />
            <span className="text-xs hidden sm:block" style={{ color: T.muted }}>{adminEmail}</span>
          </div>
          <button onClick={handleSignOut}
            className="flex items-center gap-1.5 text-xs px-3 h-7 rounded-lg transition-opacity hover:opacity-70"
            style={{ color: T.muted, border: `1px solid ${T.border}` }}>
            <LogOut className="w-3 h-3" /> Sign out
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* ── Page heading ───────────────────────────────────────────────── */}
        <div className="mb-8">
          <h1 className="text-2xl font-black" style={{ color: T.text }}>Control Panel</h1>
          <p className="text-sm mt-1" style={{ color: T.muted }}>Manage your platform settings and monitor activity.</p>
        </div>

        {/* ── Tab bar ────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-1 mb-8 p-1 rounded-2xl w-fit"
          style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}` }}>
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <button key={id} onClick={() => setActiveTab(id)}
                className="flex items-center gap-2 px-4 h-9 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: active ? T.redPrimary : "transparent",
                  color: active ? "white" : T.muted,
                }}>
                <Icon className="w-3.5 h-3.5" />{label}
                {id === "feedback" && STATS.newFeedback > 0 && (
                  <span className="w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center"
                    style={{ background: active ? "rgba(255,255,255,0.25)" : T.redBg, color: active ? "white" : T.red }}>
                    {STATS.newFeedback}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── OVERVIEW TAB ───────────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>

            {/* Stats grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard icon={Users} label="Total users" value={STATS.totalUsers.toLocaleString()} sub="+124 this month" />
              <StatCard icon={Zap} label="Subscribed" value={STATS.subscribed} sub={`${((STATS.subscribed / STATS.totalUsers) * 100).toFixed(1)}% conversion`} color={T.green} />
              <StatCard icon={TrendingUp} label="Generations today" value={STATS.generationsToday.toLocaleString()} sub={`${STATS.totalGenerations.toLocaleString()} all time`} color={T.blue} />
              <StatCard icon={BarChart3} label="Monthly revenue" value={`$${STATS.monthlyRevenue.toLocaleString()}`} sub="Est. from active subs" color="#a78bfa" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
              {/* API health */}
              <div className="p-5 rounded-2xl" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: T.muted }}>API Health</p>
                <div className="flex items-end gap-2 mb-3">
                  <span className="text-3xl font-black" style={{ color: T.green }}>{STATS.apiHealthPct}%</span>
                  <span className="text-sm mb-1" style={{ color: T.dim }}>uptime</span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <div className="h-full rounded-full" style={{ width: `${STATS.apiHealthPct}%`, background: T.green }} />
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-[11px]" style={{ color: T.dim }}>All systems</span>
                  <span className="text-[11px] font-bold flex items-center gap-1" style={{ color: T.green }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" /> Operational
                  </span>
                </div>
              </div>

              {/* Plan breakdown */}
              <div className="p-5 rounded-2xl" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: T.muted }}>Plan Breakdown</p>
                {[
                  { label: "Pro", count: 187, color: "#a78bfa" },
                  { label: "Basic", count: 225, color: T.blue },
                  { label: "Free", count: STATS.free, color: T.dim },
                ].map(({ label, count, color }) => (
                  <div key={label} className="flex items-center gap-3 mb-3 last:mb-0">
                    <span className="text-xs w-10 font-bold" style={{ color }}>{label}</span>
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <div className="h-full rounded-full" style={{ width: `${(count / STATS.totalUsers) * 100}%`, background: color }} />
                    </div>
                    <span className="text-xs w-10 text-right" style={{ color: T.dim }}>{count}</span>
                  </div>
                ))}
              </div>

              {/* Feedback snapshot */}
              <div className="p-5 rounded-2xl" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: T.muted }}>Feedback</p>
                <div className="flex items-end gap-2 mb-3">
                  <span className="text-3xl font-black" style={{ color: T.text }}>{STATS.avgRating}</span>
                  <div className="flex gap-0.5 mb-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-3.5 h-3.5" fill={s <= Math.round(STATS.avgRating) ? T.yellow : "none"}
                        style={{ color: s <= Math.round(STATS.avgRating) ? T.yellow : T.dim }} />
                    ))}
                  </div>
                </div>
                <p className="text-xs" style={{ color: T.dim }}>{feedbackList.length} total responses</p>
                {STATS.newFeedback > 0 && (
                  <div className="mt-3 flex items-center gap-2 p-2.5 rounded-xl cursor-pointer"
                    style={{ background: T.redBg, border: `1px solid ${T.redBorder}` }}
                    onClick={() => setActiveTab("feedback")}>
                    <Bell className="w-3 h-3" style={{ color: T.red }} />
                    <span className="text-xs font-semibold" style={{ color: T.red }}>{STATS.newFeedback} unread</span>
                    <ChevronRight className="w-3 h-3 ml-auto" style={{ color: T.red }} />
                  </div>
                )}
              </div>
            </div>

            {/* Recent users preview */}
            <div className="p-5 rounded-2xl" style={{ background: T.card, border: `1px solid ${T.border}` }}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: T.muted }}>Recent Users</p>
                <button onClick={() => setActiveTab("users")} className="text-xs flex items-center gap-1 transition-opacity hover:opacity-70" style={{ color: T.red }}>
                  View all <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="space-y-3">
                {MOCK_USERS.slice(0, 4).map((u) => (
                  <div key={u.id} className="flex items-center gap-3">
                    <Avatar name={u.name} size={32} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: T.text }}>{u.name}</p>
                      <p className="text-xs truncate" style={{ color: T.dim }}>{u.email}</p>
                    </div>
                    <PlanBadge plan={u.plan} />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── MESSAGES TAB ───────────────────────────────────────────────── */}
        {activeTab === "messages" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
            className="space-y-6">

            {/* Banner mode selector */}
            <div className="p-6 rounded-2xl" style={{ background: T.card, border: `1px solid ${T.border}` }}>
              <h2 className="text-sm font-black mb-1" style={{ color: T.text }}>Site Announcement Banner</h2>
              <p className="text-xs mb-6" style={{ color: T.muted }}>Choose a mode to display a banner to all users on the site.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                {BANNER_MODES.map(({ mode, label, icon: Icon, color, preview }) => {
                  const active = banner.mode === mode;
                  return (
                    <button key={mode} onClick={() => setBanner((b) => ({ ...b, mode }))}
                      className="p-4 rounded-xl text-left transition-all"
                      style={{
                        background: active ? `${color}12` : "rgba(255,255,255,0.02)",
                        border: `1.5px solid ${active ? color : T.border}`,
                      }}>
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="w-4 h-4" style={{ color: active ? color : T.dim }} />
                        <span className="text-sm font-bold" style={{ color: active ? color : T.muted }}>{label}</span>
                        {active && <Check className="w-3.5 h-3.5 ml-auto" style={{ color }} />}
                      </div>
                      <p className="text-[11px] leading-relaxed" style={{ color: T.dim }}>{preview}</p>
                    </button>
                  );
                })}
              </div>

              {/* Version input */}
              {banner.mode === "new_version" && (
                <div className="mb-4">
                  <label className="block text-xs font-medium mb-1.5" style={{ color: T.muted }}>Version label</label>
                  <input type="text" placeholder="e.g. 2.1.0"
                    value={banner.versionLabel}
                    onChange={(e) => setBanner((b) => ({ ...b, versionLabel: e.target.value }))}
                    className="h-10 px-3 rounded-xl text-sm outline-none w-48"
                    style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${T.border}`, color: T.text }} />
                </div>
              )}

              {/* Custom message input */}
              {(banner.mode === "custom" || banner.mode === "new_version") && (
                <div className="mb-4">
                  <label className="block text-xs font-medium mb-1.5" style={{ color: T.muted }}>
                    {banner.mode === "new_version" ? "Changelog summary" : "Custom message"}
                  </label>
                  <textarea
                    value={banner.message}
                    onChange={(e) => setBanner((b) => ({ ...b, message: e.target.value }))}
                    placeholder={banner.mode === "new_version" ? "What's new in this version…" : "Write your announcement…"}
                    rows={3}
                    className="w-full rounded-xl px-3 py-2.5 text-sm outline-none resize-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${T.border}`, color: T.text }} />
                </div>
              )}

              {/* Preview */}
              {banner.mode !== "normal" && (
                <div className="mb-5">
                  <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: T.dim }}>Preview</p>
                  <BannerPreview config={banner} />
                </div>
              )}

              <motion.button whileTap={{ scale: 0.97 }} onClick={saveBanner}
                className="flex items-center gap-2 h-9 px-5 rounded-xl text-sm font-bold text-white"
                style={{ background: bannerSaved ? "#16a34a" : T.redPrimary }}>
                {bannerSaved ? <><Check className="w-4 h-4" /> Saved!</> : "Save & Publish"}
              </motion.button>
            </div>

            {/* Welcome message */}
            <div className="p-6 rounded-2xl" style={{ background: T.card, border: `1px solid ${T.border}` }}>
              <h2 className="text-sm font-black mb-1" style={{ color: T.text }}>Dashboard Welcome Message</h2>
              <p className="text-xs mb-5" style={{ color: T.muted }}>Shown to users at the top of their dashboard.</p>

              <div className="flex items-center gap-3 mb-5">
                <button onClick={() => setWelcome((w) => ({ ...w, useDefault: true }))}
                  className="flex items-center gap-2 text-sm px-4 h-8 rounded-xl transition-all"
                  style={{ background: welcome.useDefault ? T.redBg : "rgba(255,255,255,0.03)", border: `1px solid ${welcome.useDefault ? T.redBorder : T.border}`, color: welcome.useDefault ? T.red : T.muted }}>
                  <Check className="w-3 h-3" style={{ opacity: welcome.useDefault ? 1 : 0 }} /> Default
                </button>
                <button onClick={() => setWelcome((w) => ({ ...w, useDefault: false }))}
                  className="flex items-center gap-2 text-sm px-4 h-8 rounded-xl transition-all"
                  style={{ background: !welcome.useDefault ? T.redBg : "rgba(255,255,255,0.03)", border: `1px solid ${!welcome.useDefault ? T.redBorder : T.border}`, color: !welcome.useDefault ? T.red : T.muted }}>
                  <Pencil className="w-3 h-3" style={{ opacity: !welcome.useDefault ? 1 : 0 }} /> Custom
                </button>
              </div>

              {welcome.useDefault ? (
                <div className="p-4 rounded-xl text-sm" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}`, color: T.muted }}>
                  &quot;Welcome back, [Name]! Ready to create something amazing?&quot;
                </div>
              ) : (
                <textarea value={welcome.message}
                  onChange={(e) => setWelcome((w) => ({ ...w, message: e.target.value }))}
                  placeholder="Write a custom greeting…"
                  rows={3}
                  className="w-full rounded-xl px-3 py-2.5 text-sm outline-none resize-none mb-4"
                  style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${T.border}`, color: T.text }} />
              )}

              {!welcome.useDefault && (
                <motion.button whileTap={{ scale: 0.97 }} onClick={saveWelcome}
                  className="flex items-center gap-2 h-9 px-5 rounded-xl text-sm font-bold text-white mt-4"
                  style={{ background: welcomeSaved ? "#16a34a" : T.redPrimary }}>
                  {welcomeSaved ? <><Check className="w-4 h-4" /> Saved!</> : "Save Message"}
                </motion.button>
              )}
            </div>
          </motion.div>
        )}

        {/* ── FEEDBACK TAB ───────────────────────────────────────────────── */}
        {activeTab === "feedback" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>

            {/* Filter chips */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
              {["all", "unread", "bug", "feature", "compliment", "general", "archived"].map((f) => (
                <button key={f} onClick={() => setFbFilter(f)}
                  className="text-xs px-3 h-7 rounded-full font-semibold capitalize transition-all"
                  style={{
                    background: fbFilter === f ? T.redPrimary : T.card,
                    color: fbFilter === f ? "white" : T.muted,
                    border: `1px solid ${fbFilter === f ? "transparent" : T.border}`,
                  }}>
                  {f}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {filteredFeedback.length === 0 && (
                <div className="text-center py-12" style={{ color: T.dim }}>No feedback in this category.</div>
              )}
              {filteredFeedback.map((fb) => (
                <div key={fb.id} className="p-5 rounded-2xl transition-all"
                  style={{ background: T.card, border: `1px solid ${fb.status === "new" ? T.redBorder : T.border}`, opacity: fb.status === "archived" ? 0.5 : 1 }}>
                  <div className="flex items-start gap-3">
                    <Avatar name={fb.name} size={36} />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-sm font-bold" style={{ color: T.text }}>{fb.name}</span>
                        <span className="text-xs" style={{ color: T.dim }}>{fb.email}</span>
                        <FbCategoryBadge cat={fb.category} />
                        {fb.status === "new" && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: T.redBg, color: T.red, border: `1px solid ${T.redBorder}` }}>NEW</span>
                        )}
                      </div>
                      <div className="flex gap-0.5 mb-2">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className="w-3 h-3" fill={s <= fb.rating ? T.yellow : "none"}
                            style={{ color: s <= fb.rating ? T.yellow : T.dim }} />
                        ))}
                      </div>
                      <p className="text-sm leading-relaxed" style={{ color: T.muted }}>{fb.message}</p>
                      <p className="text-[11px] mt-2" style={{ color: T.dim }}>
                        {fb.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                    {fb.status !== "archived" && (
                      <div className="flex flex-col gap-2 shrink-0">
                        {fb.status === "new" && (
                          <button onClick={() => markRead(fb.id)} title="Mark as read"
                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-opacity hover:opacity-70"
                            style={{ background: T.greenBg, border: `1px solid rgba(74,222,128,0.2)` }}>
                            <Eye className="w-3.5 h-3.5" style={{ color: T.green }} />
                          </button>
                        )}
                        <button onClick={() => archiveFeedback(fb.id)} title="Archive"
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-opacity hover:opacity-70"
                          style={{ background: T.card, border: `1px solid ${T.border}` }}>
                          <Archive className="w-3.5 h-3.5" style={{ color: T.dim }} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── USERS TAB ──────────────────────────────────────────────────── */}
        {activeTab === "users" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>

            {/* Summary row */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <StatCard icon={Users} label="Total" value={STATS.totalUsers.toLocaleString()} />
              <StatCard icon={Zap} label="Subscribed" value={STATS.subscribed} color={T.green} />
              <StatCard icon={RefreshCw} label="Free tier" value={STATS.free.toLocaleString()} color={T.dim} />
            </div>

            <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
              {/* Table header */}
              <div className="grid grid-cols-12 px-5 py-3 text-[11px] font-bold uppercase tracking-wider"
                style={{ background: "rgba(255,255,255,0.03)", color: T.dim, borderBottom: `1px solid ${T.border}` }}>
                <div className="col-span-4">User</div>
                <div className="col-span-2 hidden sm:block">Plan</div>
                <div className="col-span-2 hidden md:block">Joined</div>
                <div className="col-span-2 hidden md:block">Generations</div>
                <div className="col-span-2">Status</div>
              </div>

              {MOCK_USERS.map((u, i) => (
                <div key={u.id}
                  className="grid grid-cols-12 px-5 py-4 items-center text-sm"
                  style={{ borderBottom: i < MOCK_USERS.length - 1 ? `1px solid ${T.border}` : "none", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                  <div className="col-span-4 flex items-center gap-3 min-w-0">
                    <Avatar name={u.name} size={32} />
                    <div className="min-w-0">
                      <p className="font-semibold truncate" style={{ color: T.text }}>{u.name}</p>
                      <p className="text-xs truncate hidden sm:block" style={{ color: T.dim }}>{u.email}</p>
                    </div>
                  </div>
                  <div className="col-span-2 hidden sm:block"><PlanBadge plan={u.plan} /></div>
                  <div className="col-span-2 hidden md:block" style={{ color: T.muted }}>{u.joined}</div>
                  <div className="col-span-2 hidden md:block" style={{ color: T.muted }}>{u.generations.toLocaleString()}</div>
                  <div className="col-span-2">
                    <span className="text-[11px] font-bold px-2 py-1 rounded-full"
                      style={{
                        background: u.status === "active" ? T.greenBg : T.card,
                        color: u.status === "active" ? T.green : T.dim,
                        border: `1px solid ${u.status === "active" ? "rgba(74,222,128,0.2)" : T.border}`,
                      }}>
                      {u.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-center mt-4" style={{ color: T.dim }}>
              Showing 8 of {STATS.totalUsers.toLocaleString()} users · Connect a database to see all
            </p>
          </motion.div>
        )}

      </div>
    </div>
  );
}

// ─── sub-components ───────────────────────────────────────────────────────────
function PlanBadge({ plan }: { plan: string }) {
  const map: Record<string, { color: string; bg: string }> = {
    Pro: { color: "#a78bfa", bg: "rgba(167,139,250,0.1)" },
    Basic: { color: T.blue, bg: T.blueBg },
    Free: { color: T.dim, bg: "rgba(255,255,255,0.04)" },
  };
  const s = map[plan] ?? map.Free;
  return (
    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.color }}>
      {plan}
    </span>
  );
}

function FbCategoryBadge({ cat }: { cat: string }) {
  const map: Record<string, string> = {
    bug: T.red,
    feature: T.blue,
    compliment: T.green,
    general: T.muted,
  };
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize"
      style={{ background: "rgba(255,255,255,0.05)", color: map[cat] ?? T.muted }}>
      {cat}
    </span>
  );
}

function BannerPreview({ config }: { config: BannerConfig }) {
  const modeMap: Record<BannerMode, { bg: string; border: string; color: string; icon: React.ElementType; text: string }> = {
    normal: { bg: T.greenBg, border: "rgba(74,222,128,0.2)", color: T.green, icon: Check, text: "No banner" },
    maintenance: { bg: T.yellowBg, border: "rgba(251,191,36,0.2)", color: T.yellow, icon: Wrench, text: "Site is temporarily under maintenance. We'll be back shortly." },
    coming_soon: { bg: T.blueBg, border: "rgba(96,165,250,0.2)", color: T.blue, icon: Clock, text: "An exciting new update is coming soon — stay tuned!" },
    new_version: { bg: "rgba(167,139,250,0.08)", border: "rgba(167,139,250,0.2)", color: "#a78bfa", icon: Sparkles, text: config.versionLabel ? `Version ${config.versionLabel} is live! ${config.message}` : "New version is live!" },
    custom: { bg: T.redBg, border: T.redBorder, color: T.red, icon: Megaphone, text: config.message || "Your custom announcement here…" },
  };
  const s = modeMap[config.mode];
  const Icon = s.icon;
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl text-sm"
      style={{ background: s.bg, border: `1px solid ${s.border}` }}>
      <Icon className="w-4 h-4 shrink-0" style={{ color: s.color }} />
      <span style={{ color: s.color }}>{s.text}</span>
      <X className="w-3.5 h-3.5 ml-auto shrink-0 opacity-50 cursor-pointer" style={{ color: s.color }} />
    </div>
  );
}

function GoogleLogo({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335" />
    </svg>
  );
}
