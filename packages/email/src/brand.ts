/**
 * Sender branding used in every template footer. Kept here (not in the web
 * app's lib/brand) because the email package must stay standalone — no imports
 * from the apps, no DB.
 */
const url = process.env.NEXT_PUBLIC_SITE_URL ?? "https://career-restart.de";

export const brand = {
  name: "Career Restart",
  /** Public site URL, shown in footers. Override via NEXT_PUBLIC_SITE_URL if set. */
  url,
  /**
   * Absolute URL of the logo shown in every email header. Email clients can't
   * load relative paths or SVG reliably, so this points at the hosted PNG served
   * by the public web app (apps/web/public/images/email-logo.png). Override the
   * whole URL with EMAIL_LOGO_URL if the asset lives elsewhere (e.g. a CDN).
   */
  logoUrl: process.env.EMAIL_LOGO_URL ?? `${url}/images/email-logo.png`,
} as const;
