"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Zap, Clock, User, LogOut, ChevronRight,
  Menu, Layers, PenSquare, Wrench, Scissors, Replace, Eraser, Maximize2, Frame,
} from "lucide-react";
import { LogoBrand } from "@/components/shared/LogoBrand";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FeedbackButton } from "@/components/shared/FeedbackModal";
import { MOCK_CURRENT_USER } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

// ── Theme tokens ──────────────────────────────────────────────────────────────
const S = {
  bg: "#0b0303",
  border: "rgba(255,255,255,0.07)",
  textPrimary: "rgba(255,255,255,0.9)",
  textMuted: "rgba(255,255,255,0.45)",
  textDim: "rgba(255,255,255,0.28)",
  activeText: "#f87171",
  activeBg: "rgba(220,38,38,0.14)",
  activeBorder: "rgba(220,38,38,0.35)",
  hoverBg: "rgba(255,255,255,0.05)",
  red: "#dc2626",
};

const NAV_ITEMS = [
  { href: "/generate", label: "Generate", icon: Sparkles },
  { href: "/templates", label: "Templates", icon: Layers },
  { href: "/studio", label: "Content Studio", icon: PenSquare },
  { href: "/history", label: "History", icon: Clock },
  { href: "/account", label: "Account", icon: User },
];

const TOOL_ITEMS = [
  { href: "/tools/remove-bg", label: "Remove BG", icon: Scissors, color: "#60a5fa" },
  { href: "/tools/replace-bg", label: "Replace BG", icon: Replace, color: "#34d399" },
  { href: "/tools/cleanup", label: "Cleanup", icon: Eraser, color: "#fbbf24" },
  { href: "/tools/upscale", label: "Upscale 4×", icon: Maximize2, color: "#f87171" },
  { href: "/tools/uncrop", label: "Uncrop", icon: Frame, color: "#f472b6" },
];

type SidebarProps = { pathname: string; collapsed: boolean; setMobileOpen: (v: boolean) => void };

function SidebarContent({ pathname, collapsed, setMobileOpen }: SidebarProps) {
  const user = MOCK_CURRENT_USER;
  return (
    <div className="flex flex-col h-full" style={{ color: S.textPrimary }}>

      {/* Logo */}
      <div
        className={cn("flex items-center h-16 shrink-0 overflow-hidden px-4", collapsed && "justify-center px-0")}
        style={{ borderBottom: `1px solid ${S.border}` }}
      >
        {collapsed && (
          <motion.div whileHover={{ scale: 1.06 }} transition={{ duration: 0.15 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo/OpusGen%20Ai(Orange).png" alt="OpusGen AI" className="h-7 w-auto" />
          </motion.div>
        )}
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              key="logo-brand"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.18 }}
            >
              <LogoBrand imgClass="h-9 w-auto" textClass="text-[15px]" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/generate" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 relative group",
                collapsed && "justify-center px-0 w-10 mx-auto"
              )}
              style={{
                background: active ? S.activeBg : "transparent",
                color: active ? S.activeText : S.textMuted,
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = S.hoverBg; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
            >
              {active && !collapsed && (
                <motion.span
                  layoutId="active-pill"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full"
                  style={{ background: S.red }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Icon className="w-4 h-4 shrink-0 relative z-10" />
              <AnimatePresence initial={false}>
                {!collapsed && (
                  <motion.span
                    key={`label-${href}`}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -4 }}
                    transition={{ duration: 0.15 }}
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}

        {/* Tools section */}
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              key="tools-section"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-3 mb-1 px-3">
                <p
                  className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5"
                  style={{ color: S.textDim }}
                >
                  <Wrench className="w-3 h-3" />
                  Image Tools
                </p>
              </div>
              {TOOL_ITEMS.map(({ href, label, icon: Icon, color }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150"
                    style={{ color: active ? S.activeText : S.textMuted }}
                    onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = S.hoverBg; e.currentTarget.style.color = S.textPrimary; } }}
                    onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = S.textMuted; } }}
                  >
                    <div
                      className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${color}22` }}
                    >
                      <Icon className="w-3 h-3" style={{ color }} />
                    </div>
                    {label}
                  </Link>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Footer */}
      <div
        className="px-2 pb-3 shrink-0 pt-3 space-y-1"
        style={{ borderTop: `1px solid ${S.border}` }}
      >
        {/* Feedback */}
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              key="feedback-btn"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden px-2"
            >
              <FeedbackButton variant="pill" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Credits */}
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              key="credits-block"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-2 mb-2">
                <div
                  className="rounded-xl p-3"
                  style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.18)" }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: S.textDim }}>
                      Credits
                    </span>
                    <div className="flex items-center gap-1 text-xs font-bold" style={{ color: S.activeText }}>
                      <Zap className="w-3 h-3" />
                      {user.credits}
                    </div>
                  </div>
                  <div
                    className="w-full h-1.5 rounded-full overflow-hidden"
                    style={{ background: "rgba(255,255,255,0.08)" }}
                  >
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: "linear-gradient(to right, #dc2626, #f97316)" }}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((user.credits / 10) * 100, 100)}%` }}
                      transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                    />
                  </div>
                  {user.plan === "free" && (
                    <Link href="/account">
                      <motion.button
                        whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(220,38,38,0.3)" }}
                        whileTap={{ scale: 0.97 }}
                        className="w-full mt-2.5 h-7 rounded-lg text-[11px] font-bold text-white flex items-center justify-center gap-1.5 transition-all"
                        style={{ background: S.red, boxShadow: "0 0 12px rgba(220,38,38,0.2)" }}
                      >
                        <Zap className="w-2.5 h-2.5" /> Upgrade plan
                      </motion.button>
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* User row */}
        <div
          className={cn(
            "flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer group transition-all",
            collapsed && "justify-center px-0"
          )}
          title={collapsed ? user.name : undefined}
          onMouseEnter={(e) => (e.currentTarget.style.background = S.hoverBg)}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <Avatar className="w-7 h-7 shrink-0">
            <AvatarFallback
              className="text-xs font-bold"
              style={{ background: "rgba(220,38,38,0.2)", color: S.activeText }}
            >
              {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.div
                key="user-info"
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -4 }}
                transition={{ duration: 0.15 }}
                className="flex-1 min-w-0 flex items-center gap-2"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold truncate leading-none mb-0.5" style={{ color: S.textPrimary }}>
                    {user.name}
                  </p>
                  <p className="text-[10px] truncate" style={{ color: S.textDim }}>
                    {user.email}
                  </p>
                </div>
                <button
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg"
                  style={{ color: S.textMuted }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = S.textPrimary)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = S.textMuted)}
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = MOCK_CURRENT_USER;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#0f0404" }}>

      {/* Desktop sidebar */}
      <motion.aside
        className="hidden md:flex flex-col relative shrink-0"
        style={{ background: S.bg, borderRight: `1px solid ${S.border}` }}
        animate={{ width: collapsed ? 64 : 248 }}
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
      >
        <SidebarContent pathname={pathname} collapsed={collapsed} setMobileOpen={setMobileOpen} />

        {/* Collapse toggle */}
        <motion.button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-18 w-6 h-6 rounded-full flex items-center justify-center z-10 transition-colors"
          style={{
            background: S.bg,
            border: `1px solid ${S.border}`,
            color: S.textMuted,
            boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
          }}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div animate={{ rotate: collapsed ? 0 : 180 }} transition={{ duration: 0.2 }}>
            <ChevronRight className="w-3 h-3" />
          </motion.div>
        </motion.button>
      </motion.aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="md:hidden fixed inset-0 z-40">
            <motion.div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className="absolute left-0 top-0 bottom-0 w-68 z-50 shadow-2xl"
              style={{ background: S.bg, borderRight: `1px solid ${S.border}` }}
              initial={{ x: -272 }} animate={{ x: 0 }} exit={{ x: -272 }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
            >
              <SidebarContent pathname={pathname} collapsed={false} setMobileOpen={setMobileOpen} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Mobile topbar */}
        <div
          className="md:hidden flex items-center justify-between px-4 h-14 shrink-0"
          style={{ background: S.bg, borderBottom: `1px solid ${S.border}` }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: S.textMuted }}
            onMouseEnter={(e) => { e.currentTarget.style.background = S.hoverBg; e.currentTarget.style.color = S.textPrimary; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = S.textMuted; }}
          >
            <Menu className="w-5 h-5" />
          </button>
          <LogoBrand imgClass="h-8 w-auto" textClass="text-sm" />
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
            style={{ background: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.2)", color: S.activeText }}
          >
            <Zap className="w-3 h-3" />
            {user.credits}
          </div>
        </div>

        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 6, filter: "blur(3px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -4, filter: "blur(2px)" }}
              transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
