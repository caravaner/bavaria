/**
 * Thin REST API wrapper around PayPal's Orders v2 and Payments v2 endpoints.
 *
 * Trust model: this file runs server-side only. It reads PAYPAL_CLIENT_SECRET
 * via lib/env.ts — never import this module from a client component.
 */

import { paypalEnv } from "./env";

// In-memory access token cache. PayPal tokens live ~9 hours; we refresh
// 5 minutes early to be safe.
let cachedToken: { token: string; expiresAt: number } | null = null;
const TOKEN_SAFETY_WINDOW_MS = 5 * 60 * 1000;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - TOKEN_SAFETY_WINDOW_MS) {
    return cachedToken.token;
  }
  const auth = Buffer.from(
    `${paypalEnv.clientId}:${paypalEnv.clientSecret}`,
  ).toString("base64");
  const res = await fetch(`${paypalEnv.apiBase}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) {
    const body = await res.text();
    throw new PayPalError(`OAuth token request failed`, res.status, body);
  }
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return data.access_token;
}

export class PayPalError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: string,
  ) {
    super(`${message} (HTTP ${status}): ${body}`);
    this.name = "PayPalError";
  }
}

async function paypalFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const exec = async (token: string): Promise<Response> =>
    fetch(`${paypalEnv.apiBase}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...init.headers,
        Authorization: `Bearer ${token}`,
      },
    });

  let token = await getAccessToken();
  let res = await exec(token);

  if (res.status === 401) {
    cachedToken = null;
    token = await getAccessToken();
    res = await exec(token);
  }

  if (!res.ok) {
    const body = await res.text();
    throw new PayPalError(`PayPal ${init.method ?? "GET"} ${path}`, res.status, body);
  }

  // 204 No Content (e.g. successful refund) returns empty body.
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// ─── Orders v2 ───────────────────────────────────────────────────────────────

export type CreateOrderInput = {
  /** Local Order.id. Encoded into PayPal's custom_id/invoice_id for correlation. */
  localOrderId: string;
  amountCents: number;
  currency: string;
  description?: string;
  /** Where PayPal redirects after approval (success page in our site). */
  returnUrl: string;
  /** Where PayPal redirects if the user cancels in the popup/redirect. */
  cancelUrl: string;
};

export type PayPalOrder = {
  id: string;
  status:
    | "CREATED"
    | "SAVED"
    | "APPROVED"
    | "VOIDED"
    | "COMPLETED"
    | "PAYER_ACTION_REQUIRED";
  purchase_units: Array<{
    /** PayPal echoes custom_id either on the unit OR on each capture below. */
    custom_id?: string;
    invoice_id?: string;
    amount?: { currency_code: string; value: string };
    payments?: {
      captures?: Array<{
        id: string;
        status: string;
        amount: { currency_code: string; value: string };
        /** PayPal's actual response puts custom_id here, not on the unit. */
        custom_id?: string;
        invoice_id?: string;
      }>;
    };
  }>;
  links: Array<{ href: string; rel: string; method: string }>;
};

export async function createOrder(input: CreateOrderInput): Promise<PayPalOrder> {
  return paypalFetch<PayPalOrder>("/v2/checkout/orders", {
    method: "POST",
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          custom_id: input.localOrderId,
          invoice_id: input.localOrderId,
          amount: {
            currency_code: input.currency,
            value: (input.amountCents / 100).toFixed(2),
          },
          description: input.description,
        },
      ],
      application_context: {
        return_url: input.returnUrl,
        cancel_url: input.cancelUrl,
        shipping_preference: "NO_SHIPPING",
        user_action: "PAY_NOW",
      },
    }),
  });
}

export async function captureOrder(paypalOrderId: string): Promise<PayPalOrder> {
  return paypalFetch<PayPalOrder>(
    `/v2/checkout/orders/${paypalOrderId}/capture`,
    { method: "POST" },
  );
}

export async function getOrder(paypalOrderId: string): Promise<PayPalOrder> {
  return paypalFetch<PayPalOrder>(`/v2/checkout/orders/${paypalOrderId}`);
}

// ─── Payments v2 (refunds) ───────────────────────────────────────────────────

// ─── Webhook signature verification ─────────────────────────────────────────

export type WebhookSignatureHeaders = {
  transmissionId: string;
  transmissionTime: string;
  certUrl: string;
  authAlgo: string;
  transmissionSig: string;
};

/**
 * Verify a webhook event's signature against PayPal's API.
 * Returns true only if PayPal confirms `verification_status === "SUCCESS"`.
 *
 * Caller must pass the headers PayPal set on the inbound request, the
 * webhook id we registered (from PAYPAL_WEBHOOK_ID), and the parsed JSON body.
 */
export async function verifyWebhookSignature(args: {
  headers: WebhookSignatureHeaders;
  webhookId: string;
  webhookEvent: unknown;
}): Promise<boolean> {
  try {
    const res = await paypalFetch<{
      verification_status: "SUCCESS" | "FAILURE";
    }>("/v1/notifications/verify-webhook-signature", {
      method: "POST",
      body: JSON.stringify({
        transmission_id: args.headers.transmissionId,
        transmission_time: args.headers.transmissionTime,
        cert_url: args.headers.certUrl,
        auth_algo: args.headers.authAlgo,
        transmission_sig: args.headers.transmissionSig,
        webhook_id: args.webhookId,
        webhook_event: args.webhookEvent,
      }),
    });
    return res.verification_status === "SUCCESS";
  } catch (err) {
    console.error("[paypal] verifyWebhookSignature error", err);
    return false;
  }
}

export async function refundCapture(
  captureId: string,
  amountCents?: number,
  currency = "EUR",
): Promise<{ id: string; status: string }> {
  const body =
    amountCents != null
      ? {
          amount: {
            currency_code: currency,
            value: (amountCents / 100).toFixed(2),
          },
        }
      : {};
  return paypalFetch(`/v2/payments/captures/${captureId}/refund`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}
