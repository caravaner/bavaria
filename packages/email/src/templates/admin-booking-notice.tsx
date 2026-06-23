import { Heading, Section, Text } from "@react-email/components";
import { brand } from "../brand";
import type { AdminBookingNoticeContext } from "../types";
import { EmailLayout } from "./layout";
import { DetailRow, detailBox, heading, paragraph } from "./shared";

/** Owner-facing. Internal notification, English only. */
export function AdminBookingNoticeEmail({
  context,
}: {
  context: AdminBookingNoticeContext;
}) {
  return (
    <EmailLayout
      preview={`New booking — ${context.serviceTitle}`}
      footerText={`${brand.name} — internal notification`}
    >
      <Heading style={heading}>New booking</Heading>
      <Text style={paragraph}>
        A payment was captured and a new booking is confirmed.
      </Text>

      <Section style={detailBox}>
        <DetailRow label="Guest" value={context.guestName} />
        <DetailRow label="Email" value={context.guestEmail} />
        <DetailRow label="Service" value={context.serviceTitle} />
        {context.scheduledForFormatted ? (
          <DetailRow label="When" value={context.scheduledForFormatted} />
        ) : null}
        <DetailRow label="Amount" value={context.amountFormatted} />
        <DetailRow label="Reference" value={context.orderId} />
      </Section>

      {context.notes ? (
        <>
          <Text style={{ ...paragraph, fontWeight: 600, margin: "0 0 4px" }}>
            Booking notes
          </Text>
          <Text style={paragraph}>{context.notes}</Text>
        </>
      ) : null}
    </EmailLayout>
  );
}
