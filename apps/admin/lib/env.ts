/**
 * Lazy env-var accessors. Throws only when the missing value is actually read,
 * so an incomplete .env.local doesn't break unrelated pages or builds.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required env var: ${name}. Add it to the repo-root .env.local.`,
    );
  }
  return value;
}

/** Secret used to sign admin session cookies (HMAC). */
export function sessionSecret(): string {
  return required("SESSION_SECRET");
}

/** Shared secret the web app sends on internal (non-public) API calls. */
export function internalSecret(): string {
  return required("API_INTERNAL_SECRET");
}

export const emailEnv = {
  /**
   * The From address every email is sent as. With Strato (and most hosts) this
   * MUST equal the authenticated SMTP mailbox, or the send is rejected.
   */
  from(): string {
    return required("EMAIL_FROM");
  },
  /** Reply-To / support address shown to recipients. Defaults to EMAIL_FROM. */
  replyTo(): string {
    return process.env.EMAIL_REPLY_TO ?? this.from();
  },
  /** Owner inbox for internal notifications (refunds, disputes). Defaults to EMAIL_FROM. */
  owner(): string {
    return process.env.EMAIL_OWNER ?? this.from();
  },
};

export const paypalEnv = {
  /** "sandbox" or "live" — informational label. The actual URL comes from apiBase. */
  get env(): "sandbox" | "live" {
    const value = process.env.PAYPAL_ENV ?? "sandbox";
    if (value !== "sandbox" && value !== "live") {
      throw new Error(`PAYPAL_ENV must be "sandbox" or "live", got: ${value}`);
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
