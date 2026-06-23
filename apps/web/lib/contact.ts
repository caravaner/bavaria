/**
 * Contact-form submission to the admin API. Server-side only — the web app
 * holds the internal secret but no DB or mail access, so the owner notification
 * (and its audit log) happen on the admin side.
 */

import { apiBaseUrl, internalSecretHeader } from "./api";

export async function sendContactMessage(input: {
  name: string;
  email: string;
  message: string;
}): Promise<{ ok: boolean }> {
  try {
    const res = await fetch(`${apiBaseUrl()}/api/contact`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...internalSecretHeader(),
      },
      body: JSON.stringify(input),
      cache: "no-store",
    });
    // The admin logs the message even if the live SMTP send fails, so any 2xx
    // means "captured". Only a non-2xx (validation/auth/unreachable) is a fail.
    return { ok: res.ok };
  } catch (err) {
    console.error("[web] sendContactMessage error", err);
    return { ok: false };
  }
}
