/** Locales the email templates are translated into. Mirrors the public site. */
export type Locale = "en" | "de";

/** Context for the booking/order confirmation email. */
export interface OrderConfirmationContext {
  guestName: string;
  serviceTitle: string;
  /** Pre-formatted, locale-aware price, e.g. "€120". Formatting is the caller's job. */
  amountFormatted: string;
  /** Pre-formatted session date/time for 1:1s; null/omitted for async services. */
  scheduledForFormatted?: string | null;
  orderId: string;
  /** Address the recipient can reply to for help. */
  supportEmail: string;
}

/** Context for a manual reminder about an upcoming booking. */
export interface ReminderContext {
  guestName: string;
  serviceTitle: string;
  scheduledForFormatted?: string | null;
  orderId: string;
  supportEmail: string;
  /** Optional free-text the admin adds when sending the reminder. */
  customMessage?: string | null;
}

/** Context for the owner notification when a contact form is submitted. */
export interface ContactNotificationContext {
  fromName: string;
  fromEmail: string;
  message: string;
  /** Pre-formatted submission time, e.g. "23 Jun 2026, 14:00". */
  submittedAtFormatted?: string | null;
}

/** Context for the owner notification when a new booking is captured. */
export interface AdminBookingNoticeContext {
  guestName: string;
  guestEmail: string;
  serviceTitle: string;
  amountFormatted: string;
  scheduledForFormatted?: string | null;
  orderId: string;
  notes?: string | null;
}

/**
 * The full set of templates the system can send. Discriminated by `template`
 * so `renderEmail` and callers stay type-safe end to end.
 */
export type EmailPayload =
  | { template: "ORDER_CONFIRMATION"; context: OrderConfirmationContext }
  | { template: "REMINDER"; context: ReminderContext }
  | { template: "CONTACT_NOTIFICATION"; context: ContactNotificationContext }
  | { template: "ADMIN_BOOKING_NOTICE"; context: AdminBookingNoticeContext };

export type EmailTemplateName = EmailPayload["template"];

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}
