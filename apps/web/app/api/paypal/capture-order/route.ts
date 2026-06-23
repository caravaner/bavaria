import { NextResponse } from "next/server";
import { captureOrder } from "@/lib/orders";

/**
 * Same-origin proxy for the PayPal Smart Buttons onApprove callback.
 *
 * The browser posts here (same origin → no CORS, no DB creds in the client),
 * and we forward the capture to the admin API server-to-server with the shared
 * internal secret. All payment/DB logic lives in the admin app.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const localOrderId =
    body && typeof body === "object" && "localOrderId" in body
      ? String((body as { localOrderId: unknown }).localOrderId ?? "")
      : "";
  if (!localOrderId) {
    return NextResponse.json({ error: "missing_order_id" }, { status: 400 });
  }

  const result = await captureOrder(localOrderId);
  if (!result.ok) {
    return NextResponse.json(
      { error: "capture_failed" },
      { status: result.status || 502 },
    );
  }
  return NextResponse.json({ status: "CAPTURED" });
}
