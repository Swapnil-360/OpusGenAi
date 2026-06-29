"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell, Check, ChevronRight, CreditCard, Crown, Globe, History,
  KeyRound, LogOut, Shield, Sparkles, User, Zap,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MOCK_CURRENT_USER, PLANS, MOCK_GENERATIONS } from "@/lib/mock-data";
import { planLabel } from "@/lib/utils";
import { toast } from "sonner";

const W = {
  bg: "#0f0404",
  card: "#120404",
  text: "rgba(255,255,255,0.88)",
  muted: "rgba(255,255,255,0.45)",
  dim: "rgba(255,255,255,0.28)",
  border: "rgba(255,255,255,0.09)",
  glass: "rgba(255,255,255,0.05)",
  glassDim: "rgba(255,255,255,0.03)",
  red: "#f87171",
  redBg: "rgba(220,38,38,0.12)",
  redBorder: "rgba(220,38,38,0.35)",
};

const SECTIONS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "plan", label: "Plan & Credits", icon: Crown },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "security", label: "Security", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
] as const;
type SectionId = (typeof SECTIONS)[number]["id"];

function DarkInput({ value, onChange, type = "text", placeholder, icon: Icon }: {
  value?: string; onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string; placeholder?: string; icon?: React.ElementType;
}) {
  return (
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: W.dim }} />}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full h-11 rounded-xl text-sm outline-none transition-all"
        style={{
          background: W.glass,
          border: `1px solid ${W.border}`,
          color: W.text,
          paddingLeft: Icon ? "2.5rem" : "0.75rem",
          paddingRight: "0.75rem",
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = W.redBorder; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(220,38,38,0.08)"; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = W.border; e.currentTarget.style.boxShadow = "none"; }}
      />
    </div>
  );
}

export default function AccountPage() {
  const user = MOCK_CURRENT_USER;
  const [activeSection, setActiveSection] = useState<SectionId>("profile");
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
const [notifications, setNotifications] = useState({ generationDone: true, billing: true, tips: false, newsletter: false });
  const [savingProfile, setSavingProfile] = useState(false);

  const creditsPercent = Math.round((user.credits / 10) * 100);
  const currentPlan = PLANS.find((p) => p.id === user.plan)!;
  const totalGenerated = MOCK_GENERATIONS.length;

  function saveProfile() {
    setSavingProfile(true);
    setTimeout(() => { setSavingProfile(false); toast.success("Profile saved!"); }, 1200);
  }

  return (
    <div className="flex flex-col lg:flex-row lg:h-full lg:overflow-hidden" style={{ background: W.bg }}>

      {/* ══ MOBILE: user bar + horizontal section tabs ══════════════════ */}
      <div className="lg:hidden shrink-0" style={{ borderBottom: `1px solid ${W.border}` }}>
        <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: `1px solid ${W.border}` }}>
          <Avatar className="w-9 h-9 shrink-0" style={{ outline: `2px solid ${W.border}`, outlineOffset: "1px" }}>
            <AvatarImage src={user.avatar} />
            <AvatarFallback className="text-xs font-bold" style={{ background: W.redBg, color: W.red }}>
              {user.name.split(" ").map((n: string) => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate" style={{ color: W.text }}>{user.name}</p>
            <p className="text-[11px] truncate" style={{ color: W.dim }}>{user.email}</p>
          </div>
          <span className="text-[10px] rounded-full px-2 py-0.5 font-semibold shrink-0"
            style={{ background: W.glass, border: `1px solid ${W.border}`, color: W.muted }}>
            {planLabel(user.plan)} Plan
          </span>
        </div>
        <div className="flex overflow-x-auto gap-1 px-3 py-2 no-scrollbar">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveSection(id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all"
              style={activeSection === id
                ? { border: `1px solid ${W.redBorder}`, background: W.redBg, color: W.red }
                : { border: "1px solid transparent", color: W.muted }}>
              <Icon className="w-3 h-3 shrink-0" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ══ SIDEBAR NAV (desktop only) ══════════════════════════════════ */}
      <div className="hidden lg:flex lg:w-56 xl:w-64 shrink-0 flex-col" style={{ borderRight: `1px solid ${W.border}` }}>

        {/* User card */}
        <div className="px-4 pt-5 pb-4 shrink-0" style={{ borderBottom: `1px solid ${W.border}` }}>
          <div className="flex items-center gap-3">
            <Avatar className="w-11 h-11 shrink-0" style={{ outline: `2px solid ${W.border}`, outlineOffset: "1px" }}>
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="text-sm font-bold" style={{ background: W.redBg, color: W.red }}>
                {user.name.split(" ").map((n) => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold truncate" style={{ color: W.text }}>{user.name}</p>
              <p className="text-[11px] truncate" style={{ color: W.dim }}>{user.email}</p>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-[10px] rounded-full px-1.5 py-0.5 font-semibold"
                  style={{ background: W.glass, border: `1px solid ${W.border}`, color: W.muted }}>
                  {planLabel(user.plan)} Plan
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {SECTIONS.map(({ id, label, icon: Icon }) => {
            const isActive = activeSection === id;
            return (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium text-left"
                style={isActive
                  ? { background: W.redBg, color: W.red, border: `1px solid ${W.redBorder}` }
                  : { color: W.muted, border: "1px solid transparent" }}
                onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = W.glass; e.currentTarget.style.color = W.text; } }}
                onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = W.muted; } }}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 shrink-0" />}
              </button>
            );
          })}
        </nav>

        <div className="p-3 shrink-0" style={{ borderTop: `1px solid ${W.border}` }}>
          <button
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{ color: "#f87171" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(220,38,38,0.1)"; e.currentTarget.style.color = "#fca5a5"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#f87171"; }}
            onClick={() => toast.info("Sign out — not connected to auth.")}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Sign out
          </button>
        </div>
      </div>

      {/* ══ CONTENT ════════════════════════════════════════════════════ */}
      <div className="flex-1 lg:overflow-y-auto px-4 sm:px-6 py-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="max-w-2xl"
          >

            {/* ── Profile ─────────────────────────────────────────────── */}
            {activeSection === "profile" && (
              <div>
                <h2 className="text-xl font-black tracking-tight mb-1" style={{ color: W.text }}>Profile</h2>
                <p className="text-sm mb-6" style={{ color: W.muted }}>Manage your name, email and avatar</p>

                {/* Avatar */}
                <div className="flex items-center gap-4 mb-8 p-4 rounded-2xl" style={{ border: `1px solid ${W.border}`, background: W.glassDim }}>
                  <Avatar className="w-16 h-16" style={{ outline: `2px solid ${W.border}`, outlineOffset: "2px" }}>
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback className="text-xl font-bold" style={{ background: W.redBg, color: W.red }}>
                      {user.name.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-bold" style={{ color: W.text }}>{user.name}</p>
                    <p className="text-xs mb-2" style={{ color: W.muted }}>{user.email}</p>
                    <button
                      className="h-7 px-3 rounded-lg text-xs font-semibold transition-all"
                      style={{ border: `1px solid ${W.border}`, background: W.glass, color: W.muted }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = W.text; e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = W.muted; e.currentTarget.style.borderColor = W.border; }}
                      onClick={() => toast.info("Avatar upload — not connected to backend.")}
                    >
                      Change photo
                    </button>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-8">
                  {[
                    { label: "Generations", value: totalGenerated },
                    { label: "Credits left", value: user.credits },
                    { label: "Images created", value: totalGenerated * 4 },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex flex-col items-center p-4 rounded-2xl text-center" style={{ border: `1px solid ${W.border}`, background: W.glassDim }}>
                      <p className="text-2xl font-black tabular-nums" style={{ color: W.text }}>{value}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: W.dim }}>{label}</p>
                    </div>
                  ))}
                </div>

                {/* Form */}
                <div className="space-y-5">
                  <div>
                    <label className="text-sm font-semibold mb-2 block" style={{ color: W.text }}>Full name</label>
                    <DarkInput value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-2 block" style={{ color: W.text }}>Email address</label>
                    <DarkInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-2 block" style={{ color: W.text }}>Website</label>
                    <DarkInput icon={Globe} placeholder="https://yourstore.com" />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02, boxShadow: "0 0 24px rgba(220,38,38,0.35)" }}
                    whileTap={{ scale: 0.97 }}
                    className="h-10 px-6 rounded-full text-sm font-bold text-white flex items-center gap-2 transition-all"
                    style={{ background: "#dc2626", boxShadow: "0 0 14px rgba(220,38,38,0.2)" }}
                    disabled={savingProfile}
                    onClick={saveProfile}
                  >
                    {savingProfile
                      ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <><Check className="w-4 h-4" />Save changes</>}
                  </motion.button>
                </div>
              </div>
            )}

            {/* ── Plan & Credits ───────────────────────────────────────── */}
            {activeSection === "plan" && (
              <div>
                <h2 className="text-xl font-black tracking-tight mb-1" style={{ color: W.text }}>Plan & Credits</h2>
                <p className="text-sm mb-6" style={{ color: W.muted }}>Manage your subscription and credits</p>

                {/* Current plan banner */}
                <div className="relative p-5 rounded-2xl mb-7 overflow-hidden" style={{ border: `1px solid ${W.redBorder}`, background: W.redBg }}>
                  <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 80% 50%, rgba(220,38,38,0.12) 0%, transparent 60%)" }} />
                  <div className="relative flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="w-4 h-4" style={{ color: W.red }} />
                        <p className="font-bold text-sm" style={{ color: W.text }}>{planLabel(user.plan)} Plan</p>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: W.glass, color: W.muted }}>Current</span>
                      </div>
                      <p className="text-2xl font-black mb-0.5" style={{ color: W.text }}>
                        {user.credits} <span className="text-base font-normal" style={{ color: W.muted }}>credits remaining</span>
                      </p>
                      <p className="text-xs" style={{ color: W.dim }}>Resets monthly · {currentPlan.price === 0 ? "Free forever" : `$${currentPlan.price}/month`}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs mb-1" style={{ color: W.dim }}>{user.credits}/{currentPlan.credits}</p>
                      <div className="w-28 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: "linear-gradient(to right, #dc2626, #f97316)" }}
                          initial={{ width: 0 }}
                          animate={{ width: `${creditsPercent}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Plans */}
                <div className="space-y-3">
                  {PLANS.map((plan) => {
                    const isCurrent = plan.id === user.plan;
                    return (
                      <div
                        key={plan.id}
                        className="relative p-5 rounded-2xl transition-all"
                        style={plan.highlight
                          ? { border: `1px solid ${W.redBorder}`, background: W.redBg }
                          : isCurrent
                          ? { border: `1px solid ${W.border}`, background: W.glass }
                          : { border: `1px solid ${W.border}`, background: W.glassDim }}
                      >
                        {plan.highlight && (
                          <span className="absolute -top-2.5 left-4 text-[11px] font-black px-2.5 py-0.5 rounded-full text-white shadow-md"
                            style={{ background: "#dc2626", boxShadow: "0 0 12px rgba(220,38,38,0.4)" }}>
                            Most Popular
                          </span>
                        )}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-black" style={{ color: W.text }}>{plan.name}</p>
                              {isCurrent && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: W.glass, color: W.muted }}>Current</span>
                              )}
                            </div>
                            <p className="text-xl font-black" style={{ color: W.text }}>
                              {plan.price === 0 ? "Free" : `$${plan.price}`}
                              <span className="text-sm font-normal" style={{ color: W.muted }}>{plan.price > 0 ? "/mo" : ""}</span>
                            </p>
                            <ul className="mt-2 space-y-1">
                              {plan.features.slice(0, 3).map((f) => (
                                <li key={f} className="flex items-center gap-1.5 text-xs" style={{ color: W.muted }}>
                                  <Check className="w-3 h-3 shrink-0" style={{ color: W.red }} />
                                  {f}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <motion.button
                            whileHover={!isCurrent ? { scale: 1.03 } : {}}
                            whileTap={!isCurrent ? { scale: 0.97 } : {}}
                            className="mt-1 shrink-0 h-8 px-4 rounded-xl text-xs font-bold transition-all"
                            style={isCurrent
                              ? { border: `1px solid ${W.border}`, background: W.glass, color: W.dim, cursor: "default" }
                              : plan.highlight
                              ? { background: "#dc2626", color: "#fff", boxShadow: "0 0 14px rgba(220,38,38,0.25)" }
                              : { border: `1px solid ${W.border}`, background: W.glass, color: W.text }}
                            disabled={isCurrent}
                            onClick={() => toast.info("Plan upgrade — connect Stripe to enable.")}
                          >
                            {isCurrent ? "Current plan" : plan.cta}
                          </motion.button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Billing ─────────────────────────────────────────────── */}
            {activeSection === "billing" && (
              <div>
                <h2 className="text-xl font-black tracking-tight mb-1" style={{ color: W.text }}>Billing</h2>
                <p className="text-sm mb-6" style={{ color: W.muted }}>Payment methods and invoice history</p>
                <div className="p-5 rounded-2xl text-center py-14" style={{ border: `1px solid ${W.border}`, background: W.glassDim }}>
                  <CreditCard className="w-10 h-10 mx-auto mb-3" style={{ color: W.dim }} />
                  <p className="text-sm font-semibold mb-1" style={{ color: W.muted }}>No payment method on file</p>
                  <p className="text-xs mb-4" style={{ color: W.dim }}>You&apos;re on the Free plan — no card needed</p>
                  <motion.button
                    whileHover={{ scale: 1.03, boxShadow: "0 0 20px rgba(220,38,38,0.35)" }}
                    whileTap={{ scale: 0.97 }}
                    className="h-8 px-4 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 mx-auto"
                    style={{ background: "#dc2626", boxShadow: "0 0 12px rgba(220,38,38,0.2)" }}
                    onClick={() => toast.info("Billing — connect Stripe to enable.")}
                  >
                    <Zap className="w-3.5 h-3.5" />Upgrade to unlock
                  </motion.button>
                </div>
              </div>
            )}

            {/* ── Security ────────────────────────────────────────────── */}
            {activeSection === "security" && (
              <div>
                <h2 className="text-xl font-black tracking-tight mb-1" style={{ color: W.text }}>Security</h2>
                <p className="text-sm mb-6" style={{ color: W.muted }}>Password, 2FA and active sessions</p>
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl" style={{ border: `1px solid ${W.border}`, background: W.glassDim }}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: W.glass }}>
                        <KeyRound className="w-4 h-4" style={{ color: W.muted }} />
                      </div>
                      <div>
                        <p className="text-sm font-bold" style={{ color: W.text }}>Password</p>
                        <p className="text-xs" style={{ color: W.dim }}>Last changed: never</p>
                      </div>
                      <button
                        className="ml-auto h-8 px-3 rounded-lg text-xs font-semibold transition-all"
                        style={{ border: `1px solid ${W.border}`, background: W.glass, color: W.muted }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = W.text; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = W.muted; }}
                        onClick={() => toast.info("Password reset — connect auth to enable.")}
                      >
                        Change
                      </button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold mb-1.5 block" style={{ color: W.muted }}>Current password</label>
                        <DarkInput type="password" placeholder="••••••••" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold mb-1.5 block" style={{ color: W.muted }}>New password</label>
                        <DarkInput type="password" placeholder="Min. 8 characters" />
                      </div>
                    </div>
                  </div>

                  {[
                    { icon: Shield, title: "Two-factor auth", sub: "Add an extra layer of security", action: () => toast.info("2FA — connect auth to enable."), cta: "Enable" },
                    { icon: History, title: "Active sessions", sub: "1 active session · This device", action: () => toast.info("Revoke sessions — connect auth to enable."), cta: "Revoke all", danger: true },
                  ].map(({ icon: Icon, title, sub, action, cta, danger }) => (
                    <div key={title} className="flex items-center justify-between p-4 rounded-2xl" style={{ border: `1px solid ${W.border}`, background: W.glassDim }}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: W.glass }}>
                          <Icon className="w-4 h-4" style={{ color: W.muted }} />
                        </div>
                        <div>
                          <p className="text-sm font-bold" style={{ color: W.text }}>{title}</p>
                          <p className="text-xs" style={{ color: W.dim }}>{sub}</p>
                        </div>
                      </div>
                      <button
                        className="h-8 px-3 rounded-lg text-xs font-semibold transition-all"
                        style={danger
                          ? { color: "#f87171" }
                          : { border: `1px solid ${W.border}`, background: W.glass, color: W.muted }}
                        onMouseEnter={(e) => {
                          if (danger) { e.currentTarget.style.background = "rgba(220,38,38,0.1)"; e.currentTarget.style.color = "#fca5a5"; }
                          else e.currentTarget.style.color = W.text;
                        }}
                        onMouseLeave={(e) => {
                          if (danger) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#f87171"; }
                          else e.currentTarget.style.color = W.muted;
                        }}
                        onClick={action}
                      >
                        {cta}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Notifications ───────────────────────────────────────── */}
            {activeSection === "notifications" && (
              <div>
                <h2 className="text-xl font-black tracking-tight mb-1" style={{ color: W.text }}>Notifications</h2>
                <p className="text-sm mb-6" style={{ color: W.muted }}>Choose what you hear about</p>
                <div className="space-y-3">
                  {([
                    { key: "generationDone" as const, label: "Generation complete", desc: "Notify when images are ready" },
                    { key: "billing" as const, label: "Billing & credits", desc: "Receipts, low credit warnings" },
                    { key: "tips" as const, label: "Tips & tutorials", desc: "Improve your results" },
                    { key: "newsletter" as const, label: "Newsletter", desc: "New features and updates" },
                  ]).map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center justify-between p-4 rounded-2xl" style={{ border: `1px solid ${W.border}`, background: W.glassDim }}>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: W.text }}>{label}</p>
                        <p className="text-xs mt-0.5" style={{ color: W.dim }}>{desc}</p>
                      </div>
                      <button
                        onClick={() => setNotifications((prev) => ({ ...prev, [key]: !prev[key] }))}
                        className="relative w-11 h-6 rounded-full transition-colors shrink-0"
                        style={{ background: notifications[key] ? "#dc2626" : "rgba(255,255,255,0.08)", border: `1px solid ${notifications[key] ? "rgba(220,38,38,0.4)" : W.border}` }}
                      >
                        <motion.span
                          layout
                          className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
                          style={{ left: notifications[key] ? "calc(100% - 1.25rem)" : "0.25rem" }}
                          transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}


          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
