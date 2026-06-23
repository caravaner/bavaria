import Link from "next/link";
import { ServiceForm, type ServiceFormValues } from "@/components/service-form";

const EMPTY: ServiceFormValues = {
  slug: "",
  active: true,
  sortOrder: 0,
  durationMinutes: "",
  capacity: "",
  deliveryFrom: "",
  deliveryTo: "",
  eventDates: "",
  eventTime: "",
  priceEuros: "",
  currency: "EUR",
  title: "",
  shortBlurb: "",
  description: "",
  outcomes: "",
  forWhom: "",
};

export default function NewServicePage() {
  return (
    <div className="max-w-2xl">
      <Link
        href="/services"
        className="text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
      >
        ← Services
      </Link>
      <h1 className="mt-3 text-2xl font-semibold">New service</h1>
      <div className="mt-6">
        <ServiceForm defaults={EMPTY} />
      </div>
    </div>
  );
}
