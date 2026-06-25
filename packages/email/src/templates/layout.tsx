import {
  Body,
  Column,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import { brand } from "../brand";

const main = {
  backgroundColor: "#f4f4f5",
  fontFamily:
    "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
  padding: "32px 0",
};

const container = {
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  border: "1px solid #e4e4e7",
  margin: "0 auto",
  maxWidth: "520px",
  padding: "32px",
};

const header = { margin: "0 0 24px" };

const logo = {
  borderRadius: "10px",
  display: "block",
};

const wordmark = {
  color: "#18181b",
  fontSize: "18px",
  fontWeight: 700,
  letterSpacing: "-0.01em",
  margin: 0,
  paddingLeft: "12px",
  verticalAlign: "middle" as const,
};

const hr = { borderColor: "#e4e4e7", margin: "28px 0 16px" };

const footer = {
  color: "#71717a",
  fontSize: "12px",
  lineHeight: "18px",
  margin: 0,
};

export function EmailLayout({
  preview,
  footerText,
  children,
}: {
  preview: string;
  footerText: string;
  children: React.ReactNode;
}) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Row>
              <Column style={{ width: "44px" }}>
                <Img
                  src={brand.logoUrl}
                  alt={brand.name}
                  width="44"
                  height="44"
                  style={logo}
                />
              </Column>
              <Column>
                <Text style={wordmark}>{brand.name}</Text>
              </Column>
            </Row>
          </Section>
          {children}
          <Hr style={hr} />
          <Section>
            <Text style={footer}>{footerText}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
