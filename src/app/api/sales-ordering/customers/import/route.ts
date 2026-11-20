export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import * as xlsx from "xlsx"
import { Prisma } from "@prisma/client"
import { randomUUID } from "crypto"
import { prisma } from "@/lib/prisma"
import { canAccessSalesOrderingTab, canManageSalesOrderingCustomers, getSalesOrderingAccess } from "@/lib/sales-ordering/access"
import { parseCustomerWorkbook, ParsedCustomerRecord } from "@/lib/sales-ordering/smart-customer-reader"

export const runtime = "nodejs"
export const maxDuration = 300

export async function POST(request: Request) {
  const access = await getSalesOrderingAccess()
  if (!access || !canAccessSalesOrderingTab(access, "customers") || !canManageSalesOrderingCustomers(access)) {
    return NextResponse.json({ error: "Akses import Customer Master diperlukan." }, { status: 403 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file")
    if (!(file instanceof File)) return NextResponse.json({ error: "Fail Excel diperlukan." }, { status: 400 })
    if (!/\.xlsx?$/i.test(file.name)) return NextResponse.json({ error: "Hanya fail format .xlsx atau .xls sahaja dibenarkan." }, { status: 400 })
    if (file.size > 25 * 1024 * 1024) return NextResponse.json({ error: "Saiz fail melebihi had 25 MB." }, { status: 400 })

    const workbook = xlsx.read(Buffer.from(await file.arrayBuffer()), { type: "buffer", cellDates: true })

    // Determine the next starting sequential customer code
    const existingCodes = await prisma.customer.findMany({
      where: { customerCode: { startsWith: "3000/" } },
      select: { customerCode: true },
    })
    let maxNum = 0
    for (const c of existingCodes) {
      const num = parseInt(c.customerCode.replace("3000/", "").trim(), 10)
      if (!isNaN(num) && num > maxNum) maxNum = num
    }
    const nextStartingCode = maxNum + 1

    // Smart Reader: Automatically detects headers across single or multi-sheet workbooks
    const parseResult = parseCustomerWorkbook(workbook, nextStartingCode)
    const { records, summary } = parseResult

    if (!records.length) {
      return NextResponse.json({
        error: "Tiada rekod pelanggan sah dapat dibaca dari fail Excel ini. Sila semak tajuk lajur (Nama/Company/Customer).",
      }, { status: 400 })
    }

    // Pre-fetch all existing customer codes from DB in 1 query
    const allExisting = await prisma.customer.findMany({ select: { customerCode: true } })
    const existingSet = new Set(allExisting.map(c => c.customerCode))

    let created = 0
    let updated = 0
    let needsReview = 0
    const batchSize = 100

    for (let start = 0; start < records.length; start += batchSize) {
      const batch = records.slice(start, start + batchSize)

      const customerValues = batch.map(rec => {
        const isExisting = existingSet.has(rec.customerCode)
        if (isExisting) {
          updated++
        } else {
          created++
          existingSet.add(rec.customerCode)
        }

        if (rec.importStatus === "NEEDS_REVIEW") {
          needsReview++
        }

        const id = randomUUID()

        return {
          rec,
          sql: Prisma.sql`(
            ${id},
            ${rec.customerCode},
            ${rec.sageCustomerId},
            ${rec.legalName},
            ${rec.tradingName},
            ${rec.pic},
            ${rec.email},
            ${rec.phonePrimary},
            ${rec.phoneSecondary},
            ${rec.customerType},
            ${rec.customerSubtype},
            ${rec.categoryCode},
            ${rec.zone},
            ${rec.region},
            ${rec.creditTermsRaw},
            ${rec.creditTermDays},
            ${rec.paymentPolicy},
            ${rec.salesRep1},
            ${rec.salesRep2},
            ${rec.companyRegistrationNo},
            ${rec.tinNo},
            ${rec.sstNo},
            ${rec.importStatus},
            ${JSON.stringify(rec.sourceData)}::jsonb,
            NOW(),
            NOW()
          )`
        }
      })

      // Multi-row high-performance PostgreSQL upsert
      const upserted: Array<{ id: string, customerCode: string }> = await prisma.$queryRaw`
        INSERT INTO "Customer" (
          "id", "customerCode", "sageCustomerId", "legalName", "tradingName", "pic", "email",
          "phonePrimary", "phoneSecondary", "customerType", "customerSubtype", "categoryCode",
          "zone", "region", "creditTermsRaw", "creditTermDays", "paymentPolicy", "salesRep1", "salesRep2",
          "companyRegistrationNo", "tinNo", "sstNo", "importStatus", "sourceData", "createdAt", "updatedAt"
        )
        VALUES ${Prisma.join(customerValues.map(c => c.sql))}
        ON CONFLICT ("customerCode") DO UPDATE SET
          "sageCustomerId" = COALESCE(EXCLUDED."sageCustomerId", "Customer"."sageCustomerId"),
          "legalName" = EXCLUDED."legalName",
          "tradingName" = COALESCE(EXCLUDED."tradingName", "Customer"."tradingName"),
          "pic" = COALESCE(EXCLUDED."pic", "Customer"."pic"),
          "email" = COALESCE(EXCLUDED."email", "Customer"."email"),
          "phonePrimary" = COALESCE(EXCLUDED."phonePrimary", "Customer"."phonePrimary"),
          "phoneSecondary" = COALESCE(EXCLUDED."phoneSecondary", "Customer"."phoneSecondary"),
          "customerType" = COALESCE(EXCLUDED."customerType", "Customer"."customerType"),
          "customerSubtype" = COALESCE(EXCLUDED."customerSubtype", "Customer"."customerSubtype"),
          "categoryCode" = COALESCE(EXCLUDED."categoryCode", "Customer"."categoryCode"),
          "zone" = COALESCE(EXCLUDED."zone", "Customer"."zone"),
          "region" = COALESCE(EXCLUDED."region", "Customer"."region"),
          "creditTermsRaw" = COALESCE(EXCLUDED."creditTermsRaw", "Customer"."creditTermsRaw"),
          "creditTermDays" = COALESCE(EXCLUDED."creditTermDays", "Customer"."creditTermDays"),
          "paymentPolicy" = COALESCE(EXCLUDED."paymentPolicy", "Customer"."paymentPolicy"),
          "salesRep1" = COALESCE(EXCLUDED."salesRep1", "Customer"."salesRep1"),
          "salesRep2" = COALESCE(EXCLUDED."salesRep2", "Customer"."salesRep2"),
          "companyRegistrationNo" = COALESCE(EXCLUDED."companyRegistrationNo", "Customer"."companyRegistrationNo"),
          "tinNo" = COALESCE(EXCLUDED."tinNo", "Customer"."tinNo"),
          "sstNo" = COALESCE(EXCLUDED."sstNo", "Customer"."sstNo"),
          "importStatus" = EXCLUDED."importStatus",
          "sourceData" = EXCLUDED."sourceData",
          "updatedAt" = NOW()
        RETURNING "id", "customerCode"
      `

      const custIdMap = new Map(upserted.map(c => [c.customerCode, c.id]))

      const addressValues = customerValues.map(({ rec }) => {
        const customerId = custIdMap.get(rec.customerCode)!
        const addrId = randomUUID()

        return Prisma.sql`(
          ${addrId},
          ${customerId},
          'Master Address',
          'BILLING',
          ${rec.pic},
          ${rec.phonePrimary},
          ${rec.addressLine1},
          ${rec.addressLine2},
          ${rec.addressLine3},
          ${rec.city},
          ${rec.state},
          ${rec.postcode},
          ${rec.country || 'MALAYSIA'},
          ${rec.fullAddress},
          true,
          true,
          ${rec.customerCode},
          NOW(),
          NOW()
        )`
      })

      // Multi-row address upsert
      await prisma.$executeRaw`
        INSERT INTO "CustomerAddress" (
          "id", "customerId", "label", "addressType", "attentionTo", "phone",
          "addressLine1", "addressLine2", "addressLine3", "city", "state", "postcode",
          "country", "fullAddress", "isDefaultBilling", "isDefaultDelivery",
          "sourceRowReference", "createdAt", "updatedAt"
        )
        VALUES ${Prisma.join(addressValues)}
        ON CONFLICT ("customerId", "label") DO UPDATE SET
          "attentionTo" = COALESCE(EXCLUDED."attentionTo", "CustomerAddress"."attentionTo"),
          "phone" = COALESCE(EXCLUDED."phone", "CustomerAddress"."phone"),
          "addressLine1" = COALESCE(EXCLUDED."addressLine1", "CustomerAddress"."addressLine1"),
          "addressLine2" = COALESCE(EXCLUDED."addressLine2", "CustomerAddress"."addressLine2"),
          "addressLine3" = COALESCE(EXCLUDED."addressLine3", "CustomerAddress"."addressLine3"),
          "city" = COALESCE(EXCLUDED."city", "CustomerAddress"."city"),
          "state" = COALESCE(EXCLUDED."state", "CustomerAddress"."state"),
          "postcode" = COALESCE(EXCLUDED."postcode", "CustomerAddress"."postcode"),
          "country" = COALESCE(EXCLUDED."country", "CustomerAddress"."country"),
          "fullAddress" = COALESCE(EXCLUDED."fullAddress", "CustomerAddress"."fullAddress"),
          "updatedAt" = NOW()
      `
    }

    await prisma.auditLog.create({
      data: {
        userId: access.userId,
        userName: access.name || "Sales Ordering User",
        action: "CUSTOMER_MASTER_SMART_IMPORTED",
        details: JSON.stringify({
          fileName: file.name,
          total: records.length,
          created,
          updated,
          needsReview,
          parsedSheets: summary.parsedSheets,
          regularCount: summary.regularCount,
        }),
      },
    })

    return NextResponse.json({
      success: true,
      total: records.length,
      created,
      updated,
      needsReview,
      parsedSheets: summary.parsedSheets,
      regularCount: summary.regularCount,
      message: `${records.length} pelanggan berjaya diimport daripada ${summary.parsedSheets.join(", ")} (${created} baharu, ${updated} dikemaskini).`,
    })
  } catch (error) {
    console.error("Customer master smart import error:", error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Gagal mengimport data pelanggan.",
    }, { status: 500 })
  }
}
