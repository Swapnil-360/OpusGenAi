export interface HistoryEntry {
  id: string;
  prompt: string;
  status: "completed";
  images: string[];
  creditsUsed: number;
  aspectRatio: string;
  createdAt: string;
  templateId?: string;
}

const HISTORY_KEY = "opusgen_history";
const CREDITS_KEY = "opusgen_credits";
const DEFAULT_CREDITS = 10;

export function getHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addToHistory(entry: HistoryEntry): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getHistory();
    const updated = [entry, ...existing].slice(0, 15);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // localStorage may be full from large base64 images — drop oldest and retry
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify([entry]));
    } catch { /* silent */ }
  }
}

export function getCredits(): number {
  if (typeof window === "undefined") return DEFAULT_CREDITS;
  try {
    const raw = localStorage.getItem(CREDITS_KEY);
    return raw !== null ? Number(raw) : DEFAULT_CREDITS;
  } catch {
    return DEFAULT_CREDITS;
  }
}

export function useCredit(amount = 1): number {
  const current = getCredits();
  const next = Math.max(0, current - amount);
  try {
    localStorage.setItem(CREDITS_KEY, String(next));
  } catch { /* silent */ }
  return next;
}
