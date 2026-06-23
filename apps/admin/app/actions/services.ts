"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  createService,
  deleteService,
  setServiceActive,
  updateService,
  type ServiceInput,
} from "@bavaria/db";
import { requireAdmin } from "@/lib/session";

export type ServiceFormState = { error?: string };

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function lines(value: FormDataEntryValue | null): string[] {
  return String(value ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function intOrNull(value: FormDataEntryValue | null): number | null {
  const s = String(value ?? "").trim();
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

/** Parse the service form. Returns a validation error string, or the input. */
function parseForm(formData: FormData): { error: string } | ServiceInput {
  const slug = String(formData.get("slug") ?? "").trim();
  if (!SLUG_RE.test(slug)) {
    return { error: "Slug must be lowercase words separated by hyphens." };
  }

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "Title is required." };

  const priceEuros = String(formData.get("price") ?? "").trim();
  const priceNum = Number(priceEuros);
  if (!Number.isFinite(priceNum) || priceNum < 0) {
    return { error: "Price must be a non-negative number." };
  }
  const priceCents = Math.round(priceNum * 100);

  const deliveryFrom = intOrNull(formData.get("deliveryFrom"));
  const deliveryTo = intOrNull(formData.get("deliveryTo"));
  if ((deliveryFrom === null) !== (deliveryTo === null)) {
    return { error: "Set both delivery-window values, or neither." };
  }

  const eventDates = lines(formData.get("eventDates"));
  for (const d of eventDates) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) {
      return { error: `Event date "${d}" must be in YYYY-MM-DD format.` };
    }
  }

  return {
    slug,
    active: formData.get("active") === "on",
    sortOrder: intOrNull(formData.get("sortOrder")) ?? 0,
    durationMinutes: intOrNull(formData.get("durationMinutes")),
    capacity: intOrNull(formData.get("capacity")),
    deliveryFrom,
    deliveryTo,
    eventDates,
    eventTime: String(formData.get("eventTime") ?? "").trim() || null,
    priceCents,
    currency: String(formData.get("currency") ?? "EUR").trim() || "EUR",
    translations: [
      {
        locale: "en",
        title,
        shortBlurb: String(formData.get("shortBlurb") ?? "").trim(),
        description: lines(formData.get("description")),
        outcomes: lines(formData.get("outcomes")),
        forWhom: lines(formData.get("forWhom")),
      },
    ],
  };
}

export async function saveService(
  _prev: ServiceFormState,
  formData: FormData,
): Promise<ServiceFormState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "").trim();
  const parsed = parseForm(formData);
  if ("error" in parsed) return parsed;

  try {
    if (id) {
      await updateService(id, parsed);
    } else {
      await createService(parsed);
    }
  } catch (err) {
    // Most likely a duplicate slug (unique constraint).
    console.error("[services] save failed", err);
    return { error: "Could not save — is the slug already in use?" };
  }

  revalidatePath("/services");
  redirect("/services");
}

export async function toggleServiceActive(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  const active = formData.get("active") === "true";
  if (id) {
    await setServiceActive(id, active);
    revalidatePath("/services");
  }
}

export async function removeService(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  if (id) {
    await deleteService(id);
    revalidatePath("/services");
  }
  redirect("/services");
}
