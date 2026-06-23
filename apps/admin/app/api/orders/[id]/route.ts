import { NextResponse } from "next/server";
import { db, getServiceDTO } from "@bavaria/db";
import { hasInternalSecret } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

/** Internal: order summary used by the web checkout and success pages. */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!hasInternalSecret(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const locale = new URL(req.url).searchParams.get("locale") ?? "en";

  const order = await db.order.findUnique({ where: { id } });
  if (!order) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Resolve a display title even if the service was later deactivated/deleted.
  const service = await getServiceDTO(order.serviceSlug, locale, false);

  return NextResponse.json({
    order: {
      id: order.id,
      status: order.status,
      paypalOrderId: order.paypalOrderId,
      serviceSlug: order.serviceSlug,
      serviceTitle: service?.content.title ?? order.serviceSlug,
      amountCents: order.amountCents,
      currency: order.currency,
      guestName: order.guestName,
      guestEmail: order.guestEmail,
    },
  });
}
