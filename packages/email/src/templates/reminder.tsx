import { Heading, Section, Text } from "@react-email/components";
import { brand } from "../brand";
import { copyFor } from "../i18n";
import type { Locale, ReminderContext } from "../types";
import { EmailLayout } from "./layout";
import { DetailRow, detailBox, heading, paragraph } from "./shared";

export function ReminderEmail({
  context,
  locale,
}: {
  context: ReminderContext;
  locale: Locale;
}) {
  const t = copyFor(locale).reminder;
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
      </Section>

      {context.customMessage ? (
        <Text style={paragraph}>{context.customMessage}</Text>
      ) : null}

      <Text style={paragraph}>{t.outro(context.supportEmail)}</Text>
    </EmailLayout>
  );
}
