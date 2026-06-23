import nodemailer, { type Transporter } from "nodemailer";

/**
 * SMTP transport, configured entirely from env so the same code points at
 * Mailpit in dev and Strato (or any SMTP host) in prod:
 *
 *   SMTP_HOST    e.g. smtp.strato.de   (dev: localhost)
 *   SMTP_PORT    e.g. 465 | 587        (dev Mailpit: 1025)
 *   SMTP_SECURE  "true" for implicit TLS (port 465). Defaults to (port === 465).
 *   SMTP_USER    full mailbox address  (omit for Mailpit)
 *   SMTP_PASS    mailbox password      (omit for Mailpit)
 */

let cached: Transporter | undefined;

function buildTransport(): Transporter {
  const host = process.env.SMTP_HOST;
  if (!host) {
    throw new Error("SMTP_HOST is not set — cannot send email.");
  }
  const port = Number(process.env.SMTP_PORT ?? 587);
  const secure = process.env.SMTP_SECURE
    ? process.env.SMTP_SECURE === "true"
    : port === 465;

  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    // Mailpit and other dev catchers need no auth; only set it when provided.
    auth: user && pass ? { user, pass } : undefined,
  });
}

function getTransport(): Transporter {
  if (!cached) cached = buildTransport();
  return cached;
}

export interface SendEmailInput {
  to: string;
  toName?: string | null;
  from: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export interface SendEmailResult {
  messageId: string;
}

/** Hand a rendered email to the SMTP transport. Throws on transport failure. */
export async function sendEmail(
  input: SendEmailInput,
): Promise<SendEmailResult> {
  const to = input.toName
    ? `"${input.toName.replace(/"/g, "")}" <${input.to}>`
    : input.to;

  const info = await getTransport().sendMail({
    from: input.from,
    to,
    subject: input.subject,
    html: input.html,
    text: input.text,
    replyTo: input.replyTo,
  });

  return { messageId: info.messageId };
}
