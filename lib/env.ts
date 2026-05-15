/**
 * Lazy env-var accessors. Throws only when the missing value is actually read,
 * so an incomplete .env.local doesn't break unrelated pages or builds.
 *
 * Usage: `paypalEnv.clientSecret` — throws if PAYPAL_CLIENT_SECRET is unset.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required env var: ${name}. ` +
        `Add it to .env.local (see .env.local.example for the full list).`,
    );
  }
  return value;
}

export const paypalEnv = {
  /** "sandbox" or "live" — informational label. The actual URL comes from apiBase. */
  get env(): "sandbox" | "live" {
    const value = process.env.PAYPAL_ENV ?? "sandbox";
    if (value !== "sandbox" && value !== "live") {
      throw new Error(
        `PAYPAL_ENV must be "sandbox" or "live", got: ${value}`,
      );
    }
    return value;
  },
  /** PayPal REST API base URL. Set explicitly via PAYPAL_API_BASE; defaults derived from env. */
  get apiBase(): string {
    if (process.env.PAYPAL_API_BASE) return process.env.PAYPAL_API_BASE;
    return this.env === "live"
      ? "https://api-m.paypal.com"
      : "https://api-m.sandbox.paypal.com";
  },
  get clientId(): string {
    return required("PAYPAL_CLIENT_ID");
  },
  get clientSecret(): string {
    return required("PAYPAL_CLIENT_SECRET");
  },
  /** Set after registering a webhook in the PayPal dashboard. Optional until then. */
  get webhookId(): string {
    return required("PAYPAL_WEBHOOK_ID");
  },
};
