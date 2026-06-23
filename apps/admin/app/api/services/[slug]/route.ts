import { NextResponse } from "next/server";
import { getServiceDTO, DEFAULT_LOCALE } from "@bavaria/db";
import { hasInternalSecret } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

/**
 * Public, read-only single service for the requested locale.
 *
 * By default only active services are returned. Internal callers (the web
 * server, with the shared secret) may pass ?includeInactive=1 so the checkout
 * and capture flows can still resolve a service that was deactivated after an
 * order was created.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const url = new URL(req.url);
  const locale = url.searchParams.get("locale") ?? DEFAULT_LOCALE;

  const includeInactive =
    url.searchParams.get("includeInactive") === "1" && hasInternalSecret(req);

  const service = await getServiceDTO(slug, locale, !includeInactive);
  if (!service) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ service });
}
