import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bavaria Admin",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      {/* Scoped to <html>/<body> only — silences extension-injected attributes
          (e.g. password managers on the login form) without hiding real
          mismatches inside the app. */}
      <body className="min-h-full" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
