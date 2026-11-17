export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import * as xlsx from "xlsx"
import { Prisma } from "@prisma/client"
import { randomUUID } from "crypto"
import { prisma } from "@/lib/prisma"
import { canAccessSalesOrderingTab, canManageSalesOrderingCustomers, getSalesOrderingAccess } from "@/lib/sales-ordering/access"

export const runtime = "nodejs"
export const maxDuration = 300

type Row = Record<string, unknown>

const value = (row: Row, key: string) => String(row[key] ?? "").trim()
const cleanOptional = (input: string) => input && input !== "#N/A" ? input : null

function findHeaderSheet(workbook: xlsx.WorkBook) {
  for (const sheetName of workbook.SheetNames) {
    const rows = xlsx.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], { header: 1, defval: "", raw: false, blankrows: false })
    const headerRowIndex = rows.findIndex(row => Array.isArray(row) && row.some(cell => String(cell).trim() === "Customer ID"))
    if (headerRowIndex >= 0) return { sheetName, sheet: workbook.Sheets[sheetName], headerRowIndex }
  }
  return null
}

function parseCreditTerms(raw: string) {
  const normal = raw.trim().toUpperCase()
  const dayMatch = normal.match(/^(\d{1,3})(?:\s*DAYS?)?$/)
  if (dayMatch) return { days: Number(dayMatch[1]), policy: "CREDIT" }
  if (normal.includes("DEPOSIT")) return { days: null, policy: "DEPOSIT" }
  if (normal === "CASH") return { days: null, policy: "CASH" }
  if (normal === "COD") return { days: null, policy: "COD" }
  return { days: null, policy: normal ? "OTHER" : null }
}

export async function POST(request: Request) {
  const access = await getSalesOrderingAccess()
  if (!access || !canAccessSalesOrderingTab(access, "customers") || !canManageSalesOrderingCustomers(access)) {
    return NextResponse.json({ error: "Akses import Customer Master diperlukan." }, { status: 403 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file")
    if (!(file instanceof File)) return NextResponse.json({ error: "Excel file is required." }, { status: 400 })
    if (!/\.xlsx?$/i.test(file.name)) return NextResponse.json({ error: "Only .xlsx or .xls files are allowed." }, { status: 400 })
    if (file.size > 25 * 1024 * 1024) return NextResponse.json({ error: "File exceeds 25 MB." }, { status: 400 })

    const workbook = xlsx.read(Buffer.from(await file.arrayBuffer()), { type: "buffer", cellDates: true })
    const masterSource = findHeaderSheet(workbook)
    if (!masterSource) return NextResponse.json({ error: "Customer ID column not found in workbook." }, { status: 400 })

    const masterRows = xlsx.utils.sheet_to_json<Row>(masterSource.sheet, { range: masterSource.headerRowIndex, defval: "", raw: false })
    const addressRows = workbook.Sheets.Address
      ? xlsx.utils.sheet_to_json<Row>(workbook.Sheets.Address, { range: 1, defval: "", raw: false })
      : []
    const addressById = new Map<string, Row>()
    for (const row of addressRows) {
      const id = value(row, "ID")
      if (id) addressById.set(id, row)
    }

    const rawRows = masterRows.filter(row => value(row, "Customer ID"))
    if (!rawRows.length) return NextResponse.json({ error: "Tiada rekod Customer ID ditemui dalam tab Master." }, { status: 400 })

    // Deduplicate within the file keeping the latest entry to prevent PostgreSQL ON CONFLICT row locking collision
    const uniqueMap = new Map<string, Row>()
    for (const row of rawRows) {
      const code = value(row, "Customer ID")
      if (code) uniqueMap.set(code, row)
    }
    const rows = Array.from(uniqueMap.values())

    // Fetch existing customer codes in 1 quick query upfront
    const existingRecords = await prisma.customer.findMany({ select: { customerCode: true } })
    const existingSet = new Set(existingRecords.map(c => c.customerCode))

    let created = 0
    let updated = 0
    let needsReview = 0
    const batchSize = 100

    for (let start = 0; start < rows.length; start += batchSize) {
      const batch = rows.slice(start, start + batchSize)

      const customerValues = batch.map(row => {
        const customerCode = value(row, "Customer ID")
        const sourceAddress: Row = addressById.get(customerCode) || {}
        const legalName = cleanOptional(value(row, "Description(1)")) || customerCode
        const creditTermsRaw = cleanOptional(value(row, "CT") || value(sourceAddress, "CT"))
        const credit = parseCreditTerms(creditTermsRaw || "")
        const status = legalName === customerCode ? "NEEDS_REVIEW" : "READY"
        if (status === "NEEDS_REVIEW") needsReview++

        if (existingSet.has(customerCode)) {
          updated++
        } else {
          created++
          existingSet.add(customerCode)
        }

        const id = randomUUID()

        return {
          row,
          customerCode,
          sourceAddress,
          sql: Prisma.sql`(
            ${id},
            ${customerCode},
            ${cleanOptional(value(row, "SageID"))},
            ${legalName},
            ${cleanOptional(value(row, "Description(2)"))},
            ${cleanOptional(value(row, "PIC") || value(sourceAddress, "PIC"))},
            ${cleanOptional(value(row, "Email Address (only 1 is required for eInvoice)"))},
            ${cleanOptional(value(row, "Phone No.(1) - required format -no dash, no spacing,no extension code or text (example '017396624)") || value(sourceAddress, "Phone No.(1)"))},
            ${cleanOptional(value(row, "Phone No.(2)") || value(sourceAddress, "Phone No.(2)"))},
            ${cleanOptional(value(row, "NewType") || value(row, "Type") || value(sourceAddress, "Type"))},
            ${cleanOptional(value(row, "Subtype") || value(sourceAddress, "Subtype"))},
            ${cleanOptional(value(row, "Category Code"))},
            ${cleanOptional(value(sourceAddress, "Zone"))},
            ${cleanOptional(value(row, "Region") || value(sourceAddress, "State2"))},
            ${creditTermsRaw},
            ${credit.days},
            ${credit.policy},
            ${cleanOptional(value(row, "SALES REP 1"))},
            ${cleanOptional(value(row, "SALES REP 2"))},
            ${cleanOptional(value(row, "Company Registration No (New)/NRIC/Passport/Army No"))},
            ${cleanOptional(value(row, "TIN Number"))},
            ${cleanOptional(value(row, "SST Number (If applicable)"))},
            ${status},
            ${JSON.stringify(row)}::jsonb,
            NOW(),
            NOW()
          )`
        }
      })

      // Multi-row high-performance PostgreSQL upsert (1 query per 100 rows, avoids transaction timeout)
      const upserted: Array<{ id: string, customerCode: string }> = await prisma.$queryRaw`
        INSERT INTO "Customer" (
          "id", "customerCode", "sageCustomerId", "legalName", "tradingName", "pic", "email",
          "phonePrimary", "phoneSecondary", "customerType", "customerSubtype", "categoryCode",
          "zone", "region", "creditTermsRaw", "creditTermDays", "paymentPolicy", "salesRep1", "salesRep2",
          "companyRegistrationNo", "tinNo", "sstNo", "importStatus", "sourceData", "createdAt", "updatedAt"
        )
        VALUES ${Prisma.join(customerValues.map(c => c.sql))}
        ON CONFLICT ("customerCode") DO UPDATE SET
          "sageCustomerId" = EXCLUDED."sageCustomerId",
          "legalName" = EXCLUDED."legalName",
          "tradingName" = EXCLUDED."tradingName",
          "pic" = EXCLUDED."pic",
          "email" = EXCLUDED."email",
          "phonePrimary" = EXCLUDED."phonePrimary",
          "phoneSecondary" = EXCLUDED."phoneSecondary",
          "customerType" = EXCLUDED."customerType",
          "customerSubtype" = EXCLUDED."customerSubtype",
          "categoryCode" = EXCLUDED."categoryCode",
          "zone" = EXCLUDED."zone",
          "region" = EXCLUDED."region",
          "creditTermsRaw" = EXCLUDED."creditTermsRaw",
          "creditTermDays" = EXCLUDED."creditTermDays",
          "paymentPolicy" = EXCLUDED."paymentPolicy",
          "salesRep1" = EXCLUDED."salesRep1",
          "salesRep2" = EXCLUDED."salesRep2",
          "companyRegistrationNo" = EXCLUDED."companyRegistrationNo",
          "tinNo" = EXCLUDED."tinNo",
          "sstNo" = EXCLUDED."sstNo",
          "importStatus" = EXCLUDED."importStatus",
          "sourceData" = EXCLUDED."sourceData",
          "updatedAt" = NOW()
        RETURNING "id", "customerCode"
      `

      const custIdMap = new Map(upserted.map(c => [c.customerCode, c.id]))

      const addressValues = customerValues.map(({ row, customerCode, sourceAddress }) => {
        const customerId = custIdMap.get(customerCode)!
        const addrId = randomUUID()
        const rawFullAddr = cleanOptional(value(row, "Full Address") || value(sourceAddress, "Full Address"))
        const fullAddress = rawFullAddr || [
          cleanOptional(value(row, "Address Line 1 (30 char)") || value(sourceAddress, "Address")),
          cleanOptional(value(row, "Address Line 2 (30 char)") || value(sourceAddress, "Street")),
          cleanOptional(value(row, "Address Line 3 (30 char)") || value(sourceAddress, "City")),
          cleanOptional(value(row, "Postal Code")),
          cleanOptional(value(row, "City")),
          cleanOptional(value(sourceAddress, "State2")),
          cleanOptional(value(row, "Country")) || "MALAYSIA",
        ].filter(Boolean).join(", ") || null

        return Prisma.sql`(
          ${addrId},
          ${customerId},
          'Master Address',
          'BILLING',
          ${cleanOptional(value(row, "PIC") || value(sourceAddress, "PIC"))},
          ${cleanOptional(value(row, "Phone No.(1) - required format -no dash, no spacing,no extension code or text (example '017396624)") || value(sourceAddress, "Phone No.(1)"))},
          ${cleanOptional(value(row, "Address Line 1 (30 char)") || value(sourceAddress, "Address"))},
          ${cleanOptional(value(row, "Address Line 2 (30 char)") || value(sourceAddress, "Street"))},
          ${cleanOptional(value(row, "Address Line 3 (30 char)") || value(sourceAddress, "City"))},
          ${cleanOptional(value(row, "City"))},
          ${cleanOptional(value(sourceAddress, "State2"))},
          ${cleanOptional(value(row, "Postal Code"))},
          ${cleanOptional(value(row, "Country")) || "MALAYSIA"},
          ${fullAddress},
          true,
          true,
          ${customerCode},
          NOW(),
          NOW()
        )`
      })

      // Multi-row high-performance address upsert
      await prisma.$executeRaw`
        INSERT INTO "CustomerAddress" (
          "id", "customerId", "label", "addressType", "attentionTo", "phone",
          "addressLine1", "addressLine2", "addressLine3", "city", "state", "postcode",
          "country", "fullAddress", "isDefaultBilling", "isDefaultDelivery",
          "sourceRowReference", "createdAt", "updatedAt"
        )
        VALUES ${Prisma.join(addressValues)}
        ON CONFLICT ("customerId", "label") DO UPDATE SET
          "attentionTo" = EXCLUDED."attentionTo",
          "phone" = EXCLUDED."phone",
          "addressLine1" = EXCLUDED."addressLine1",
          "addressLine2" = EXCLUDED."addressLine2",
          "addressLine3" = EXCLUDED."addressLine3",
          "city" = EXCLUDED."city",
          "state" = EXCLUDED."state",
          "postcode" = EXCLUDED."postcode",
          "country" = EXCLUDED."country",
          "fullAddress" = EXCLUDED."fullAddress",
          "updatedAt" = NOW()
      `
    }

    await prisma.auditLog.create({
      data: {
        userId: access.userId,
        userName: access.name || "Sales Ordering User",
        action: "CUSTOMER_MASTER_IMPORTED",
        details: JSON.stringify({ fileName: file.name, total: rows.length, created, updated, needsReview }),
      },
    })

    return NextResponse.json({ success: true, sheetName: masterSource.sheetName, total: rows.length, created, updated, needsReview })
  } catch (error) {
    console.error("Customer master import error", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Customer Master import failed." }, { status: 500 })
  }
}
