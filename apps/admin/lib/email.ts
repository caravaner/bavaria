/**
 * Send + log gateway. Every outbound email goes through here so it lands in the
 * EmailMessage audit table. Composes the standalone @bavaria/email package
 * (render + SMTP) with @bavaria/db (logging) — the one place the two meet.
 *
 * The web app never calls this directly; it triggers sends over the internal
 * API, keeping the DB on the admin side only.
 */
import {
  db,
  getServiceDTO,
  type EmailMessage,
  type Order,
} from "@bavaria/db";
import {
  renderEmail,
  sendEmail,
  type EmailPayload,
  type Locale,
} from "@bavaria/email";
import { emailEnv } from "./env";

export type SendAndLogResult =
  | { ok: true; id: string }
  | { ok: true; deduped: true }
  | { ok: false; id?: string; error: string };

interface SendAndLogInput {
  payload: EmailPayload;
  to: string;
  toName?: string | null;
  locale?: Locale;
  orderId?: string | null;
  /** Override the Reply-To (e.g. a contact-form submitter). Defaults to EMAIL_REPLY_TO. */
  replyTo?: string;
  /**
   * When set, a unique constraint makes the send idempotent: a second call with
   * the same key (e.g. the webhook reconciliation backstop) is a no-op. Resends
   * and reminders leave this null so they always go out.
   */
  dedupeKey?: string | null;
}

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: unknown }).code === "P2002"
  );
}

/** Render → log (QUEUED) → send → mark SENT/FAILED. Never throws. */
export async function sendAndLog(
  input: SendAndLogInput,
): Promise<SendAndLogResult> {
  const locale = input.locale ?? "en";
  const from = emailEnv.from();
  const replyTo = input.replyTo ?? emailEnv.replyTo();

  let row: EmailMessage;
  try {
    const rendered = await renderEmail(input.payload, locale);
    // Creating the row claims the dedupeKey; a P2002 here means "already sent".
    row = await db.emailMessage.create({
      data: {
        template: input.payload.template,
        toEmail: input.to,
        toName: input.toName ?? null,
        fromEmail: from,
        subject: rendered.subject,
        locale,
        status: "QUEUED",
        context: input.payload.context as object,
        bodyHtml: rendered.html,
        dedupeKey: input.dedupeKey ?? null,
        orderId: input.orderId ?? null,
        attempts: 1,
      },
    });

    try {
      const { messageId } = await sendEmail({
        to: input.to,
        toName: input.toName,
        from,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
        replyTo,
      });
      const sent = await db.emailMessage.update({
        where: { id: row.id },
        data: {
          status: "SENT",
          sentAt: new Date(),
          providerMessageId: messageId,
        },
      });
      return { ok: true, id: sent.id };
    } catch (sendErr) {
      const message = sendErr instanceof Error ? sendErr.message : String(sendErr);
      await db.emailMessage.update({
        where: { id: row.id },
        data: { status: "FAILED", error: message },
      });
      console.error("[email] send failed", input.payload.template, message);
      return { ok: false, id: row.id, error: message };
    }
  } catch (err) {
    if (isUniqueViolation(err)) {
      return { ok: true, deduped: true };
    }
    const message = err instanceof Error ? err.message : String(err);
    console.error("[email] sendAndLog failed before send", message);
    return { ok: false, error: message };
  }
}

// ─── Locale-aware formatting ────────────────────────────────────────────────

function formatMoney(cents: number, currency: string, locale: Locale): string {
  const hasCents = cents % 100 !== 0;
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: hasCents ? 2 : 0,
    }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
}

function formatDateTime(date: Date, locale: Locale): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "full",
      timeStyle: "short",
    }).format(date);
  } catch {
    return date.toISOString();
  }
}

// ─── Higher-level senders ───────────────────────────────────────────────────

/**
 * Booking confirmation for a captured order. Idempotent per order via the
 * dedupeKey, so the capture handler and the webhook reconciliation backstop can
 * both call it and exactly one email goes out.
 */
export async function sendOrderConfirmation(
  order: Order,
  locale: Locale = "en",
): Promise<SendAndLogResult> {
  const service = await getServiceDTO(order.serviceSlug, locale, false);
  const serviceTitle = service?.content.title ?? order.serviceSlug;

  return sendAndLog({
    payload: {
      template: "ORDER_CONFIRMATION",
      context: {
        guestName: order.guestName,
        serviceTitle,
        amountFormatted: formatMoney(order.amountCents, order.currency, locale),
        scheduledForFormatted: order.scheduledFor
          ? formatDateTime(order.scheduledFor, locale)
          : null,
        orderId: order.id,
        supportEmail: emailEnv.replyTo(),
      },
    },
    to: order.guestEmail,
    toName: order.guestName,
    locale,
    orderId: order.id,
    dedupeKey: `${order.id}:confirmation`,
  });
}

/**
 * Manual reminder about an upcoming booking, triggered from the admin Emails
 * tab. No dedupeKey — reminders may be sent more than once on purpose.
 */
export async function sendBookingReminder(
  order: Order,
  opts: { locale?: Locale; customMessage?: string | null } = {},
): Promise<SendAndLogResult> {
  const locale = opts.locale ?? "en";
  const service = await getServiceDTO(order.serviceSlug, locale, false);
  const serviceTitle = service?.content.title ?? order.serviceSlug;

  return sendAndLog({
    payload: {
      template: "REMINDER",
      context: {
        guestName: order.guestName,
        serviceTitle,
        scheduledForFormatted: order.scheduledFor
          ? formatDateTime(order.scheduledFor, locale)
          : null,
        orderId: order.id,
        supportEmail: emailEnv.replyTo(),
        customMessage: opts.customMessage ?? null,
      },
    },
    to: order.guestEmail,
    toName: order.guestName,
    locale,
    orderId: order.id,
  });
}

// ─── Owner notifications ────────────────────────────────────────────────────

/**
 * Notify the owner that a new booking was captured. Sent alongside the guest
 * confirmation; idempotent per order so the capture/webhook race sends one.
 * Owner notices are English only.
 */
export async function sendOwnerBookingNotice(
  order: Order,
): Promise<SendAndLogResult> {
  const service = await getServiceDTO(order.serviceSlug, "en", false);
  const serviceTitle = service?.content.title ?? order.serviceSlug;

  return sendAndLog({
    payload: {
      template: "ADMIN_BOOKING_NOTICE",
      context: {
        guestName: order.guestName,
        guestEmail: order.guestEmail,
        serviceTitle,
        amountFormatted: formatMoney(order.amountCents, order.currency, "en"),
        scheduledForFormatted: order.scheduledFor
          ? formatDateTime(order.scheduledFor, "en")
          : null,
        orderId: order.id,
        notes: order.notes,
      },
    },
    to: emailEnv.owner(),
    locale: "en",
    orderId: order.id,
    // Reply lands in the guest's inbox so the owner can respond directly.
    replyTo: order.guestEmail,
    dedupeKey: `${order.id}:owner-notice`,
  });
}

/**
 * Notify the owner of a contact-form submission. The message is persisted in
 * the EmailMessage row's context before the send, so it survives an SMTP
 * failure (recoverable from the admin Emails tab). Reply-To is the submitter so
 * the owner can answer with one click. Owner notices are English only.
 */
export async function sendContactNotification(input: {
  name: string;
  email: string;
  message: string;
}): Promise<SendAndLogResult> {
  return sendAndLog({
    payload: {
      template: "CONTACT_NOTIFICATION",
      context: {
        fromName: input.name,
        fromEmail: input.email,
        message: input.message,
        submittedAtFormatted: formatDateTime(new Date(), "en"),
      },
    },
    to: emailEnv.owner(),
    locale: "en",
    replyTo: input.email,
  });
}
