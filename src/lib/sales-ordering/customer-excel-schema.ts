/**
 * Shared Customer Master Excel 30-Header Schema & Normalization Utilities
 * Aligned 100% with 'Masterlist Customer with Code.xlsx'
 */

export const CUSTOMER_EXCEL_HEADERS = [
  "Customer ID",
  "Description(1)",
  "Description(2)",
  "PIC",
  "Full Address",
  "Address Line 1 (30 char)",
  "Address Line 2 (30 char)",
  "Address Line 3 (30 char)",
  "IF CONTAINS POSTCODE",
  "City",
  "Postal Code",
  "Country",
  "Company Registration No (New)/NRIC/Passport/Army No",
  "TIN Number",
  "SST Number (If applicable)",
  "Customer Misc Code",
  "Email Address (only 1 is required for eInvoice)",
  "Phone No.(1) - required format -no dash, no spacing,no extension code or text (example '017396624)",
  "SALES REP 1",
  "SALES REP 2",
  "Phone No.(2)",
  "Type",
  "CT",
  "Category Code",
  "NewType",
  "CodeID",
  "SageID",
  "Subtype",
  "Region",
  "REMARK",
] as const

export type CustomerExcelHeader = (typeof CUSTOMER_EXCEL_HEADERS)[number]

/**
 * Text-formatted columns where leading zeros or special alphanumeric formatting
 * must never be stripped or converted into numeric values by Excel.
 */
export const TEXT_FORMATTED_COLUMNS = new Set<string>([
  "Customer ID",
  "Postal Code",
  "Company Registration No (New)/NRIC/Passport/Army No",
  "TIN Number",
  "SST Number (If applicable)",
  "Customer Misc Code",
  "Phone No.(1) - required format -no dash, no spacing,no extension code or text (example '017396624)",
  "Phone No.(2)",
  "CodeID",
  "SageID",
])

/**
 * Sanitizes phone numbers by stripping dashes, spaces, and non-numeric characters.
 */
export function sanitizePhoneNumber(phone: string | null | undefined): string {
  if (!phone) return ""
  // Strip non-digit characters except possibly an optional leading '+'
  const cleaned = String(phone).replace(/[^\d+]/g, "").replace(/^\+/, "")
  return cleaned
}

/**
 * Auto-computes IF CONTAINS POSTCODE ('True' if Postal Code is present, else 'False')
 */
export function computeIfContainsPostcode(postalCode: string | null | undefined): "True" | "False" {
  if (!postalCode) return "False"
  const trimmed = String(postalCode).trim()
  return trimmed.length > 0 && trimmed !== "#N/A" ? "True" : "False"
}

/**
 * Auto-composes Full Address from address components if Full Address is blank.
 */
export function composeFullAddress(parts: {
  addressLine1?: string | null
  addressLine2?: string | null
  addressLine3?: string | null
  postalCode?: string | null
  city?: string | null
  country?: string | null
}): string {
  const segments = [
    parts.addressLine1?.trim(),
    parts.addressLine2?.trim(),
    parts.addressLine3?.trim(),
    parts.postalCode?.trim(),
    parts.city?.trim(),
    parts.country?.trim() || "MALAYSIA",
  ].filter((segment): segment is string => Boolean(segment && segment !== "#N/A"))

  return segments.join(", ")
}

/**
 * Cleans '#N/A', null, or undefined values into empty string for Excel export.
 */
export function cleanExcelValue(val: unknown): string {
  if (val === null || val === undefined) return ""
  if (typeof val === "object") {
    // If it's an Excel formula/error object like { error: '#N/A' }
    const obj = val as Record<string, any>
    if (obj.error) return ""
    if (obj.result !== undefined) return cleanExcelValue(obj.result)
  }
  const str = String(val).trim()
  if (str === "#N/A" || str === "NaN" || str === "undefined" || str === "null") return ""
  return str
}
