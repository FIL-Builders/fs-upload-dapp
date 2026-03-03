import { bigIntToDecimal } from "@/lib/decimal";

export const DECIMAL_PLACES = {
  USDFC: 4,
  FIL: 4,
  STORAGE_GIB: 2,
  DAYS: 0,
  RATE: 4,
  CURRENCY: 2,
} as const;

export function formatCapacity(gib: number): string {
  if (gib >= 1024) {
    return `${(gib / 1024).toFixed(2)} TiB`;
  }
  return `${gib.toFixed(2)} GiB`;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function formatBalance(value: bigint, decimals: number, displayDecimals: number): string {
  return bigIntToDecimal(value, decimals).toFixed(displayDecimals);
}

export function formatDaysDisplay(days: number): string {
  if (days === Infinity || !isFinite(days)) return "No active costs";
  return `${Math.floor(days)} days`;
}

export function parseDaysLeft(value: string): number {
  return value === "Infinity" ? Infinity : parseFloat(value);
}

export function formatRelativeTime(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = timestamp - now;

  if (diff <= 0) return "expired";

  const minutes = Math.floor(diff / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `in ${days} day${days === 1 ? "" : "s"}`;
  if (hours > 0) return `in ${hours} hour${hours === 1 ? "" : "s"}`;
  return `in ${minutes} minute${minutes === 1 ? "" : "s"}`;
}

export function formatFutureDuration(days: number): string {
  if (days === 1) return "in 1 day";
  return `in ${days} days`;
}

export function getDaysVariant(
  daysLeft: number,
  threshold: number,
): "success" | "warning" | "danger" {
  if (daysLeft === Infinity) return "success";
  if (daysLeft < threshold) return "danger";
  if (daysLeft < threshold * 2) return "warning";
  return "success";
}

export const truncate = (cid: string, chars = 8): string =>
  `${cid.slice(0, chars)}...${cid.slice(-chars)}`;

export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? `${singular}s`);
}
