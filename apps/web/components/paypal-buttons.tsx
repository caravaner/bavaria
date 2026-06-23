"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "@/i18n/navigation";

type Props = {
  paypalOrderId: string;
  localOrderId: string;
  /** PayPal locale code, e.g. "en_GB", "de_DE". Falls back to "en_GB". */
  locale?: string;
  /** Where to send the buyer on capture success — locale-stripped href, router prepends locale. */
  successHref: string;
  /** Where to send on user-cancel. */
  cancelHref: string;
  /** Public client id, exposed to the browser. */
  clientId: string;
  /** ISO currency code, e.g. "EUR" — must match PayPal's order currency. */
  currency: string;
  /** Translations passed in so the button reads them from server-rendered messages. */
  labels: {
    loading: string;
    errorTitle: string;
    errorBody: string;
    capturing: string;
    captureError: string;
  };
};

declare global {
  interface Window {
    paypal?: {
      Buttons: (config: PayPalButtonsConfig) => {
        render: (selector: string | HTMLElement) => Promise<void>;
        close: () => Promise<void>;
      };
    };
  }
}

type PayPalButtonsConfig = {
  style?: Record<string, unknown>;
  createOrder: () => string | Promise<string>;
  onApprove: (data: { orderID: string }) => Promise<void> | void;
  onCancel?: () => void;
  onError?: (err: unknown) => void;
};

const SDK_URL_BASE = "https://www.paypal.com/sdk/js";

export function PayPalButtons({
  paypalOrderId,
  localOrderId,
  locale = "en_GB",
  successHref,
  cancelHref,
  clientId,
  currency,
  labels,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const renderedRef = useRef(false);
  const router = useRouter();

  const [status, setStatus] = useState<
    "loading" | "ready" | "capturing" | "error"
  >("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (renderedRef.current) return;

    let cancelled = false;
    const params = new URLSearchParams({
      "client-id": clientId,
      currency,
      intent: "capture",
      locale,
      "disable-funding": "paylater,venmo",
    });
    const src = `${SDK_URL_BASE}?${params.toString()}`;

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${src}"]`,
    );

    function mount() {
      if (cancelled || renderedRef.current) return;
      if (!window.paypal || !containerRef.current) return;
      renderedRef.current = true;

      window.paypal
        .Buttons({
          style: { layout: "vertical", shape: "pill", label: "paypal" },
          createOrder: () => paypalOrderId,
          onApprove: async () => {
            setStatus("capturing");
            try {
              const res = await fetch("/api/paypal/capture-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ localOrderId }),
              });
              if (!res.ok) {
                throw new Error(`Capture failed (${res.status})`);
              }
              router.push(successHref);
            } catch (err) {
              console.error("[paypal] capture error", err);
              setStatus("error");
              setErrorMessage(labels.captureError);
            }
          },
          onCancel: () => {
            router.push(cancelHref);
          },
          onError: (err) => {
            console.error("[paypal] sdk error", err);
            setStatus("error");
            setErrorMessage(labels.errorBody);
          },
        })
        .render(containerRef.current)
        .then(() => setStatus("ready"))
        .catch((err) => {
          console.error("[paypal] render error", err);
          setStatus("error");
          setErrorMessage(labels.errorBody);
        });
    }

    if (window.paypal) {
      mount();
    } else if (existing) {
      existing.addEventListener("load", mount, { once: true });
    } else {
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.addEventListener("load", mount, { once: true });
      script.addEventListener("error", () => {
        setStatus("error");
        setErrorMessage(labels.errorBody);
      });
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
    };
  }, [
    paypalOrderId,
    localOrderId,
    clientId,
    currency,
    locale,
    successHref,
    cancelHref,
    labels.errorBody,
    labels.captureError,
    router,
  ]);

  return (
    <div>
      {status === "loading" && (
        <p className="text-sm text-muted">{labels.loading}</p>
      )}
      {status === "capturing" && (
        <p className="text-sm text-muted">{labels.capturing}</p>
      )}
      {status === "error" && (
        <div className="rounded-2xl border border-accent/40 bg-accent-soft/40 p-5 text-sm">
          <p className="font-medium">{labels.errorTitle}</p>
          {errorMessage && <p className="mt-1 text-muted">{errorMessage}</p>}
        </div>
      )}
      <div
        ref={containerRef}
        aria-hidden={status !== "ready"}
        className={status === "ready" ? "" : "hidden"}
      />
    </div>
  );
}
