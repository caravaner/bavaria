/**
 * PayPal credentials smoke test.
 * Run with: `node scripts/paypal-ping.mjs`
 *
 * Loads .env.local then attempts to mint an OAuth access token.
 * Exits 0 on success, 1 on failure.
 */
import { existsSync } from "node:fs";
import process from "node:process";

for (const file of [".env.local", ".env"]) {
  if (existsSync(file)) process.loadEnvFile(file);
}

const env = process.env.PAYPAL_ENV ?? "sandbox";
const clientId = process.env.PAYPAL_CLIENT_ID;
const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
const baseUrl =
  process.env.PAYPAL_API_BASE ??
  (env === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com");

if (!clientId || !clientSecret) {
  console.error(
    "✗ Missing PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET in .env.local",
  );
  process.exit(1);
}

const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

const res = await fetch(`${baseUrl}/v1/oauth2/token`, {
  method: "POST",
  headers: {
    Authorization: `Basic ${auth}`,
    "Content-Type": "application/x-www-form-urlencoded",
  },
  body: "grant_type=client_credentials",
});

if (!res.ok) {
  console.error(`✗ PayPal OAuth failed: HTTP ${res.status}`);
  console.error(await res.text());
  process.exit(1);
}

const data = await res.json();
console.log(
  `✓ Connected to PayPal ${env}. Token type: ${data.token_type}, expires in ${data.expires_in}s.`,
);
