import { Heading, Section, Text } from "@react-email/components";
import { brand } from "../brand";
import type { ContactNotificationContext } from "../types";
import { EmailLayout } from "./layout";
import { DetailRow, detailBox, heading, paragraph } from "./shared";

const quote = {
  backgroundColor: "#fafafa",
  borderLeft: "3px solid #4f46e5",
  borderRadius: "4px",
  color: "#3f3f46",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "8px 0 20px",
  padding: "12px 16px",
  whiteSpace: "pre-wrap" as const,
};

/** Owner-facing. Internal notification, English only. */
export function ContactNotificationEmail({
  context,
}: {
  context: ContactNotificationContext;
}) {
  return (
    <EmailLayout
      preview={`New contact message from ${context.fromName}`}
      footerText={`${brand.name} — internal notification`}
    >
      <Heading style={heading}>New contact message</Heading>
      <Text style={paragraph}>
        Someone submitted the contact form on the site.
      </Text>

      <Section style={detailBox}>
        <DetailRow label="From" value={context.fromName} />
        <DetailRow label="Email" value={context.fromEmail} />
        {context.submittedAtFormatted ? (
          <DetailRow label="Submitted" value={context.submittedAtFormatted} />
        ) : null}
      </Section>

      <Text style={{ ...paragraph, fontWeight: 600, margin: "0 0 4px" }}>
        Message
      </Text>
      <Text style={quote}>{context.message}</Text>

      <Text style={paragraph}>Reply directly to this email to respond.</Text>
    </EmailLayout>
  );
}
