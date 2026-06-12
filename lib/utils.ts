import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function truncate(str: string, length: number): string {
  return str.length > length ? str.slice(0, length) + "…" : str;
}

export function planLabel(plan: "free" | "basic" | "pro"): string {
  return { free: "Free", basic: "Basic", pro: "Pro" }[plan];
}

export function planCredits(plan: "free" | "basic" | "pro"): number {
  return { free: 10, basic: 35, pro: 100 }[plan];
}

export function planPrice(plan: "free" | "basic" | "pro"): number {
  return { free: 0, basic: 10, pro: 20 }[plan];
}
