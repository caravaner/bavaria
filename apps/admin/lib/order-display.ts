import type { OrderStatus } from "@bavaria/db";

/** Badge tone for each order status — shared by the orders list and detail. */
export function orderStatusTone(
  status: OrderStatus,
): "success" | "danger" | "info" | "warning" | "neutral" {
  switch (status) {
    case "CAPTURED":
      return "success";
    case "FAILED":
      return "danger";
    case "APPROVED":
      return "info";
    case "REFUNDED":
      return "warning";
    case "CREATED":
      return "neutral";
    default:
      return "neutral";
  }
}

export const ORDER_STATUS_OPTIONS: OrderStatus[] = [
  "CREATED",
  "APPROVED",
  "CAPTURED",
  "FAILED",
  "REFUNDED",
];

/** Title-case a status enum value, e.g. CAPTURED → "Captured". */
export function titleCaseStatus(status: string): string {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export function formatPrice(cents: number, currency: string): string {
  const hasCents = cents % 100 !== 0;
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      minimumFractionDigits: hasCents ? 2 : 0,
    }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
}
