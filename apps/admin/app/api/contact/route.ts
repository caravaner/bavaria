import { NextResponse } from "next/server";
import { hasInternalSecret } from "@/lib/api-auth";
import { sendContactNotification } from "@/lib/email";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ContactBody = {
  name?: string;
  email?: string;
  message?: string;
};

/**
 * Internal endpoint: the web contact form posts here (the web app holds no DB
 * or mail access). Sends the owner notification and logs it to EmailMessage.
 *
 * Returns ok even when the SMTP send fails — the message is persisted in the
 * EmailMessage row's context before sending, so it's never lost and the owner
 * can resend from the admin Emails tab.
 */
export async function POST(req: Request) {
  if (!hasInternalSecret(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: ContactBody;
  try {
    body = (await req.json()) as ContactBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim();
  const message = String(body.message ?? "").trim();

  // Authoritative validation (the web app validates too, but never trust it).
  if (!name || name.length > 200) {
    return NextResponse.json({ error: "invalid_name" }, { status: 400 });
  }
  if (!email || !EMAIL_RE.test(email) || email.length > 320) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }
  if (!message || message.length < 10 || message.length > 4000) {
    return NextResponse.json({ error: "invalid_message" }, { status: 400 });
  }

  const result = await sendContactNotification({ name, email, message });

  // The row is logged either way; surface whether the live send succeeded.
  return NextResponse.json({ ok: true, sent: result.ok });
}
