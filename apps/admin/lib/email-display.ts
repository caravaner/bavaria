import type { EmailStatus } from "@bavaria/db";

/** Badge tone for each email status — shared by the list and detail views. */
export function statusTone(
  status: EmailStatus,
): "success" | "danger" | "info" | "warning" | "neutral" {
  switch (status) {
    case "SENT":
      return "success";
    case "FAILED":
      return "danger";
    case "QUEUED":
      return "info";
    case "SCHEDULED":
      return "warning";
    case "CANCELLED":
      return "neutral";
    default:
      return "neutral";
  }
}

/** Human label for a template key. Falls back to the raw key. */
export function templateLabel(template: string): string {
  const LABELS: Record<string, string> = {
    ORDER_CONFIRMATION: "Order confirmation",
    REMINDER: "Reminder",
    CONTACT_NOTIFICATION: "Contact message",
    ADMIN_BOOKING_NOTICE: "Booking notice",
    REFUND_NOTICE: "Refund notice",
    DISPUTE_ALERT: "Dispute alert",
  };
  return LABELS[template] ?? template;
}

/** Known templates, for the filter dropdown. */
export const TEMPLATE_OPTIONS = [
  "ORDER_CONFIRMATION",
  "REMINDER",
  "CONTACT_NOTIFICATION",
  "ADMIN_BOOKING_NOTICE",
  "REFUND_NOTICE",
  "DISPUTE_ALERT",
] as const;

export const STATUS_OPTIONS: EmailStatus[] = [
  "QUEUED",
  "SENT",
  "FAILED",
  "SCHEDULED",
  "CANCELLED",
];
