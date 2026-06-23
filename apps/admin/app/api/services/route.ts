import { NextResponse } from "next/server";
import { listServiceDTOs, DEFAULT_LOCALE } from "@bavaria/db";

// Always reflect the latest admin edits.
export const dynamic = "force-dynamic";

/** Public, read-only list of active services for the requested locale. */
export async function GET(req: Request) {
  const locale =
    new URL(req.url).searchParams.get("locale") ?? DEFAULT_LOCALE;
  const services = await listServiceDTOs(locale);
  return NextResponse.json({ services });
}
