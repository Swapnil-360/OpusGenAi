"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import {
  Bell, Check, Clock, CreditCard, Crown, Globe, History,
  KeyRound, LogOut, Shield, ShieldCheck, Sparkles, User, X as XIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PLANS } from "@/lib/mock-data";
import { DEFAULT_NOTIFICATION_PREFS, type NotificationPrefs } from "@/lib/notification-prefs";
import { planLabel } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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

function FieldInput({ value, onChange, type = "text", placeholder, icon: Icon, autoComplete, readOnly }: {
  value?: string; onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string; placeholder?: string; icon?: React.ElementType; autoComplete?: string; readOnly?: boolean;
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
        readOnly={readOnly}
        className="w-full h-9 rounded-xl text-sm outline-none transition-all"
        style={{
          background: readOnly ? "rgba(255,255,255,0.02)" : W.glass,
          border: `1px solid ${W.border}`,
          color: readOnly ? W.dim : W.text,
          paddingLeft: Icon ? "2.25rem" : "0.75rem",
          paddingRight: "0.75rem",
          cursor: readOnly ? "default" : "text",
        }}
        onFocus={(e) => { if (!readOnly) e.currentTarget.style.borderColor = W.redBorder; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = W.border; }}
      />
    </div>
  );
}

export default function AccountPage() {
  const router = useRouter();
  const supabase = createClient();

  const [activeSection, setActiveSection] = useState<SectionId>("profile");
  const [authUser, setAuthUser] = useState<{ email: string; id: string } | null>(null);
  const [name, setName] = useState("");
  const [credits, setCredits] = useState(10);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [totalGenerations, setTotalGenerations] = useState(0);
  const [notifications, setNotifications] = useState<NotificationPrefs>(DEFAULT_NOTIFICATION_PREFS);
  const [savingProfile, setSavingProfile] = useState(false);
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [savingPwd, setSavingPwd] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // 2FA (Supabase TOTP)
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaLoading, setMfaLoading] = useState(false);
  const [enrollData, setEnrollData] = useState<{ factorId: string; qrCode: string; secret: string } | null>(null);
  const [verifyCode, setVerifyCode] = useState("");

  useEffect(() => {
    async function load() {
      // getSession() reads the local session (no network round trip) — RLS still
      // gates every query below, so this is just as safe as getUser() here.
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) { router.push("/login"); return; }
      setAuthUser({ email: user.email ?? "", id: user.id });

      // Server-only allowlist check — never trust a client-side email list.
      fetch("/api/admin/check").then((res) => setIsAdmin(res.ok)).catch(() => {});

      const [{ data: profile }, { count }, { data: factors }, prefsResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name, credits, avatar_url")
          .eq("id", user.id)
          .single(),
        supabase
          .from("generations")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("status", "completed"),
        supabase.auth.mfa.listFactors(),
        // Isolated from the query above: older schemas without this column
        // shouldn't break the rest of profile loading, just fall back to defaults.
        supabase.from("profiles").select("notification_prefs").eq("id", user.id).single(),
      ]);

      if (profile) {
        setName(profile.full_name ?? user.email?.split("@")[0] ?? "");
        setCredits(profile.credits ?? 10);
        setAvatarUrl(profile.avatar_url ?? null);
      }
      setTotalGenerations(count ?? 0);

      const verifiedFactor = factors?.totp.find((f) => f.status === "verified");
      setMfaFactorId(verifiedFactor?.id ?? null);

      const savedPrefs = prefsResult.data?.notification_prefs as Partial<typeof notifications> | null;
      if (savedPrefs) setNotifications((prev) => ({ ...prev, ...savedPrefs }));
    }
    load();
  }, []);

  function toggleNotification(key: keyof typeof notifications) {
    setNotifications((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      if (authUser) {
        supabase
          .from("profiles")
          .update({ notification_prefs: next, updated_at: new Date().toISOString() })
          .eq("id", authUser.id)
          .then(({ error }) => { if (error) toast.error("Couldn't save that preference."); });
      }
      return next;
    });
  }

  async function startMfaEnroll() {
    setMfaLoading(true);
    // Clean up a stale unverified factor from any abandoned previous attempt.
    const { data: existing } = await supabase.auth.mfa.listFactors();
    const stale = existing?.all.find((f) => f.factor_type === "totp" && f.status === "unverified");
    if (stale) await supabase.auth.mfa.unenroll({ factorId: stale.id });

    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "Authenticator app" });
    setMfaLoading(false);
    if (error || !data) { toast.error(error?.message || "Couldn't start 2FA setup."); return; }
    setEnrollData({ factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret });
  }

  function cancelMfaEnroll() {
    if (enrollData) supabase.auth.mfa.unenroll({ factorId: enrollData.factorId }).catch(() => {});
    setEnrollData(null);
    setVerifyCode("");
  }

  async function verifyMfaEnroll(e: React.FormEvent) {
    e.preventDefault();
    if (!enrollData || verifyCode.length !== 6) return;
    setMfaLoading(true);
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: enrollData.factorId, code: verifyCode });
    setMfaLoading(false);
    if (error) { toast.error(error.message || "Invalid code. Try again."); return; }
    toast.success("Two-factor authentication enabled.");
    setMfaFactorId(enrollData.factorId);
    setEnrollData(null);
    setVerifyCode("");
  }

  async function disableMfa() {
    if (!mfaFactorId) return;
    setMfaLoading(true);
    const { error } = await supabase.auth.mfa.unenroll({ factorId: mfaFactorId });
    setMfaLoading(false);
    if (error) { toast.error(error.message || "Couldn't disable 2FA."); return; }
    toast.success("Two-factor authentication disabled.");
    setMfaFactorId(null);
  }

  const currentPlan = PLANS.find((p) => p.id === "free")!;
  const creditsPercent = Math.min(100, Math.round((credits / (currentPlan?.credits ?? 10)) * 100));
  const displayName = name || authUser?.email?.split("@")[0] || "User";
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  async function saveProfile() {
    if (!authUser) return;
    setSavingProfile(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: name, updated_at: new Date().toISOString() })
      .eq("id", authUser.id);
    setSavingProfile(false);
    if (error) { toast.error("Failed to save profile."); return; }
    toast.success("Profile saved!");
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (!newPwd || newPwd.length < 8) { toast.error("New password must be at least 8 characters."); return; }
    setSavingPwd(true);
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
            {avatarUrl && <AvatarImage src={avatarUrl} />}
            <AvatarFallback className="text-xs font-bold" style={{ background: W.redBg, color: W.red }}>
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold leading-none truncate" style={{ color: W.text }}>{displayName}</p>
            <p className="text-[11px] mt-0.5 truncate" style={{ color: W.dim }}>{authUser?.email ?? "—"}</p>
          </div>
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
            style={{ background: W.glass, border: `1px solid ${W.border}`, color: W.muted }}
          >
            {planLabel("free")}
          </span>
          {isAdmin && (
            <a
              href="/adminopusgenai"
              className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 transition-all"
              style={{ background: W.redBg, border: `1px solid ${W.redBorder}`, color: W.red }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(220,38,38,0.2)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = W.redBg; }}
            >
              <Shield className="w-2.5 h-2.5" />
              Admin
            </a>
          )}
          <button
            onClick={handleSignOut}
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
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Avatar card */}
                  <div
                    className="flex items-center gap-3 p-3.5 rounded-xl sm:w-64 shrink-0"
                    style={{ border: `1px solid ${W.border}`, background: W.glassDim }}
                  >
                    <Avatar className="w-12 h-12 shrink-0" style={{ outline: `2px solid ${W.border}`, outlineOffset: "2px" }}>
                      {avatarUrl && <AvatarImage src={avatarUrl} />}
                      <AvatarFallback className="text-base font-bold" style={{ background: W.redBg, color: W.red }}>
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: W.text }}>{displayName}</p>
                      <p className="text-[10px] truncate mb-2" style={{ color: W.dim }}>{authUser?.email ?? "—"}</p>
                      <button
                        className="h-6 px-2.5 rounded-md text-[11px] font-medium transition-all"
                        style={{ border: `1px solid ${W.border}`, background: W.glass, color: W.muted }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = W.text; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = W.muted; }}
                        onClick={() => toast.info("Avatar upload coming soon.")}
                      >
                        Change photo
                      </button>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 flex-1">
                    {[
                      { label: "Generations", value: totalGenerations },
                      { label: "Credits left", value: credits },
                      { label: "Images", value: totalGenerations },
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
                    <FieldInput type="email" value={authUser?.email ?? ""} readOnly />
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
                <div
                  className="relative p-4 rounded-xl overflow-hidden"
                  style={{ border: `1px solid ${W.redBorder}`, background: W.redBg }}
                >
                  <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 80% 50%, rgba(220,38,38,0.10) 0%, transparent 60%)" }} />
                  <div className="relative flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="w-3.5 h-3.5 shrink-0" style={{ color: W.red }} />
                        <p className="text-xs font-semibold" style={{ color: W.text }}>{planLabel("free")} Plan</p>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: W.glass, color: W.muted }}>Current</span>
                      </div>
                      <p className="text-xl font-black" style={{ color: W.text }}>
                        {credits} <span className="text-sm font-normal" style={{ color: W.muted }}>credits remaining</span>
                      </p>
                      <p className="text-[11px] mt-0.5" style={{ color: W.dim }}>
                        Resets monthly · Free forever
                      </p>
                    </div>
                    <div className="shrink-0">
                      <p className="text-[10px] mb-1 text-right" style={{ color: W.dim }}>{credits} / {currentPlan.credits}</p>
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

                {/* Paid plans aren't purchasable yet — say so up front rather than
                    letting an inviting CTA dead-end into a toast. */}
                <div
                  className="flex items-center gap-2.5 p-3 rounded-xl"
                  style={{ border: `1px solid ${W.border}`, background: W.glassDim }}
                >
                  <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: W.muted }} />
                  <p className="text-[11px]" style={{ color: W.muted }}>
                    Paid plans are coming soon — checkout isn&apos;t live yet. Everyone stays on Free for now.
                  </p>
                </div>

                <div className="flex flex-col gap-2.5">
                  {PLANS.map((plan) => {
                    const isCurrent = plan.id === "free";
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
                          <button
                            className="mt-1 shrink-0 h-8 px-3.5 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                            style={{ border: `1px solid ${W.border}`, background: W.glass, color: W.dim, cursor: "default" }}
                            disabled
                          >
                            {isCurrent ? "Current" : <><Clock className="w-3 h-3" />Coming soon</>}
                          </button>
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
                <div
                  className="h-8 px-4 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                  style={{ border: `1px solid ${W.border}`, background: W.glass, color: W.dim }}
                >
                  <Clock className="w-3.5 h-3.5" />Billing coming soon
                </div>
              </div>
            )}

            {/* ── Security ── */}
            {activeSection === "security" && (
              <div className="flex flex-col gap-3">
                <div className="p-4 rounded-xl" style={{ border: `1px solid ${W.border}`, background: W.glassDim }}>
                  <div className="flex items-center gap-3 mb-3.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: W.glass }}>
                      <KeyRound className="w-3.5 h-3.5" style={{ color: W.muted }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold" style={{ color: W.text }}>Password</p>
                      <p className="text-[10px]" style={{ color: W.dim }}>Update your account password</p>
                    </div>
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

                {/* Two-factor auth */}
                <div className="p-4 rounded-xl" style={{ border: `1px solid ${W.border}`, background: W.glassDim }}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: mfaFactorId ? "rgba(34,197,94,0.12)" : W.glass }}>
                        {mfaFactorId ? <ShieldCheck className="w-3.5 h-3.5 text-green-400" /> : <Shield className="w-3.5 h-3.5" style={{ color: W.muted }} />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold" style={{ color: W.text }}>Two-factor auth</p>
                        <p className="text-[10px]" style={{ color: W.dim }}>
                          {mfaFactorId ? "Enabled — an authenticator code is required at sign-in" : "Add an extra layer of security"}
                        </p>
                      </div>
                    </div>
                    {!enrollData && (
                      mfaFactorId ? (
                        <button
                          disabled={mfaLoading}
                          onClick={disableMfa}
                          className="h-7 px-3 rounded-lg text-xs font-medium transition-all shrink-0 disabled:opacity-50"
                          style={{ color: "#f87171" }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(220,38,38,0.1)"; e.currentTarget.style.color = "#fca5a5"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#f87171"; }}
                        >
                          {mfaLoading ? "Disabling…" : "Disable"}
                        </button>
                      ) : (
                        <button
                          disabled={mfaLoading}
                          onClick={startMfaEnroll}
                          className="h-7 px-3 rounded-lg text-xs font-medium transition-all shrink-0 disabled:opacity-50"
                          style={{ border: `1px solid ${W.border}`, background: W.glass, color: W.muted }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = W.text)}
                          onMouseLeave={(e) => (e.currentTarget.style.color = W.muted)}
                        >
                          {mfaLoading ? "Starting…" : "Enable"}
                        </button>
                      )
                    )}
                  </div>

                  {enrollData && (
                    <div className="mt-4 pt-4 flex flex-col sm:flex-row gap-4" style={{ borderTop: `1px solid ${W.border}` }}>
                      <div className="shrink-0 self-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={enrollData.qrCode} alt="Scan with your authenticator app" className="w-32 h-32 rounded-lg bg-white p-1.5" />
                      </div>
                      <form onSubmit={verifyMfaEnroll} className="flex-1 min-w-0 flex flex-col gap-2.5">
                        <p className="text-[11px]" style={{ color: W.muted }}>
                          Scan with Google Authenticator, 1Password, or Authy — or enter this key manually:
                        </p>
                        <code className="text-[10px] px-2 py-1.5 rounded-lg break-all select-all" style={{ background: W.glass, border: `1px solid ${W.border}`, color: W.dim }}>
                          {enrollData.secret}
                        </code>
                        <div className="flex items-center gap-2">
                          <input
                            value={verifyCode}
                            onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            placeholder="6-digit code"
                            className="flex-1 h-9 rounded-xl text-sm text-center tracking-[0.3em] outline-none"
                            style={{ background: W.glass, border: `1px solid ${W.border}`, color: W.text }}
                          />
                          <button
                            type="button"
                            onClick={cancelMfaEnroll}
                            className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
                            style={{ border: `1px solid ${W.border}`, color: W.dim }}
                            aria-label="Cancel"
                          >
                            <XIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <button
                          type="submit"
                          disabled={mfaLoading || verifyCode.length !== 6}
                          className="h-9 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ background: "#dc2626", color: "#fff" }}
                        >
                          {mfaLoading ? "Verifying…" : "Verify & enable"}
                        </button>
                      </form>
                    </div>
                  )}
                </div>

                {[
                  { icon: History, title: "Active sessions",  sub: "Sign out all other sessions",         cta: "Revoke all",  danger: true,  action: async () => { await supabase.auth.signOut({ scope: "others" }); toast.success("Other sessions signed out."); } },
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
                      onClick={() => toggleNotification(key)}
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
