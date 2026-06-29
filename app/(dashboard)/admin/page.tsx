"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Bug, Lightbulb, Heart, MessagesSquare, Filter, ShieldCheck, Inbox } from "lucide-react";
import { MOCK_FEEDBACK, type MockFeedback } from "@/lib/mock-data";

// ── Theme tokens ──────────────────────────────────────────────────────────────
const S = {
  bg: "#0f0404",
  card: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.07)",
  text: "rgba(255,255,255,0.88)",
  muted: "rgba(255,255,255,0.45)",
  dim: "rgba(255,255,255,0.22)",
  red: "#dc2626",
  redLight: "#f87171",
  glass: "rgba(255,255,255,0.04)",
  glassMid: "rgba(255,255,255,0.07)",
};

type FilterTab = "all" | "new" | MockFeedback["category"];

const CATEGORY_META: Record<MockFeedback["category"], { label: string; icon: typeof Bug; color: string; bg: string }> = {
  bug: { label: "Bug Report", icon: Bug, color: "#f87171", bg: "rgba(248,113,113,0.1)" },
  feature: { label: "Feature", icon: Lightbulb, color: "#fbbf24", bg: "rgba(251,191,36,0.1)" },
  compliment: { label: "Compliment", icon: Heart, color: "#f472b6", bg: "rgba(244,114,182,0.1)" },
  general: { label: "General", icon: MessagesSquare, color: "#818cf8", bg: "rgba(129,140,248,0.1)" },
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className="w-3.5 h-3.5"
          style={{
            fill: s <= rating ? "#f59e0b" : "transparent",
            color: s <= rating ? "#f59e0b" : S.border,
          }}
        />
      ))}
    </div>
  );
}

function CategoryBadge({ category }: { category: MockFeedback["category"] }) {
  const meta = CATEGORY_META[category];
  const Icon = meta.icon;
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold"
      style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.color}33` }}
    >
      <Icon className="w-3 h-3" />
      {meta.label}
    </span>
  );
}

function StatusDot({ status }: { status: MockFeedback["status"] }) {
  const colors: Record<MockFeedback["status"], string> = {
    new: "#4ade80",
    read: S.dim,
    archived: S.dim,
  };
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] font-medium"
      style={{ color: status === "new" ? "#4ade80" : S.dim }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0 inline-block"
        style={{ background: colors[status], boxShadow: status === "new" ? "0 0 6px #4ade8088" : "none" }}
      />
      {status === "new" ? "New" : status === "read" ? "Read" : "Archived"}
    </span>
  );
}

function timeAgo(date: Date): string {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 60) return "Just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = ["rgba(220,38,38,0.2)", "rgba(59,130,246,0.2)", "rgba(16,185,129,0.2)", "rgba(245,158,11,0.2)", "rgba(139,92,246,0.2)"];
const AVATAR_TEXT = ["#f87171", "#60a5fa", "#34d399", "#fbbf24", "#a78bfa"];

export default function AdminPage() {
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [feedback, setFeedback] = useState<MockFeedback[]>(MOCK_FEEDBACK);

  const filtered = feedback.filter((f) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "new") return f.status === "new";
    return f.category === activeFilter;
  });

  const totalNew = feedback.filter((f) => f.status === "new").length;
  const avgRating = feedback.length > 0
    ? (feedback.reduce((s, f) => s + f.rating, 0) / feedback.length).toFixed(1)
    : "—";

  function markRead(id: string) {
    setFeedback((prev) => prev.map((f) => f.id === id && f.status === "new" ? { ...f, status: "read" } : f));
  }

  const TABS: { id: FilterTab; label: string; count?: number }[] = [
    { id: "all", label: "All", count: feedback.length },
    { id: "new", label: "Unread", count: totalNew },
    { id: "bug", label: "Bugs" },
    { id: "feature", label: "Features" },
    { id: "compliment", label: "Compliments" },
    { id: "general", label: "General" },
  ];

  return (
    <div className="min-h-full px-6 py-8 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "rgba(220,38,38,0.12)", border: `1px solid rgba(220,38,38,0.2)` }}
        >
          <ShieldCheck className="w-5 h-5" style={{ color: S.redLight }} />
        </div>
        <div>
          <h1 className="text-xl font-black tracking-tight" style={{ color: S.text }}>Feedback Admin</h1>
          <p className="text-sm" style={{ color: S.muted }}>User-submitted feedback and suggestions</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Total Feedback", value: feedback.length, color: S.redLight },
          { label: "Unread", value: totalNew, color: "#4ade80" },
          { label: "Avg. Rating", value: avgRating, color: "#f59e0b" },
          { label: "This Week", value: feedback.filter((f) => Date.now() - f.createdAt.getTime() < 7 * 86400 * 1000).length, color: "#818cf8" },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="rounded-2xl p-4"
            style={{ background: S.card, border: `1px solid ${S.border}` }}
          >
            <p className="text-2xl font-black mb-1" style={{ color }}>{value}</p>
            <p className="text-xs" style={{ color: S.muted }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div
        className="flex items-center gap-1 p-1 rounded-xl mb-6 flex-wrap"
        style={{ background: S.glassMid, border: `1px solid ${S.border}` }}
      >
        <Filter className="w-3.5 h-3.5 ml-2 shrink-0" style={{ color: S.dim }} />
        {TABS.map(({ id, label, count }) => {
          const active = activeFilter === id;
          return (
            <button
              key={id}
              onClick={() => setActiveFilter(id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: active ? "rgba(220,38,38,0.14)" : "transparent",
                color: active ? S.redLight : S.muted,
                border: active ? "1px solid rgba(220,38,38,0.3)" : "1px solid transparent",
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = S.text; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = S.muted; }}
            >
              {label}
              {count !== undefined && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                  style={{ background: active ? "rgba(220,38,38,0.2)" : S.glass, color: active ? S.redLight : S.dim }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Feedback list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Inbox className="w-10 h-10" style={{ color: S.dim }} />
          <p className="text-sm" style={{ color: S.muted }}>No feedback in this category</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {filtered.map((item, idx) => {
              const colorIdx = idx % AVATAR_COLORS.length;
              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.2, delay: idx * 0.04 }}
                  className="rounded-2xl p-5 transition-all"
                  style={{
                    background: item.status === "new" ? "rgba(255,255,255,0.05)" : S.card,
                    border: `1px solid ${item.status === "new" ? "rgba(255,255,255,0.1)" : S.border}`,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = item.status === "new" ? "rgba(255,255,255,0.1)" : S.border; }}
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                      style={{ background: AVATAR_COLORS[colorIdx], color: AVATAR_TEXT[colorIdx] }}
                    >
                      {initials(item.name)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-2 mb-2">
                        <span className="text-sm font-bold" style={{ color: S.text }}>{item.name}</span>
                        <span className="text-xs" style={{ color: S.dim }}>{item.email}</span>
                        <CategoryBadge category={item.category} />
                        <StatusDot status={item.status} />
                        <span className="text-xs ml-auto" style={{ color: S.dim }}>{timeAgo(item.createdAt)}</span>
                      </div>

                      <StarRating rating={item.rating} />

                      <p className="text-sm mt-2 leading-relaxed" style={{ color: S.muted }}>
                        {item.message}
                      </p>

                      {item.status === "new" && (
                        <button
                          onClick={() => markRead(item.id)}
                          className="mt-3 text-xs px-3 py-1 rounded-lg transition-all"
                          style={{ background: S.glass, border: `1px solid ${S.border}`, color: S.muted }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = S.text; e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = S.muted; e.currentTarget.style.borderColor = S.border; }}
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {filtered.length > 0 && (
        <p className="text-center text-xs mt-6" style={{ color: S.dim }}>
          Showing {filtered.length} of {feedback.length} feedback entries
        </p>
      )}
    </div>
  );
}
