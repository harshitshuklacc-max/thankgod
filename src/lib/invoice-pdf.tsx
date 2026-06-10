import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

import { BRAND_COLORS } from "@/lib/theme";
import { STORE_INFO } from "@/lib/utils";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#111",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    borderBottomWidth: 2,
    borderBottomColor: BRAND_COLORS.primary,
    paddingBottom: 16,
  },
  brand: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: BRAND_COLORS.primary,
  },
  brandSub: {
    fontSize: 10,
    color: "#666",
    marginTop: 4,
  },
  invoiceMeta: {
    textAlign: "right",
  },
  invoiceTitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
    color: BRAND_COLORS.primary,
  },
  table: {
    marginTop: 8,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#000",
    color: "#fff",
    padding: 8,
    fontFamily: "Helvetica-Bold",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    padding: 8,
  },
  colItem: { flex: 3 },
  colQty: { flex: 1, textAlign: "center" },
  colPrice: { flex: 1.5, textAlign: "right" },
  colTotal: { flex: 1.5, textAlign: "right" },
  totals: {
    marginTop: 16,
    alignItems: "flex-end",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    width: 200,
    marginBottom: 4,
  },
  totalLabel: {
    flex: 1,
    textAlign: "right",
    paddingRight: 12,
  },
  grandTotal: {
    flexDirection: "row",
    justifyContent: "flex-end",
    width: 200,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 2,
    borderTopColor: BRAND_COLORS.primary,
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
  },
  footer: {
    position: "absolute",
    bottom: 40,
    left: 40,
    right: 40,
    textAlign: "center",
    color: "#888",
    fontSize: 9,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 12,
  },
});

export interface InvoicePDFItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface InvoicePDFProps {
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerPhone?: string | null;
  items: InvoicePDFItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  grandTotal: number;
}

export function InvoicePDFDocument({
  invoiceNumber,
  date,
  customerName,
  customerPhone,
  items,
  subtotal,
  taxAmount,
  discountAmount,
  grandTotal,
}: InvoicePDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>{STORE_INFO.name}</Text>
            <Text style={styles.brandSub}>{STORE_INFO.address}</Text>
            <Text style={styles.brandSub}>Phone: {STORE_INFO.phone}</Text>
          </View>
          <View style={styles.invoiceMeta}>
            <Text style={styles.invoiceTitle}>TAX INVOICE</Text>
            <Text>Invoice #: {invoiceNumber}</Text>
            <Text>Date: {date}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill To</Text>
          <Text>{customerName}</Text>
          {customerPhone && <Text>Phone: {customerPhone}</Text>}
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colItem}>Item</Text>
            <Text style={styles.colQty}>Qty</Text>
            <Text style={styles.colPrice}>Price</Text>
            <Text style={styles.colTotal}>Total</Text>
          </View>
          {items.map((item, idx) => (
            <View key={idx} style={styles.tableRow}>
              <Text style={styles.colItem}>{item.name}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colPrice}>₹{item.unitPrice.toLocaleString("en-IN")}</Text>
              <Text style={styles.colTotal}>₹{item.totalPrice.toLocaleString("en-IN")}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text>₹{subtotal.toLocaleString("en-IN")}</Text>
          </View>
          {discountAmount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Discount:</Text>
              <Text>-₹{discountAmount.toLocaleString("en-IN")}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax (GST):</Text>
            <Text>₹{taxAmount.toLocaleString("en-IN")}</Text>
          </View>
          <View style={styles.grandTotal}>
            <Text style={styles.totalLabel}>Grand Total:</Text>
            <Text>₹{grandTotal.toLocaleString("en-IN")}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>Thank you for shopping at {STORE_INFO.name}!</Text>
          <Text>{STORE_INFO.hours}</Text>
        </View>
      </Page>
    </Document>
  );
}
