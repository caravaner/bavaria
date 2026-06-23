import { timingSafeEqual } from "node:crypto";
import { internalSecret } from "./env";

const HEADER = "x-internal-secret";

/**
 * True when the request carries the shared internal secret. Used to gate the
 * non-public API endpoints (orders, capture, inactive-service lookups) that
 * only the web app's server should call — never the browser.
 */
export function hasInternalSecret(req: Request): boolean {
  const provided = req.headers.get(HEADER);
  if (!provided) return false;
  let expected: string;
  try {
    expected = internalSecret();
  } catch {
    return false;
  }
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
