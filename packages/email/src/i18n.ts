import type { Locale } from "./types";

/**
 * Subject lines + body copy per locale. Small and self-contained on purpose —
 * the email package doesn't depend on next-intl (that lives in the web app).
 */
type Copy = {
  orderConfirmation: {
    subject: (serviceTitle: string) => string;
    preview: string;
    heading: string;
    greeting: (name: string) => string;
    intro: string;
    serviceLabel: string;
    whenLabel: string;
    amountLabel: string;
    referenceLabel: string;
    outro: (supportEmail: string) => string;
  };
  reminder: {
    subject: (serviceTitle: string) => string;
    preview: string;
    heading: string;
    greeting: (name: string) => string;
    intro: string;
    serviceLabel: string;
    whenLabel: string;
    outro: (supportEmail: string) => string;
  };
  footer: (brandName: string) => string;
};

const en: Copy = {
  orderConfirmation: {
    subject: (s) => `Your booking is confirmed — ${s}`,
    preview: "Your booking is confirmed.",
    heading: "Booking confirmed",
    greeting: (name) => `Hi ${name},`,
    intro:
      "Thanks for your booking — your payment went through and your spot is confirmed. Here are the details:",
    serviceLabel: "Service",
    whenLabel: "When",
    amountLabel: "Amount paid",
    referenceLabel: "Reference",
    outro: (email) =>
      `If you have any questions, just reply to this email or reach us at ${email}.`,
  },
  reminder: {
    subject: (s) => `Reminder — ${s}`,
    preview: "A reminder about your upcoming session.",
    heading: "A quick reminder",
    greeting: (name) => `Hi ${name},`,
    intro: "This is a friendly reminder about your upcoming session:",
    serviceLabel: "Service",
    whenLabel: "When",
    outro: (email) =>
      `If you need to reschedule, reply to this email or reach us at ${email}.`,
  },
  footer: (brandName) => `${brandName} — career restart coaching`,
};

const de: Copy = {
  orderConfirmation: {
    subject: (s) => `Deine Buchung ist bestätigt — ${s}`,
    preview: "Deine Buchung ist bestätigt.",
    heading: "Buchung bestätigt",
    greeting: (name) => `Hallo ${name},`,
    intro:
      "Vielen Dank für deine Buchung — deine Zahlung war erfolgreich und dein Platz ist bestätigt. Hier die Details:",
    serviceLabel: "Leistung",
    whenLabel: "Termin",
    amountLabel: "Bezahlter Betrag",
    referenceLabel: "Referenz",
    outro: (email) =>
      `Bei Fragen antworte einfach auf diese E-Mail oder schreib uns an ${email}.`,
  },
  reminder: {
    subject: (s) => `Erinnerung — ${s}`,
    preview: "Eine Erinnerung an deinen bevorstehenden Termin.",
    heading: "Eine kurze Erinnerung",
    greeting: (name) => `Hallo ${name},`,
    intro: "Dies ist eine freundliche Erinnerung an deinen bevorstehenden Termin:",
    serviceLabel: "Leistung",
    whenLabel: "Termin",
    outro: (email) =>
      `Wenn du den Termin verschieben möchtest, antworte auf diese E-Mail oder schreib uns an ${email}.`,
  },
  footer: (brandName) => `${brandName} — Coaching für den beruflichen Wiedereinstieg`,
};

const COPY: Record<Locale, Copy> = { en, de };

export function copyFor(locale: Locale): Copy {
  return COPY[locale] ?? en;
}
