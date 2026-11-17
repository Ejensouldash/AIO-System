export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import ExcelJS from "exceljs"
import { prisma } from "@/lib/prisma"
import { canAccessSalesOrderingTab, getSalesOrderingAccess } from "@/lib/sales-ordering/access"
import {
  CUSTOMER_EXCEL_HEADERS,
  TEXT_FORMATTED_COLUMNS,
  cleanExcelValue,
  computeIfContainsPostcode,
} from "@/lib/sales-ordering/customer-excel-schema"

export async function GET() {
  const access = await getSalesOrderingAccess()
  if (!access || !canAccessSalesOrderingTab(access, "customers")) {
    return NextResponse.json(
      { error: "Unauthorized. Customer view permissions required." },
      { status: 403 }
    )
  }

  try {
    const customers = await prisma.customer.findMany({
      include: {
        addresses: {
          orderBy: { isDefaultBilling: "desc" },
          take: 1,
        },
      },
      orderBy: { customerCode: "asc" },
    })

    const workbook = new ExcelJS.Workbook()
    workbook.creator = "AIO System"
    workbook.lastModifiedBy = access.name || "AIO System"
    workbook.created = new Date()
    workbook.modified = new Date()

    const worksheet = workbook.addWorksheet("Sheet1", {
      views: [{ state: "frozen", ySplit: 1 }],
    })

    // Setup columns matching the exact 30 headers
    worksheet.columns = CUSTOMER_EXCEL_HEADERS.map((header) => {
      let width = 16
      if (header.includes("Address") || header.includes("Description")) width = 32
      else if (header.includes("Phone") || header.includes("Company Registration") || header.includes("Email")) width = 24
      else if (header.length > 15) width = Math.min(header.length + 3, 28)
      return {
        header,
        key: header,
        width,
      }
    })

    // Style Header Row (Row 1)
    const headerRow = worksheet.getRow(1)
    headerRow.height = 28
    headerRow.eachCell((cell) => {
      cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FFFFFFFF" } }
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF0F172A" }, // Dark slate (slate-900)
      }
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: false }
      cell.border = {
        top: { style: "thin", color: { argb: "FF334155" } },
        bottom: { style: "medium", color: { argb: "FF020617" } },
        left: { style: "thin", color: { argb: "FF334155" } },
        right: { style: "thin", color: { argb: "FF334155" } },
      }
    })

    // Populate rows
    for (const customer of customers) {
      const source = (customer.sourceData as Record<string, any>) || {}
      const addr = customer.addresses[0]

      const rowData: Record<string, string> = {}

      for (const header of CUSTOMER_EXCEL_HEADERS) {
        let val: any = source[header]

        // Fallbacks if not present in sourceData
        if (val === undefined || val === null || val === "#N/A") {
          switch (header) {
            case "Customer ID":
              val = customer.customerCode
              break
            case "Description(1)":
              val = customer.legalName
              break
            case "Description(2)":
              val = customer.tradingName || ""
              break
            case "PIC":
              val = customer.pic || addr?.attentionTo || ""
              break
            case "Full Address":
              val = addr?.fullAddress || ""
              break
            case "Address Line 1 (30 char)":
              val = addr?.addressLine1 || ""
              break
            case "Address Line 2 (30 char)":
              val = addr?.addressLine2 || ""
              break
            case "Address Line 3 (30 char)":
              val = addr?.addressLine3 || ""
              break
            case "IF CONTAINS POSTCODE":
              val = computeIfContainsPostcode(addr?.postcode)
              break
            case "City":
              val = addr?.city || ""
              break
            case "Postal Code":
              val = addr?.postcode || ""
              break
            case "Country":
              val = addr?.country || "MALAYSIA"
              break
            case "Company Registration No (New)/NRIC/Passport/Army No":
              val = customer.companyRegistrationNo || ""
              break
            case "TIN Number":
              val = customer.tinNo || ""
              break
            case "SST Number (If applicable)":
              val = customer.sstNo || ""
              break
            case "Customer Misc Code":
              val = ""
              break
            case "Email Address (only 1 is required for eInvoice)":
              val = customer.email || ""
              break
            case "Phone No.(1) - required format -no dash, no spacing,no extension code or text (example '017396624)":
              val = customer.phonePrimary || addr?.phone || ""
              break
            case "SALES REP 1":
              val = customer.salesRep1 || ""
              break
            case "SALES REP 2":
              val = customer.salesRep2 || ""
              break
            case "Phone No.(2)":
              val = customer.phoneSecondary || ""
              break
            case "Type":
              val = customer.customerType || ""
              break
            case "CT":
              val = customer.creditTermsRaw || ""
              break
            case "Category Code":
              val = customer.categoryCode || ""
              break
            case "NewType":
              val = customer.customerType || ""
              break
            case "CodeID":
              val = ""
              break
            case "SageID":
              val = customer.sageCustomerId || ""
              break
            case "Subtype":
              val = customer.customerSubtype || ""
              break
            case "Region":
              val = customer.region || addr?.state || ""
              break
            case "REMARK":
              val = ""
              break
            default:
              val = ""
          }
        }

        rowData[header] = cleanExcelValue(val)
      }

      const addedRow = worksheet.addRow(rowData)
      addedRow.height = 20

      // Style data cells and force text numFmt on specific columns
      addedRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const headerName = CUSTOMER_EXCEL_HEADERS[colNumber - 1]
        if (TEXT_FORMATTED_COLUMNS.has(headerName)) {
          cell.numFmt = "@"
          cell.value = cell.value ? String(cell.value) : ""
        }
        cell.font = { name: "Calibri", size: 10 }
        cell.border = {
          top: { style: "thin", color: { argb: "FFE2E8F0" } },
          bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
          left: { style: "thin", color: { argb: "FFE2E8F0" } },
          right: { style: "thin", color: { argb: "FFE2E8F0" } },
        }
        cell.alignment = { vertical: "middle" }
      })
    }

    // Set auto-filter for the entire table range
    const totalRows = customers.length + 1
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: totalRows, column: CUSTOMER_EXCEL_HEADERS.length },
    }

    const buffer = await workbook.xlsx.writeBuffer()

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="Masterlist_Customer_${new Date().toISOString().slice(0, 10)}.xlsx"`,
        "Cache-Control": "no-store, max-age=0",
      },
    })
  } catch (err: any) {
    console.error("Customer Excel export error:", err)
    return NextResponse.json(
      { error: "Failed to export customer master excel." },
      { status: 500 }
    )
  }
}
