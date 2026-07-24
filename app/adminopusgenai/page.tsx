"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
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
  Megaphone,
  Sparkles,
  Wrench,
  Clock,
  Pencil,
  RefreshCw,
  Wallet,
} from "lucide-react";
import {
  BANNER_KEY,
  WELCOME_KEY,
  DEFAULT_BANNER,
  DEFAULT_WELCOME,
  type BannerConfig,
  type BannerMode,
  type WelcomeConfig,
} from "@/lib/admin-config";
import { createClient } from "@/lib/supabase/client";

type Feedback = {
  id: string;
  name: string | null;
  email: string | null;
  rating: number;
  category: "bug" | "feature" | "compliment" | "general";
  message: string;
  status: "new" | "read" | "archived";
  created_at: string;
};

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

// ─── real data types ────────────────────────────────────────────────────────
type AdminUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  credits: number;
  generations: number;
  joined: string;
  lastSignInAt: string | null;
};

type AdminStats = {
  totalUsers: number;
  totalGenerations: number;
  generationsToday: number;
  totalCreditsRemaining: number;
  totalCreditsSpent: number;
  falBalance: number | null;
  falCurrency: string;
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
// Access control lives in middleware.ts — it checks the verified Supabase
// session email against the server-only ADMIN_EMAILS allowlist before this
// page ever renders. This component just displays the signed-in admin.
export default function AdminPage() {
  const router = useRouter();
  const [adminEmail, setAdminEmail] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "messages" | "feedback" | "users">("overview");
  const [banner, setBanner] = useState<BannerConfig>(DEFAULT_BANNER);
  const [welcome, setWelcome] = useState<WelcomeConfig>(DEFAULT_WELCOME);
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(true);
  const [fbFilter, setFbFilter] = useState<string>("all");
  const [bannerSaved, setBannerSaved] = useState(false);
  const [welcomeSaved, setWelcomeSaved] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setAdminEmail(user?.email ?? "");
    });
    const savedBanner = localStorage.getItem(BANNER_KEY);
    if (savedBanner) setBanner(JSON.parse(savedBanner));
    const savedWelcome = localStorage.getItem(WELCOME_KEY);
    if (savedWelcome) setWelcome(JSON.parse(savedWelcome));

    fetch("/api/admin/overview")
      .then((res) => { if (!res.ok) throw new Error("Failed"); return res.json(); })
      .then((data) => { setUsers(data.users); setStats(data.stats); })
      .catch(() => setDataError(true))
      .finally(() => setDataLoading(false));

    fetch("/api/admin/feedback")
      .then((res) => { if (!res.ok) throw new Error("Failed"); return res.json(); })
      .then((data) => setFeedbackList(data.feedback))
      .catch(() => {})
      .finally(() => setFeedbackLoading(false));
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
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
  async function updateFeedbackStatus(id: string, status: "read" | "archived") {
    const prev = feedbackList;
    setFeedbackList((cur) => cur.map((f) => (f.id === id ? { ...f, status } : f)));
    const res = await fetch("/api/admin/feedback", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (!res.ok) setFeedbackList(prev); // revert on failure
  }
  function markRead(id: string) {
    updateFeedbackStatus(id, "read");
  }
  function archiveFeedback(id: string) {
    updateFeedbackStatus(id, "archived");
  }

  const filteredFeedback = feedbackList.filter((f) => {
    if (fbFilter === "all") return true;
    if (fbFilter === "unread") return f.status === "new";
    return f.category === fbFilter || f.status === fbFilter;
  });

  // Feedback is still sample data — the feedback form doesn't persist anywhere yet.
  const newFeedbackCount = feedbackList.filter((f) => f.status === "new").length;
  const avgRating = feedbackList.length
    ? +(feedbackList.reduce((a, f) => a + f.rating, 0) / feedbackList.length).toFixed(1)
    : 0;

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
        <div className="flex items-center gap-1 mb-8 p-1 rounded-2xl w-fit max-w-full overflow-x-auto no-scrollbar"
          style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}` }}>
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <button key={id} onClick={() => setActiveTab(id)}
                className="flex items-center gap-2 px-3 sm:px-4 h-9 rounded-xl text-sm font-semibold transition-all shrink-0"
                style={{
                  background: active ? T.redPrimary : "transparent",
                  color: active ? "white" : T.muted,
                }}>
                <Icon className="w-3.5 h-3.5 shrink-0" />{label}
                {id === "feedback" && newFeedbackCount > 0 && (
                  <span className="w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center"
                    style={{ background: active ? "rgba(255,255,255,0.25)" : T.redBg, color: active ? "white" : T.red }}>
                    {newFeedbackCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── OVERVIEW TAB ───────────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>

            {dataError && (
              <div className="mb-6 p-4 rounded-xl text-sm" style={{ background: T.redBg, border: `1px solid ${T.redBorder}`, color: T.red }}>
                Failed to load live data. Check SUPABASE_SERVICE_ROLE_KEY is set.
              </div>
            )}

            {stats && stats.falBalance !== null && stats.falBalance < 2 && (
              <div className="mb-6 p-4 rounded-xl text-sm flex items-center gap-2" style={{ background: T.redBg, border: `1px solid ${T.redBorder}`, color: T.red }}>
                <Wallet className="w-4 h-4 shrink-0" />
                fal.ai balance is low — ${stats.falBalance.toFixed(2)} left. Recharge before it hits $0 and tools start failing.
              </div>
            )}

            {/* Stats grid */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              <StatCard icon={Users} label="Total users" value={dataLoading ? "…" : (stats?.totalUsers ?? 0).toLocaleString()} />
              <StatCard icon={Zap} label="Credits remaining" value={dataLoading ? "…" : (stats?.totalCreditsRemaining ?? 0).toLocaleString()} sub="across all users" color={T.green} />
              <StatCard icon={TrendingUp} label="Generations today" value={dataLoading ? "…" : (stats?.generationsToday ?? 0).toLocaleString()} sub={`${(stats?.totalGenerations ?? 0).toLocaleString()} all time`} color={T.blue} />
              <StatCard icon={BarChart3} label="Credits spent" value={dataLoading ? "…" : (stats?.totalCreditsSpent ?? 0).toLocaleString()} sub="all time" color="#a78bfa" />
              <StatCard
                icon={Wallet}
                label="fal.ai balance"
                value={dataLoading ? "…" : stats?.falBalance !== null && stats?.falBalance !== undefined ? `$${stats.falBalance.toFixed(2)}` : "N/A"}
                sub={stats?.falBalance === null ? "FAL_ADMIN_API_KEY missing" : "Uncrop / Cleanup usage"}
                color={stats?.falBalance !== null && stats?.falBalance !== undefined && stats.falBalance < 2 ? T.red : T.yellow}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
              {/* Feedback snapshot */}
              <div className="p-5 rounded-2xl" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: T.muted }}>Feedback</p>
                <div className="flex items-end gap-2 mb-3">
                  <span className="text-3xl font-black" style={{ color: T.text }}>{avgRating}</span>
                  <div className="flex gap-0.5 mb-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-3.5 h-3.5" fill={s <= Math.round(avgRating) ? T.yellow : "none"}
                        style={{ color: s <= Math.round(avgRating) ? T.yellow : T.dim }} />
                    ))}
                  </div>
                </div>
                <p className="text-xs" style={{ color: T.dim }}>{feedbackList.length} total responses</p>
                {newFeedbackCount > 0 && (
                  <div className="mt-3 flex items-center gap-2 p-2.5 rounded-xl cursor-pointer"
                    style={{ background: T.redBg, border: `1px solid ${T.redBorder}` }}
                    onClick={() => setActiveTab("feedback")}>
                    <Bell className="w-3 h-3" style={{ color: T.red }} />
                    <span className="text-xs font-semibold" style={{ color: T.red }}>{newFeedbackCount} unread</span>
                    <ChevronRight className="w-3 h-3 ml-auto" style={{ color: T.red }} />
                  </div>
                )}
              </div>

              {/* Low-credit users */}
              <div className="p-5 rounded-2xl" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: T.muted }}>Low on Credits</p>
                {dataLoading ? (
                  <p className="text-xs" style={{ color: T.dim }}>Loading…</p>
                ) : (
                  (() => {
                    const low = users.filter((u) => u.credits <= 2).sort((a, b) => a.credits - b.credits).slice(0, 5);
                    return low.length === 0 ? (
                      <p className="text-xs" style={{ color: T.dim }}>No users below 2 credits.</p>
                    ) : (
                      <div className="space-y-2.5">
                        {low.map((u) => (
                          <div key={u.id} className="flex items-center gap-2.5">
                            <Avatar name={u.name} size={26} />
                            <span className="text-xs flex-1 truncate" style={{ color: T.text }}>{u.name}</span>
                            <span className="text-xs font-bold" style={{ color: u.credits === 0 ? T.red : T.yellow }}>{u.credits} left</span>
                          </div>
                        ))}
                      </div>
                    );
                  })()
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
                {dataLoading && <p className="text-xs" style={{ color: T.dim }}>Loading…</p>}
                {users.slice(0, 4).map((u) => (
                  <div key={u.id} className="flex items-center gap-3">
                    <Avatar name={u.name} size={32} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: T.text }}>{u.name}</p>
                      <p className="text-xs truncate" style={{ color: T.dim }}>{u.email}</p>
                    </div>
                    <CreditsBadge credits={u.credits} />
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
              {feedbackLoading && (
                <div className="text-center py-12" style={{ color: T.dim }}>Loading…</div>
              )}
              {!feedbackLoading && filteredFeedback.length === 0 && (
                <div className="text-center py-12" style={{ color: T.dim }}>No feedback in this category.</div>
              )}
              {filteredFeedback.map((fb) => (
                <div key={fb.id} className="p-5 rounded-2xl transition-all"
                  style={{ background: T.card, border: `1px solid ${fb.status === "new" ? T.redBorder : T.border}`, opacity: fb.status === "archived" ? 0.5 : 1 }}>
                  <div className="flex items-start gap-3">
                    <Avatar name={fb.name || fb.email || "Anonymous"} size={36} />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-sm font-bold" style={{ color: T.text }}>{fb.name || "Anonymous"}</span>
                        {fb.email && <span className="text-xs" style={{ color: T.dim }}>{fb.email}</span>}
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
                        {new Date(fb.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
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
              <StatCard icon={Users} label="Total" value={dataLoading ? "…" : users.length.toLocaleString()} />
              <StatCard icon={Zap} label="Credits remaining" value={dataLoading ? "…" : (stats?.totalCreditsRemaining ?? 0).toLocaleString()} color={T.green} />
              <StatCard icon={RefreshCw} label="Generations" value={dataLoading ? "…" : (stats?.totalGenerations ?? 0).toLocaleString()} color={T.dim} />
            </div>

            <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
              {/* Table header */}
              <div className="grid grid-cols-12 px-5 py-3 text-[11px] font-bold uppercase tracking-wider"
                style={{ background: "rgba(255,255,255,0.03)", color: T.dim, borderBottom: `1px solid ${T.border}` }}>
                <div className="col-span-4">User</div>
                <div className="col-span-2 hidden sm:block">Credits</div>
                <div className="col-span-2 hidden md:block">Joined</div>
                <div className="col-span-2 hidden md:block">Generations</div>
                <div className="col-span-2">Last active</div>
              </div>

              {dataLoading && <p className="text-xs text-center py-8" style={{ color: T.dim }}>Loading…</p>}
              {!dataLoading && users.length === 0 && (
                <p className="text-xs text-center py-8" style={{ color: T.dim }}>No users yet.</p>
              )}
              {users.map((u, i) => (
                <div key={u.id}
                  className="grid grid-cols-12 px-5 py-4 items-center text-sm"
                  style={{ borderBottom: i < users.length - 1 ? `1px solid ${T.border}` : "none", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                  <div className="col-span-4 flex items-center gap-3 min-w-0">
                    <Avatar name={u.name} size={32} />
                    <div className="min-w-0">
                      <p className="font-semibold truncate" style={{ color: T.text }}>{u.name}</p>
                      <p className="text-xs truncate hidden sm:block" style={{ color: T.dim }}>{u.email}</p>
                    </div>
                  </div>
                  <div className="col-span-2 hidden sm:block"><CreditsBadge credits={u.credits} /></div>
                  <div className="col-span-2 hidden md:block" style={{ color: T.muted }}>{new Date(u.joined).toLocaleDateString()}</div>
                  <div className="col-span-2 hidden md:block" style={{ color: T.muted }}>{u.generations.toLocaleString()}</div>
                  <div className="col-span-2">
                    <span className="text-xs" style={{ color: T.dim }}>
                      {u.lastSignInAt ? new Date(u.lastSignInAt).toLocaleDateString() : "Never"}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-center mt-4" style={{ color: T.dim }}>
              Showing {users.length.toLocaleString()} of {users.length.toLocaleString()} users
            </p>
          </motion.div>
        )}

      </div>
    </div>
  );
}

// ─── sub-components ───────────────────────────────────────────────────────────
function CreditsBadge({ credits }: { credits: number }) {
  const color = credits === 0 ? T.red : credits <= 2 ? T.yellow : T.green;
  const bg = credits === 0 ? T.redBg : credits <= 2 ? T.yellowBg : T.greenBg;
  return (
    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: bg, color }}>
      {credits} left
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
