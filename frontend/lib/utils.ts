import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTokens(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function formatCost(usd: number | null | undefined): string {
  if (usd == null || !Number.isFinite(usd)) return "$0.00";
  if (usd >= 1000) return `$${(usd / 1000).toFixed(2)}k`;
  return `$${usd.toFixed(2)}`;
}

function toDate(value: string | number | Date): Date {
  if (value instanceof Date) return value;
  if (typeof value === "number") return new Date(value);
  return parseISO(value);
}

export function formatDate(value: string | number | Date): string {
  try {
    return format(toDate(value), "MMM d, yyyy HH:mm");
  } catch {
    return String(value);
  }
}

export function formatRelativeTime(value: string | number | Date): string {
  try {
    return formatDistanceToNow(toDate(value), { addSuffix: true });
  } catch {
    return String(value);
  }
}
