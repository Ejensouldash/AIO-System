import React from "react"
import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer"
import { LWI_COMPANY_PROFILE } from "@/lib/company-profile"

export type SalesOrderItemData = {
  id: string
  sku?: string | null
  itemCodeSnapshot?: string | null
  descriptionSnapshot: string
  uom: string
  qtyOrdered: number | string
  unitPrice: number | string
  discountAmount?: number | string
  taxAmount?: number | string
  lineTotal: number | string
  remarks?: string | null
}

export type SalesOrderPdfData = {
  id: string
  internalSoNo: string
  sageSalesOrderNo?: string | null
  poNumber?: string | null
  customerDocumentNo?: string | null
  orderDate?: Date | string | null
  requestedDeliveryDate?: Date | string | null
  paymentTermsSnapshot?: string | null
  billingAddressSnapshot?: unknown
  deliveryAddressSnapshot?: unknown
  deliveryContactSnapshot?: string | null
  deliveryPhoneSnapshot?: string | null
  currency?: string
  subtotal: number | string
  discountTotal?: number | string
  freightTotal?: number | string
  taxTotal?: number | string
  grandTotal: number | string
  orderRemarks?: string | null
  status: string
  createdAt: Date | string
  customer: {
    customerCode: string
    legalName: string
    pic?: string | null
    phonePrimary?: string | null
    email?: string | null
    addresses?: Array<{
      fullAddress: string | null
      attentionTo: string | null
      phone: string | null
      isDefaultDelivery: boolean
      isDefaultBilling: boolean
    }>
  }
  createdBy: {
    name: string
  }
  items: SalesOrderItemData[]
}

const palette = {
  navyDark: "#0B192C",
  navy: "#1E3E62",
  navyLight: "#2B4C7E",
  body: "#1F2937",
  muted: "#4B5563",
  faint: "#6B7280",
  border: "#CBD5E1",
  borderLight: "#E2E8F0",
  bgSubtle: "#F8FAFC",
  lwiBlue: "#0284C7",
  lwiBlueDark: "#0369A1",
  lwiBlueSoft: "#E0F2FE",
  lwiBlueBorder: "#BAE6FD",
  emerald: "#059669",
  emeraldSoft: "#ECFDF5",
  emeraldBorder: "#A7F3D0",
  white: "#FFFFFF",
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingHorizontal: 28,
    paddingBottom: 45,
    flexDirection: "column",
    fontFamily: "Helvetica",
    fontSize: 8,
    color: palette.body,
    backgroundColor: palette.white,
  },
  topAccentBar: {
    height: 3,
    backgroundColor: palette.lwiBlue,
    marginBottom: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: palette.border,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    width: 340,
  },
  logo: {
    width: 110,
    height: 40,
    marginRight: 12,
    objectFit: "contain",
  },
  companyDetails: {
    width: 215,
  },
  companyName: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: palette.navyDark,
    marginBottom: 2,
  },
  companyReg: {
    fontSize: 6.8,
    fontFamily: "Helvetica-Bold",
    color: palette.lwiBlueDark,
    marginBottom: 2,
  },
  companyText: {
    fontSize: 6.5,
    color: palette.muted,
    lineHeight: 1.3,
  },
  headerRight: {
    width: 175,
    alignItems: "flex-end",
  },
  docTitle: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
    color: palette.navyDark,
    textAlign: "right",
  },
  docSubTitle: {
    fontSize: 6.8,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.2,
    color: palette.lwiBlueDark,
    marginTop: 1,
    textTransform: "uppercase",
    textAlign: "right",
  },
  soBadge: {
    marginTop: 5,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderWidth: 0.5,
    borderColor: palette.lwiBlueBorder,
    backgroundColor: palette.lwiBlueSoft,
    alignSelf: "flex-end",
  },
  soBadgeText: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: palette.lwiBlueDark,
  },
  statusBadge: {
    marginTop: 3,
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderWidth: 0.5,
    borderColor: palette.emeraldBorder,
    backgroundColor: palette.emeraldSoft,
    alignSelf: "flex-end",
  },
  statusBadgeText: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    color: palette.emerald,
    textTransform: "uppercase",
  },
  cardsGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  card: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: palette.border,
    padding: 6,
    backgroundColor: palette.white,
  },
  cardHeader: {
    fontSize: 6.8,
    fontFamily: "Helvetica-Bold",
    color: palette.lwiBlueDark,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: palette.borderLight,
    paddingBottom: 2,
  },
  cardContent: {
    fontSize: 7,
    lineHeight: 1.35,
  },
  cardBold: {
    fontFamily: "Helvetica-Bold",
    color: palette.navyDark,
  },
  cardMuted: {
    color: palette.muted,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  cardLabel: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    color: palette.muted,
    textTransform: "uppercase",
  },
  cardVal: {
    fontSize: 7,
    color: palette.navyDark,
  },
  table: {
    borderWidth: 0.5,
    borderColor: palette.border,
    flexGrow: 1,
    marginBottom: 8,
    flexDirection: "column",
  },
  tableHead: {
    flexDirection: "row",
    backgroundColor: palette.navyDark,
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: palette.navyDark,
  },
  th: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7,
    color: palette.white,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tr: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: palette.borderLight,
    paddingVertical: 5,
    paddingHorizontal: 4,
    alignItems: "center",
  },
  trEven: {
    backgroundColor: palette.bgSubtle,
  },
  td: {
    fontSize: 7.2,
    color: palette.body,
  },
  tdNum: {
    fontSize: 7.2,
    fontFamily: "Helvetica-Bold",
    color: palette.navyDark,
  },
  colNo: { width: "5%", textAlign: "center" },
  colDesc: { width: "45%", textAlign: "left", paddingLeft: 4 },
  colUom: { width: "10%", textAlign: "center" },
  colQty: { width: "12%", textAlign: "right", paddingRight: 6 },
  colPrice: { width: "14%", textAlign: "right", paddingRight: 6 },
  colTotal: { width: "14%", textAlign: "right", paddingRight: 4 },
  skuCode: {
    fontSize: 6.2,
    fontFamily: "Helvetica-Bold",
    color: palette.lwiBlueDark,
    marginTop: 1,
  },
  bottomSection: {
    marginTop: "auto",
  },
  summaryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  termsSection: {
    width: "55%",
    borderWidth: 0.5,
    borderColor: palette.border,
    padding: 6,
    backgroundColor: palette.bgSubtle,
  },
  termsTitle: {
    fontSize: 6.8,
    fontFamily: "Helvetica-Bold",
    color: palette.navyDark,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  termsText: {
    fontSize: 6.2,
    color: palette.muted,
    lineHeight: 1.35,
  },
  totalsSection: {
    width: "42%",
    borderWidth: 0.5,
    borderColor: palette.border,
    backgroundColor: palette.white,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3.5,
    paddingHorizontal: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: palette.borderLight,
  },
  totalRowGrand: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    paddingHorizontal: 6,
    backgroundColor: palette.navyDark,
  },
  totalLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: palette.muted,
    textTransform: "uppercase",
  },
  totalVal: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: palette.navyDark,
  },
  grandLabel: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: palette.white,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  grandVal: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: palette.emeraldSoft,
  },
  signaturesGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 2,
  },
  sigBox: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: palette.border,
    padding: 6,
    minHeight: 65,
    justifyContent: "space-between",
    backgroundColor: palette.white,
  },
  sigTitle: {
    fontSize: 6.8,
    fontFamily: "Helvetica-Bold",
    color: palette.muted,
    textTransform: "uppercase",
  },
  sigLine: {
    borderTopWidth: 0.5,
    borderTopColor: palette.navyDark,
    paddingTop: 3,
  },
  sigName: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: palette.navyDark,
  },
  sigRole: {
    fontSize: 6.2,
    color: palette.muted,
  },
  footer: {
    position: "absolute",
    bottom: 18,
    left: 28,
    right: 28,
    borderTopWidth: 0.5,
    borderTopColor: palette.borderLight,
    paddingTop: 5,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: 6.2,
    color: palette.faint,
  },
})

function formatMoney(amount: number | string | undefined | null): string {
  const n = Number(amount || 0)
  return n.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatDate(date: Date | string | undefined | null): string {
  if (!date) return "-"
  const d = new Date(date)
  if (isNaN(d.getTime())) return String(date)
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Kuala_Lumpur",
  }).format(d)
}

function extractAddress(address: unknown): string {
  if (!address) return "-"
  if (typeof address === "string") return address
  if (typeof address === "object") {
    if ("text" in (address as any) && (address as any).text) {
      return String((address as any).text)
    }
    if ("fullAddress" in (address as any) && (address as any).fullAddress) {
      return String((address as any).fullAddress)
    }
    if ("line1" in (address as any)) {
      const a = address as any
      return [a.line1, a.line2, a.postcode, a.city, a.state].filter(Boolean).join(", ")
    }
  }
  return "-"
}

function formatSkuDescription(sku?: string | null, descriptionSnapshot?: string): string {
  if (sku === "LWI_500_24" || sku === "lwi_500_24") {
    return "LWI BLUE 500ML X 24"
  }
  return descriptionSnapshot || sku || "Product Item"
}

export function SalesOrderPdfDocument({
  data,
  logoSource,
}: {
  data: SalesOrderPdfData
  logoSource?: string
}) {
  const totalQty = data.items.reduce((sum, item) => sum + Number(item.qtyOrdered || 0), 0)
  const deliveryAddr =
    extractAddress(data.deliveryAddressSnapshot) !== "-"
      ? extractAddress(data.deliveryAddressSnapshot)
      : data.customer.addresses?.find((a) => a.isDefaultDelivery)?.fullAddress ||
        data.customer.addresses?.[0]?.fullAddress ||
        "-"

  const billingAddr =
    extractAddress(data.billingAddressSnapshot) !== "-"
      ? extractAddress(data.billingAddressSnapshot)
      : data.customer.addresses?.find((a) => a.isDefaultBilling)?.fullAddress ||
        deliveryAddr

  return (
    <Document title={`Sales Order - ${data.internalSoNo}`} author="Langkawi Water Industry Sdn Bhd">
      <Page size="A4" style={styles.page}>
        {/* Top colored accent line (repeats on every page) */}
        <View style={styles.topAccentBar} fixed />

        {/* Company Header (repeats on every page) */}
        <View style={styles.header} fixed>
          <View style={styles.headerLeft}>
            {logoSource ? (
              <Image src={logoSource} style={styles.logo} />
            ) : (
              <View style={[styles.logo, { justifyContent: "center", alignItems: "center" }]}>
                <Text style={{ fontSize: 14, fontFamily: "Helvetica-Bold", color: palette.lwiBlue }}>LWI BLUE</Text>
              </View>
            )}
            <View style={styles.companyDetails}>
              <Text style={styles.companyName}>{LWI_COMPANY_PROFILE.legalName}</Text>
              <Text style={styles.companyReg}>Co. Reg No: {LWI_COMPANY_PROFILE.registrationNo}</Text>
              <Text style={styles.companyText}>{LWI_COMPANY_PROFILE.addressInline}</Text>
              <Text style={styles.companyText}>
                Tel: {LWI_COMPANY_PROFILE.phone} | Email: {LWI_COMPANY_PROFILE.email}
              </Text>
              <Text style={styles.companyText}>
                SST: {LWI_COMPANY_PROFILE.salesTaxRegistrationNo} | TIN: {LWI_COMPANY_PROFILE.tin}
              </Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <Text style={styles.docTitle}>SALES ORDER</Text>
            <Text style={styles.docSubTitle}>Official Commercial Document</Text>
            <View style={styles.soBadge}>
              <Text style={styles.soBadgeText}>{data.internalSoNo}</Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>STATUS: {data.status}</Text>
            </View>
          </View>
        </View>

        {/* 3 Meta Cards: Bill To, Ship To, Order Info (Page 1) */}
        <View style={styles.cardsGrid}>
          {/* Bill To */}
          <View style={styles.card}>
            <Text style={styles.cardHeader}>Bill To / Customer</Text>
            <Text style={[styles.cardBold, { fontSize: 8 }]}>{data.customer.legalName}</Text>
            <Text style={[styles.cardMuted, { fontSize: 6.8, marginBottom: 2 }]}>
              Account ID: {data.customer.customerCode}
            </Text>
            <Text style={[styles.cardContent, styles.cardMuted]}>{billingAddr}</Text>
            {(data.customer.pic || data.customer.phonePrimary) && (
              <Text style={[styles.cardContent, { marginTop: 3 }]}>
                Attn: {data.customer.pic || "-"} ({data.customer.phonePrimary || "-"})
              </Text>
            )}
          </View>

          {/* Ship To */}
          <View style={styles.card}>
            <Text style={styles.cardHeader}>Ship To / Delivery Destination</Text>
            <Text style={[styles.cardContent, styles.cardBold]}>{deliveryAddr}</Text>
            {(data.deliveryContactSnapshot || data.deliveryPhoneSnapshot) && (
              <Text style={[styles.cardContent, { marginTop: 3 }]}>
                Contact: {data.deliveryContactSnapshot || "-"} ({data.deliveryPhoneSnapshot || "-"})
              </Text>
            )}
            <View style={[styles.cardRow, { marginTop: 4 }]}>
              <Text style={styles.cardLabel}>Req. Delivery Date:</Text>
              <Text style={styles.cardVal}>{formatDate(data.requestedDeliveryDate)}</Text>
            </View>
          </View>

          {/* Order Details */}
          <View style={styles.card}>
            <Text style={styles.cardHeader}>Order References</Text>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>SO Date:</Text>
              <Text style={styles.cardVal}>{formatDate(data.orderDate || data.createdAt)}</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Customer PO No:</Text>
              <Text style={[styles.cardVal, styles.cardBold]}>{data.poNumber || "-"}</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Payment Terms:</Text>
              <Text style={styles.cardVal}>{data.paymentTermsSnapshot || "CASH / 30 DAYS"}</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Currency:</Text>
              <Text style={styles.cardVal}>{data.currency || "MYR"}</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Prepared By:</Text>
              <Text style={styles.cardVal}>{data.createdBy?.name || "Operations Team"}</Text>
            </View>
          </View>
        </View>

        {/* Items Table Container (flexGrow: 1 anchors bottom sections cleanly) */}
        <View style={styles.table}>
          {/* Table Header (repeats on every page via fixed prop) */}
          <View style={styles.tableHead} fixed>
            <Text style={[styles.th, styles.colNo]}>#</Text>
            <Text style={[styles.th, styles.colDesc]}>Item Description &amp; SKU</Text>
            <Text style={[styles.th, styles.colUom]}>UOM</Text>
            <Text style={[styles.th, styles.colQty]}>Qty</Text>
            <Text style={[styles.th, styles.colPrice]}>Unit Price (RM)</Text>
            <Text style={[styles.th, styles.colTotal]}>Total (RM)</Text>
          </View>

          {data.items.map((item, index) => {
            const isEven = index % 2 === 1
            const itemDesc = formatSkuDescription(item.sku, item.descriptionSnapshot)
            return (
              <View key={item.id || index} style={[styles.tr, isEven ? styles.trEven : {}]}>
                <Text style={[styles.td, styles.colNo]}>{index + 1}</Text>
                <View style={styles.colDesc}>
                  <Text style={[styles.td, { fontFamily: "Helvetica-Bold" }]}>{itemDesc}</Text>
                  {item.sku && <Text style={styles.skuCode}>SKU: {item.sku}</Text>}
                  {item.remarks && <Text style={[styles.skuCode, { color: palette.muted }]}>{item.remarks}</Text>}
                </View>
                <Text style={[styles.td, styles.colUom]}>{item.uom || "CTN"}</Text>
                <Text style={[styles.tdNum, styles.colQty]}>
                  {Number(item.qtyOrdered).toLocaleString("en-MY")}
                </Text>
                <Text style={[styles.tdNum, styles.colPrice]}>{formatMoney(item.unitPrice)}</Text>
                <Text style={[styles.tdNum, styles.colTotal]}>{formatMoney(item.lineTotal)}</Text>
              </View>
            )
          })}
        </View>

        {/* Bottom Section: Summary & Signatures (wrap={false} prevents awkward page split) */}
        <View wrap={false} style={styles.bottomSection}>
          {/* Summary: Terms & Remarks on Left, Totals on Right */}
          <View style={styles.summaryContainer}>
            <View style={styles.termsSection}>
              <Text style={styles.termsTitle}>Commercial Notes &amp; Terms</Text>
              <Text style={styles.termsText}>
                1. All payments by cheque / transfer must be made in favour of {LWI_COMPANY_PROFILE.legalName}.
              </Text>
              <Text style={styles.termsText}>
                2. Goods sold are subject to standard warehouse distribution and quality acceptance terms.
              </Text>
              <Text style={styles.termsText}>
                3. Claims for damage or shortage must be reported within 24 hours of delivery order receipt.
              </Text>
              {data.orderRemarks && (
                <Text style={[styles.termsText, { marginTop: 3, fontFamily: "Helvetica-Bold", color: palette.navyDark }]}>
                  Special Instructions: {data.orderRemarks}
                </Text>
              )}
            </View>

            <View style={styles.totalsSection}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Quantity:</Text>
                <Text style={styles.totalVal}>{totalQty.toLocaleString("en-MY")} CTN</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal:</Text>
                <Text style={styles.totalVal}>RM {formatMoney(data.subtotal)}</Text>
              </View>
              {Number(data.discountTotal || 0) > 0 && (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Discount:</Text>
                  <Text style={[styles.totalVal, { color: palette.emerald }]}>
                    - RM {formatMoney(data.discountTotal)}
                  </Text>
                </View>
              )}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Sales Tax / SST (0%):</Text>
                <Text style={styles.totalVal}>RM {formatMoney(data.taxTotal || 0)}</Text>
              </View>
              <View style={styles.totalRowGrand}>
                <Text style={styles.grandLabel}>Grand Total (MYR):</Text>
                <Text style={styles.grandVal}>RM {formatMoney(data.grandTotal)}</Text>
              </View>
            </View>
          </View>

          {/* Signatures / Endorsement Section */}
          <View style={styles.signaturesGrid}>
            <View style={styles.sigBox}>
              <Text style={styles.sigTitle}>Prepared By</Text>
              <View style={styles.sigLine}>
                <Text style={styles.sigName}>{data.createdBy?.name || "Operations"}</Text>
                <Text style={styles.sigRole}>Sales Ordering &amp; Logistics</Text>
              </View>
            </View>

            <View style={styles.sigBox}>
              <Text style={styles.sigTitle}>Customer Confirmation</Text>
              <View style={styles.sigLine}>
                <Text style={styles.sigName}>Authorized Signature &amp; Stamp</Text>
                <Text style={styles.sigRole}>Name: ____________________ Date: ________</Text>
              </View>
            </View>

            <View style={styles.sigBox}>
              <Text style={styles.sigTitle}>LWI Management Approval</Text>
              <View style={styles.sigLine}>
                <Text style={styles.sigName}>Finance &amp; Warehouse Division</Text>
                <Text style={styles.sigRole}>{LWI_COMPANY_PROFILE.brandName}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Pinned Bottom Page Footer with Dynamic Page Numbers */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            LWI BLUE · Langkawi Water Industry Sdn. Bhd. · Document Ref: {data.internalSoNo}
          </Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) =>
              `Generated: ${formatDate(new Date())} · Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  )
}
