/**
 * Client for the admin app's HTTP API. The web app holds NO database access —
 * everything (services, orders, capture) goes through here, server-side only.
 *
 * Config (repo-root .env.local):
 *   ADMIN_API_URL       base URL of the admin app, e.g. http://localhost:3001
 *   API_INTERNAL_SECRET shared secret sent on non-public endpoints
 */

const BASE = process.env.ADMIN_API_URL ?? "http://localhost:3001";

function internalHeaders(): Record<string, string> {
  return { "x-internal-secret": process.env.API_INTERNAL_SECRET ?? "" };
}

export function apiBaseUrl(): string {
  return BASE;
}

export function internalSecretHeader(): Record<string, string> {
  return internalHeaders();
}
