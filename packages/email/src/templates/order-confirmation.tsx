import { Heading, Section, Text } from "@react-email/components";
import { brand } from "../brand";
import { copyFor } from "../i18n";
import type { Locale, OrderConfirmationContext } from "../types";
import { EmailLayout } from "./layout";
import { DetailRow, detailBox, heading, paragraph } from "./shared";

export function OrderConfirmationEmail({
  context,
  locale,
}: {
  context: OrderConfirmationContext;
  locale: Locale;
}) {
  const t = copyFor(locale).orderConfirmation;
  const footerText = copyFor(locale).footer(brand.name);

  return (
    <EmailLayout preview={t.preview} footerText={footerText}>
      <Heading style={heading}>{t.heading}</Heading>
      <Text style={paragraph}>{t.greeting(context.guestName)}</Text>
      <Text style={paragraph}>{t.intro}</Text>

      <Section style={detailBox}>
        <DetailRow label={t.serviceLabel} value={context.serviceTitle} />
        {context.scheduledForFormatted ? (
          <DetailRow label={t.whenLabel} value={context.scheduledForFormatted} />
        ) : null}
        <DetailRow label={t.amountLabel} value={context.amountFormatted} />
        <DetailRow label={t.referenceLabel} value={context.orderId} />
      </Section>

      <Text style={paragraph}>{t.outro(context.supportEmail)}</Text>
    </EmailLayout>
  );
}
