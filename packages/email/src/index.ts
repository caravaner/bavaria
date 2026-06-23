/**
 * @bavaria/email — templating + SMTP transport for transactional email.
 *
 * Deliberately standalone: NO database access and NO imports from the apps, so
 * it can't drag DB access into the public web app. The admin app composes this
 * with @bavaria/db to log every send (see apps/admin/lib/email.ts).
 */
export { renderEmail } from "./render";
export { sendEmail } from "./transport";
export type { SendEmailInput, SendEmailResult } from "./transport";
export type {
  AdminBookingNoticeContext,
  ContactNotificationContext,
  EmailPayload,
  EmailTemplateName,
  Locale,
  OrderConfirmationContext,
  ReminderContext,
  RenderedEmail,
} from "./types";
