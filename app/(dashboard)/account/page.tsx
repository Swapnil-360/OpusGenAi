"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import {
  Bell, Check, CreditCard, Crown, Globe, History,
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
  { id: "profile",       label: "Profile",       icon: User },
  { id: "plan",          label: "Plan",          icon: Crown },
  { id: "billing",       label: "Billing",       icon: CreditCard },
  { id: "security",      label: "Security",      icon: Shield },
  { id: "notifications", label: "Alerts",        icon: Bell },
] as const;
type SectionId = (typeof SECTIONS)[number]["id"];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: W.dim }}>
      {children}
    </p>
  );
}

function FieldInput({ value, onChange, type = "text", placeholder, icon: Icon, autoComplete }: {
  value?: string; onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string; placeholder?: string; icon?: React.ElementType; autoComplete?: string;
}) {
  return (
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: W.dim }} />}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full h-9 rounded-xl text-sm outline-none transition-all"
        style={{
          background: W.glass,
          border: `1px solid ${W.border}`,
          color: W.text,
          paddingLeft: Icon ? "2.25rem" : "0.75rem",
          paddingRight: "0.75rem",
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = W.redBorder; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = W.border; }}
      />
    </div>
  );
}

export default function AccountPage() {
  const user = MOCK_CURRENT_USER;
  const [activeSection, setActiveSection] = useState<SectionId>("profile");
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [notifications, setNotifications] = useState({
    generationDone: true, billing: true, tips: false, newsletter: false,
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [savingPwd, setSavingPwd] = useState(false);

  const creditsPercent = Math.min(100, Math.round((user.credits / (PLANS.find((p) => p.id === user.plan)?.credits ?? 10)) * 100));
  const currentPlan = PLANS.find((p) => p.id === user.plan)!;
  const totalGenerated = MOCK_GENERATIONS.length;

  function saveProfile() {
    setSavingProfile(true);
    setTimeout(() => { setSavingProfile(false); toast.success("Profile saved!"); }, 1200);
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (!newPwd || newPwd.length < 8) { toast.error("New password must be at least 8 characters."); return; }
    setSavingPwd(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPwd });
    setSavingPwd(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated.");
    setCurrentPwd(""); setNewPwd("");
  }

  return (
    <div className="h-full overflow-y-auto" style={{ background: W.bg }}>
      <div className="max-w-3xl mx-auto px-5 py-6 flex flex-col gap-5">

        {/* ── User card ── */}
        <div
          className="flex items-center gap-3 p-3 rounded-xl"
          style={{ border: `1px solid ${W.border}`, background: W.glassDim }}
        >
          <Avatar className="w-9 h-9 shrink-0" style={{ outline: `2px solid ${W.border}`, outlineOffset: "1px" }}>
            <AvatarImage src={user.avatar} />
            <AvatarFallback className="text-xs font-bold" style={{ background: W.redBg, color: W.red }}>
              {user.name.split(" ").map((n: string) => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold leading-none truncate" style={{ color: W.text }}>{user.name}</p>
            <p className="text-[11px] mt-0.5 truncate" style={{ color: W.dim }}>{user.email}</p>
          </div>
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
            style={{ background: W.glass, border: `1px solid ${W.border}`, color: W.muted }}
          >
            {planLabel(user.plan)}
          </span>
          <button
            onClick={() => toast.info("Sign out — not connected to auth.")}
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all"
            style={{ color: W.dim }}
            title="Sign out"
            onMouseEnter={(e) => { e.currentTarget.style.color = "#f87171"; e.currentTarget.style.background = W.redBg; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = W.dim; e.currentTarget.style.background = "transparent"; }}
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* ── Section tabs ── */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className="h-8 w-full rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 truncate px-2"
              style={activeSection === id
                ? { background: "#dc2626", color: "#fff", border: "1px solid transparent" }
                : { border: `1px solid ${W.border}`, background: W.glassDim, color: W.muted }}
              onMouseEnter={(e) => { if (activeSection !== id) { e.currentTarget.style.background = W.glass; e.currentTarget.style.color = W.text; } }}
              onMouseLeave={(e) => { if (activeSection !== id) { e.currentTarget.style.background = W.glassDim; e.currentTarget.style.color = W.muted; } }}
            >
              <Icon className="w-3 h-3 shrink-0" />
              <span className="truncate hidden xs:inline sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* ── Section content ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
          >

            {/* ── Profile ── */}
            {activeSection === "profile" && (
              <div className="flex flex-col gap-4">
                {/* Avatar + stats row */}
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Avatar card */}
                  <div
                    className="flex items-center gap-3 p-3.5 rounded-xl sm:w-64 shrink-0"
                    style={{ border: `1px solid ${W.border}`, background: W.glassDim }}
                  >
                    <Avatar className="w-12 h-12 shrink-0" style={{ outline: `2px solid ${W.border}`, outlineOffset: "2px" }}>
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback className="text-base font-bold" style={{ background: W.redBg, color: W.red }}>
                        {user.name.split(" ").map((n: string) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: W.text }}>{user.name}</p>
                      <p className="text-[10px] truncate mb-2" style={{ color: W.dim }}>{user.email}</p>
                      <button
                        className="h-6 px-2.5 rounded-md text-[11px] font-medium transition-all"
                        style={{ border: `1px solid ${W.border}`, background: W.glass, color: W.muted }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = W.text; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = W.muted; }}
                        onClick={() => toast.info("Avatar upload — not connected to backend.")}
                      >
                        Change photo
                      </button>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 flex-1">
                    {[
                      { label: "Generations", value: totalGenerated },
                      { label: "Credits left", value: user.credits },
                      { label: "Images", value: totalGenerated * 4 },
                    ].map(({ label, value }) => (
                      <div
                        key={label}
                        className="flex flex-col items-center justify-center p-3 rounded-xl text-center"
                        style={{ border: `1px solid ${W.border}`, background: W.glassDim }}
                      >
                        <p className="text-xl font-black tabular-nums" style={{ color: W.text }}>{value}</p>
                        <p className="text-[10px] mt-0.5" style={{ color: W.dim }}>{label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Form */}
                <div
                  className="flex flex-col gap-3.5 p-4 rounded-xl"
                  style={{ border: `1px solid ${W.border}`, background: W.glassDim }}
                >
                  <div>
                    <SectionLabel>Full name</SectionLabel>
                    <FieldInput value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div>
                    <SectionLabel>Email address</SectionLabel>
                    <FieldInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div>
                    <SectionLabel>Website</SectionLabel>
                    <FieldInput icon={Globe} placeholder="https://yourstore.com" />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.97 }}
                    className="h-9 px-5 rounded-lg text-sm font-semibold text-white flex items-center gap-2 self-start transition-all disabled:opacity-60"
                    style={{ background: "#dc2626" }}
                    disabled={savingProfile}
                    onClick={saveProfile}
                  >
                    {savingProfile
                      ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</>
                      : <><Check className="w-3.5 h-3.5" />Save changes</>}
                  </motion.button>
                </div>
              </div>
            )}

            {/* ── Plan & Credits ── */}
            {activeSection === "plan" && (
              <div className="flex flex-col gap-4">
                {/* Current plan banner */}
                <div
                  className="relative p-4 rounded-xl overflow-hidden"
                  style={{ border: `1px solid ${W.redBorder}`, background: W.redBg }}
                >
                  <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 80% 50%, rgba(220,38,38,0.10) 0%, transparent 60%)" }} />
                  <div className="relative flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="w-3.5 h-3.5 shrink-0" style={{ color: W.red }} />
                        <p className="text-xs font-semibold" style={{ color: W.text }}>{planLabel(user.plan)} Plan</p>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: W.glass, color: W.muted }}>Current</span>
                      </div>
                      <p className="text-xl font-black" style={{ color: W.text }}>
                        {user.credits} <span className="text-sm font-normal" style={{ color: W.muted }}>credits remaining</span>
                      </p>
                      <p className="text-[11px] mt-0.5" style={{ color: W.dim }}>
                        Resets monthly · {currentPlan.price === 0 ? "Free forever" : `$${currentPlan.price}/mo`}
                      </p>
                    </div>
                    <div className="shrink-0">
                      <p className="text-[10px] mb-1 text-right" style={{ color: W.dim }}>{user.credits} / {currentPlan.credits}</p>
                      <div className="w-32 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
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
                <div className="flex flex-col gap-2.5">
                  {PLANS.map((plan) => {
                    const isCurrent = plan.id === user.plan;
                    return (
                      <div
                        key={plan.id}
                        className="relative p-4 rounded-xl transition-all"
                        style={plan.highlight
                          ? { border: `1px solid ${W.redBorder}`, background: W.redBg }
                          : isCurrent
                          ? { border: `1px solid ${W.border}`, background: W.glass }
                          : { border: `1px solid ${W.border}`, background: W.glassDim }}
                      >
                        {plan.highlight && (
                          <span className="absolute -top-2 left-3.5 text-[10px] font-black px-2 py-0.5 rounded-full text-white"
                            style={{ background: "#dc2626" }}>
                            Popular
                          </span>
                        )}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="text-xs font-bold" style={{ color: W.text }}>{plan.name}</p>
                              {isCurrent && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: W.glass, color: W.muted }}>Current</span>
                              )}
                            </div>
                            <p className="text-lg font-black" style={{ color: W.text }}>
                              {plan.price === 0 ? "Free" : `$${plan.price}`}
                              <span className="text-xs font-normal ml-0.5" style={{ color: W.muted }}>{plan.price > 0 ? "/mo" : ""}</span>
                            </p>
                            <ul className="mt-1.5 space-y-0.5">
                              {plan.features.slice(0, 3).map((f) => (
                                <li key={f} className="flex items-center gap-1.5 text-[11px]" style={{ color: W.muted }}>
                                  <Check className="w-2.5 h-2.5 shrink-0" style={{ color: W.red }} />{f}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <motion.button
                            whileHover={!isCurrent ? { scale: 1.03 } : {}}
                            whileTap={!isCurrent ? { scale: 0.97 } : {}}
                            className="mt-1 shrink-0 h-8 px-3.5 rounded-lg text-xs font-semibold transition-all"
                            style={isCurrent
                              ? { border: `1px solid ${W.border}`, background: W.glass, color: W.dim, cursor: "default" }
                              : plan.highlight
                              ? { background: "#dc2626", color: "#fff" }
                              : { border: `1px solid ${W.border}`, background: W.glass, color: W.text }}
                            disabled={isCurrent}
                            onClick={() => toast.info("Plan upgrade — connect Stripe to enable.")}
                          >
                            {isCurrent ? "Current" : plan.cta}
                          </motion.button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Billing ── */}
            {activeSection === "billing" && (
              <div
                className="flex flex-col items-center text-center py-12 rounded-xl"
                style={{ border: `1px solid ${W.border}`, background: W.glassDim }}
              >
                <CreditCard className="w-9 h-9 mb-3" style={{ color: W.dim }} />
                <p className="text-sm font-semibold mb-1" style={{ color: W.muted }}>No payment method on file</p>
                <p className="text-xs mb-4" style={{ color: W.dim }}>You&apos;re on the Free plan — no card needed</p>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="h-8 px-4 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5"
                  style={{ background: "#dc2626" }}
                  onClick={() => toast.info("Billing — connect Stripe to enable.")}
                >
                  <Zap className="w-3.5 h-3.5" />Upgrade to unlock
                </motion.button>
              </div>
            )}

            {/* ── Security ── */}
            {activeSection === "security" && (
              <div className="flex flex-col gap-3">
                {/* Password form */}
                <div className="p-4 rounded-xl" style={{ border: `1px solid ${W.border}`, background: W.glassDim }}>
                  <div className="flex items-center gap-3 mb-3.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: W.glass }}>
                      <KeyRound className="w-3.5 h-3.5" style={{ color: W.muted }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold" style={{ color: W.text }}>Password</p>
                      <p className="text-[10px]" style={{ color: W.dim }}>Last changed: never</p>
                    </div>
                    <button
                      className="h-7 px-3 rounded-lg text-xs font-medium transition-all shrink-0"
                      style={{ border: `1px solid ${W.border}`, background: W.glass, color: W.muted }}
                      onMouseEnter={(e) => e.currentTarget.style.color = W.text}
                      onMouseLeave={(e) => e.currentTarget.style.color = W.muted}
                      onClick={() => toast.info("Password reset — connect auth to enable.")}
                    >
                      Reset
                    </button>
                  </div>
                  <form onSubmit={handlePasswordChange} className="flex flex-col gap-3">
                    <div>
                      <SectionLabel>Current password</SectionLabel>
                      <FieldInput type="password" autoComplete="current-password" placeholder="••••••••" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} />
                    </div>
                    <div>
                      <SectionLabel>New password</SectionLabel>
                      <FieldInput type="password" autoComplete="new-password" placeholder="Min. 8 characters" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} />
                    </div>
                    <button
                      type="submit"
                      disabled={savingPwd || !newPwd}
                      className="h-9 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ background: "#dc2626", color: "#fff" }}
                    >
                      {savingPwd ? "Updating…" : "Update password"}
                    </button>
                  </form>
                </div>

                {/* 2FA + Sessions */}
                {[
                  { icon: Shield,  title: "Two-factor auth",  sub: "Add an extra layer of security",     cta: "Enable",      danger: false, action: () => toast.info("2FA — connect auth to enable.") },
                  { icon: History, title: "Active sessions",  sub: "1 active session · This device",     cta: "Revoke all",  danger: true,  action: () => toast.info("Revoke sessions — connect auth to enable.") },
                ].map(({ icon: Icon, title, sub, action, cta, danger }) => (
                  <div key={title} className="flex items-center justify-between p-3.5 rounded-xl" style={{ border: `1px solid ${W.border}`, background: W.glassDim }}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: W.glass }}>
                        <Icon className="w-3.5 h-3.5" style={{ color: W.muted }} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold" style={{ color: W.text }}>{title}</p>
                        <p className="text-[10px]" style={{ color: W.dim }}>{sub}</p>
                      </div>
                    </div>
                    <button
                      className="h-7 px-3 rounded-lg text-xs font-medium transition-all shrink-0"
                      style={danger ? { color: "#f87171" } : { border: `1px solid ${W.border}`, background: W.glass, color: W.muted }}
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
            )}

            {/* ── Notifications ── */}
            {activeSection === "notifications" && (
              <div className="flex flex-col gap-2.5">
                {([
                  { key: "generationDone" as const, label: "Generation complete", desc: "Notify when images are ready" },
                  { key: "billing"        as const, label: "Billing & credits",   desc: "Receipts, low credit warnings" },
                  { key: "tips"           as const, label: "Tips & tutorials",     desc: "Improve your results" },
                  { key: "newsletter"     as const, label: "Newsletter",           desc: "New features and updates" },
                ]).map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between p-3.5 rounded-xl" style={{ border: `1px solid ${W.border}`, background: W.glassDim }}>
                    <div>
                      <p className="text-xs font-semibold" style={{ color: W.text }}>{label}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: W.dim }}>{desc}</p>
                    </div>
                    <button
                      onClick={() => setNotifications((prev) => ({ ...prev, [key]: !prev[key] }))}
                      className="relative w-10 h-5 rounded-full transition-colors shrink-0 ml-4"
                      style={{
                        background: notifications[key] ? "#dc2626" : "rgba(255,255,255,0.08)",
                        border: `1px solid ${notifications[key] ? "rgba(220,38,38,0.4)" : W.border}`,
                      }}
                    >
                      <motion.span
                        layout
                        className="absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow-sm"
                        style={{ left: notifications[key] ? "calc(100% - 1rem)" : "0.125rem" }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      />
                    </button>
                  </div>
                ))}
              </div>
            )}

          </motion.div>
        </AnimatePresence>

        <div className="h-4" />
      </div>
    </div>
  );
}
