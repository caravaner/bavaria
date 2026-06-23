import { render } from "@react-email/render";
import { copyFor } from "./i18n";
import { AdminBookingNoticeEmail } from "./templates/admin-booking-notice";
import { ContactNotificationEmail } from "./templates/contact-notification";
import { OrderConfirmationEmail } from "./templates/order-confirmation";
import { ReminderEmail } from "./templates/reminder";
import type { EmailPayload, Locale, RenderedEmail } from "./types";

/**
 * Render a template + context to a subject line and HTML/text bodies. Pure and
 * DB-free — callers (admin) persist the result and hand the HTML to the
 * transport. Resends call this again from the stored context.
 */
export async function renderEmail(
  payload: EmailPayload,
  locale: Locale = "en",
): Promise<RenderedEmail> {
  const copy = copyFor(locale);

  switch (payload.template) {
    case "ORDER_CONFIRMATION": {
      const element = (
        <OrderConfirmationEmail context={payload.context} locale={locale} />
      );
      return {
        subject: copy.orderConfirmation.subject(payload.context.serviceTitle),
        html: await render(element),
        text: await render(element, { plainText: true }),
      };
    }
    case "REMINDER": {
      const element = (
        <ReminderEmail context={payload.context} locale={locale} />
      );
      return {
        subject: copy.reminder.subject(payload.context.serviceTitle),
        html: await render(element),
        text: await render(element, { plainText: true }),
      };
    }
    case "CONTACT_NOTIFICATION": {
      // Owner-facing, English only — does not use the per-locale copy.
      const element = <ContactNotificationEmail context={payload.context} />;
      return {
        subject: `New contact message from ${payload.context.fromName}`,
        html: await render(element),
        text: await render(element, { plainText: true }),
      };
    }
    case "ADMIN_BOOKING_NOTICE": {
      // Owner-facing, English only.
      const element = <AdminBookingNoticeEmail context={payload.context} />;
      return {
        subject: `New booking — ${payload.context.serviceTitle}`,
        html: await render(element),
        text: await render(element, { plainText: true }),
      };
    }
    default: {
      // Exhaustiveness guard — a new template must be handled above.
      const _never: never = payload;
      throw new Error(
        `renderEmail: unhandled template ${(_never as EmailPayload).template}`,
      );
    }
  }
}
