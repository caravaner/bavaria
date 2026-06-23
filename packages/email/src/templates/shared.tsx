import { Column, Row, Text } from "@react-email/components";

export const heading = {
  color: "#18181b",
  fontSize: "22px",
  fontWeight: 700,
  lineHeight: "28px",
  margin: "0 0 16px",
};

export const paragraph = {
  color: "#3f3f46",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0 0 16px",
};

export const detailBox = {
  backgroundColor: "#fafafa",
  border: "1px solid #e4e4e7",
  borderRadius: "8px",
  margin: "8px 0 20px",
  padding: "8px 16px",
};

const rowLabel = {
  color: "#71717a",
  fontSize: "13px",
  margin: "8px 0",
  width: "40%",
};

const rowValue = {
  color: "#18181b",
  fontSize: "14px",
  fontWeight: 500,
  margin: "8px 0",
  textAlign: "right" as const,
};

/** One label/value line inside a detail box. */
export function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <Row>
      <Column style={rowLabel}>
        <Text style={rowLabel}>{label}</Text>
      </Column>
      <Column>
        <Text style={rowValue}>{value}</Text>
      </Column>
    </Row>
  );
}
