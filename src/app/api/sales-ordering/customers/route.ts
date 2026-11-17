export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  canAccessSalesOrderingTab,
  canManageSalesOrderingCustomers,
  getSalesOrderingAccess,
} from "@/lib/sales-ordering/access"
import {
  computeIfContainsPostcode,
  composeFullAddress,
  sanitizePhoneNumber,
} from "@/lib/sales-ordering/customer-excel-schema"
import { Prisma } from "@prisma/client"

function parseCreditTerms(raw: string) {
  const normal = raw.trim().toUpperCase()
  const dayMatch = normal.match(/^(\d{1,3})(?:\s*DAYS?)?$/)
  if (dayMatch) return { days: Number(dayMatch[1]), policy: "CREDIT" }
  if (normal.includes("DEPOSIT")) return { days: null, policy: "DEPOSIT" }
  if (normal === "CASH") return { days: null, policy: "CASH" }
  if (normal === "COD") return { days: null, policy: "COD" }
  return { days: null, policy: normal ? "OTHER" : null }
}

async function generateNextCustomerCode(tx: Prisma.TransactionClient): Promise<string> {
  const existing = await tx.customer.findMany({
    where: { customerCode: { startsWith: "3000/" } },
    select: { customerCode: true },
  })

  let maxNum = 0
  for (const c of existing) {
    const raw = c.customerCode.replace("3000/", "").trim()
    const parsed = parseInt(raw, 10)
    if (!isNaN(parsed) && parsed > maxNum) {
      maxNum = parsed
    }
  }

  let nextNum = maxNum + 1
  let candidate = nextNum < 1000
    ? `3000/${String(nextNum).padStart(3, "0")}`
    : `3000/${nextNum}`

  // Guard against any concurrent collisions
  let attempts = 0
  while (attempts < 20) {
    const found = await tx.customer.findUnique({
      where: { customerCode: candidate },
      select: { id: true },
    })
    if (!found) return candidate
    nextNum++
    candidate = nextNum < 1000
      ? `3000/${String(nextNum).padStart(3, "0")}`
      : `3000/${nextNum}`
    attempts++
  }

  return candidate
}

export async function GET(request: Request) {
  const access = await getSalesOrderingAccess()
  if (
    !access ||
    (!canAccessSalesOrderingTab(access, "intake") &&
      !canAccessSalesOrderingTab(access, "customers"))
  ) {
    return NextResponse.json(
      { error: "Akses AI Intake atau Customers diperlukan." },
      { status: 403 }
    )
  }

  const query = new URL(request.url).searchParams.get("q")?.trim() || ""
  const customers = await prisma.customer.findMany({
    where: query
      ? {
          OR: [
            { customerCode: { contains: query, mode: "insensitive" } },
            { sageCustomerId: { contains: query, mode: "insensitive" } },
            { legalName: { contains: query, mode: "insensitive" } },
            { tradingName: { contains: query, mode: "insensitive" } },
          ],
        }
      : undefined,
    select: {
      id: true,
      customerCode: true,
      sageCustomerId: true,
      legalName: true,
      tradingName: true,
      creditTermsRaw: true,
      zone: true,
    },
    orderBy: { legalName: "asc" },
    take: 20,
  })
  return NextResponse.json({ customers })
}

export async function POST(request: Request) {
  const access = await getSalesOrderingAccess()
  if (
    !access ||
    !canAccessSalesOrderingTab(access, "customers") ||
    !canManageSalesOrderingCustomers(access)
  ) {
    return NextResponse.json(
      { error: "Permission denied. Customer management access required." },
      { status: 403 }
    )
  }

  try {
    const body = await request.json().catch(() => ({}))

    const rawCustomerId = String(body["Customer ID"] || body.customerId || body.customerCode || "").trim()
    const description1 = String(body["Description(1)"] || body.description1 || body.legalName || "").trim()
    const description2 = String(body["Description(2)"] || body.description2 || body.tradingName || "").trim()
    const pic = String(body["PIC"] || body.pic || "").trim()
    let fullAddress = String(body["Full Address"] || body.fullAddress || "").trim()
    const addressLine1 = String(body["Address Line 1 (30 char)"] || body.addressLine1 || "").trim().slice(0, 30)
    const addressLine2 = String(body["Address Line 2 (30 char)"] || body.addressLine2 || "").trim().slice(0, 30)
    const addressLine3 = String(body["Address Line 3 (30 char)"] || body.addressLine3 || "").trim().slice(0, 30)
    const city = String(body["City"] || body.city || "").trim()
    const postalCode = String(body["Postal Code"] || body.postalCode || body.postcode || "").trim()
    const country = String(body["Country"] || body.country || "MALAYSIA").trim()
    const companyRegNo = String(body["Company Registration No (New)/NRIC/Passport/Army No"] || body.companyRegistrationNo || "").trim()
    const tinNumber = String(body["TIN Number"] || body.tinNo || "").trim()
    const sstNumber = String(body["SST Number (If applicable)"] || body.sstNo || "").trim()
    const customerMiscCode = String(body["Customer Misc Code"] || body.customerMiscCode || "").trim()
    const emailAddress = String(body["Email Address (only 1 is required for eInvoice)"] || body.email || "").trim()
    const rawPhone1 = String(body["Phone No.(1) - required format -no dash, no spacing,no extension code or text (example '017396624)"] || body.phone1 || body.phonePrimary || "").trim()
    const rawPhone2 = String(body["Phone No.(2)"] || body.phone2 || body.phoneSecondary || "").trim()
    const salesRep1 = String(body["SALES REP 1"] || body.salesRep1 || "").trim()
    const salesRep2 = String(body["SALES REP 2"] || body.salesRep2 || "").trim()
    const typeVal = String(body["Type"] || body.type || "").trim()
    const ct = String(body["CT"] || body.ct || body.creditTermsRaw || "").trim()
    const categoryCode = String(body["Category Code"] || body.categoryCode || "").trim()
    const newType = String(body["NewType"] || body.newType || "").trim()
    const codeId = String(body["CodeID"] || body.codeId || "").trim()
    const sageId = String(body["SageID"] || body.sageId || body.sageCustomerId || "").trim()
    const subtype = String(body["Subtype"] || body.subtype || body.customerSubtype || "").trim()
    const region = String(body["Region"] || body.region || "").trim()
    const remark = String(body["REMARK"] || body.remark || "").trim()

    // Validate required fields: Description(1) is strictly required
    if (!description1) {
      return NextResponse.json({ error: "Description(1) / Customer Name is required." }, { status: 400 })
    }

    // Auto-sanitizations and auto-computations
    const phone1 = sanitizePhoneNumber(rawPhone1)
    const phone2 = sanitizePhoneNumber(rawPhone2)
    const ifContainsPostcode = computeIfContainsPostcode(postalCode)

    if (!fullAddress) {
      fullAddress = composeFullAddress({
        addressLine1,
        addressLine2,
        addressLine3,
        postalCode,
        city,
        country,
      })
    }

    const credit = parseCreditTerms(ct)
    const customerType = newType || typeVal || null

    const newCustomer = await prisma.$transaction(async (tx) => {
      // Auto-generate customerCode if not explicitly supplied
      let finalCustomerId = rawCustomerId
      if (!finalCustomerId) {
        finalCustomerId = await generateNextCustomerCode(tx)
      } else {
        // If provided, verify no duplicate exists
        const existing = await tx.customer.findUnique({
          where: { customerCode: finalCustomerId },
          select: { id: true },
        })
        if (existing) {
          throw new Error(`CUSTOMER_EXISTS:${finalCustomerId}`)
        }
      }

      // Construct exact 30-key sourceData object
      const sourceData: Record<string, string> = {
        "Customer ID": finalCustomerId,
        "Description(1)": description1,
        "Description(2)": description2,
        "PIC": pic,
        "Full Address": fullAddress,
        "Address Line 1 (30 char)": addressLine1,
        "Address Line 2 (30 char)": addressLine2,
        "Address Line 3 (30 char)": addressLine3,
        "IF CONTAINS POSTCODE": ifContainsPostcode,
        "City": city,
        "Postal Code": postalCode,
        "Country": country,
        "Company Registration No (New)/NRIC/Passport/Army No": companyRegNo,
        "TIN Number": tinNumber,
        "SST Number (If applicable)": sstNumber,
        "Customer Misc Code": customerMiscCode,
        "Email Address (only 1 is required for eInvoice)": emailAddress,
        "Phone No.(1) - required format -no dash, no spacing,no extension code or text (example '017396624)": phone1,
        "SALES REP 1": salesRep1,
        "SALES REP 2": salesRep2,
        "Phone No.(2)": phone2,
        "Type": typeVal,
        "CT": ct,
        "Category Code": categoryCode,
        "NewType": newType,
        "CodeID": codeId,
        "SageID": sageId,
        "Subtype": subtype,
        "Region": region,
        "REMARK": remark,
      }

      const created = await tx.customer.create({
        data: {
          customerCode: finalCustomerId,
          sageCustomerId: sageId || null,
          legalName: description1,
          tradingName: description2 || null,
          pic: pic || null,
          email: emailAddress || null,
          phonePrimary: phone1 || null,
          phoneSecondary: phone2 || null,
          customerType,
          customerSubtype: subtype || null,
          categoryCode: categoryCode || null,
          region: region || null,
          creditTermsRaw: ct || null,
          creditTermDays: credit.days,
          paymentPolicy: credit.policy,
          salesRep1: salesRep1 || null,
          salesRep2: salesRep2 || null,
          companyRegistrationNo: companyRegNo || null,
          tinNo: tinNumber || null,
          sstNo: sstNumber || null,
          importStatus: "READY",
          sourceData: sourceData as Prisma.InputJsonValue,
        },
      })

      // Create primary Master Address
      await tx.customerAddress.create({
        data: {
          customerId: created.id,
          label: "Master Address",
          addressType: "BILLING",
          attentionTo: pic || null,
          phone: phone1 || null,
          addressLine1: addressLine1 || null,
          addressLine2: addressLine2 || null,
          addressLine3: addressLine3 || null,
          city: city || null,
          state: region || null,
          postcode: postalCode || null,
          country: country || "MALAYSIA",
          fullAddress: fullAddress || null,
          isDefaultBilling: true,
          isDefaultDelivery: true,
          sourceRowReference: finalCustomerId,
        },
      })

      // Log to AuditLog
      await tx.auditLog.create({
        data: {
          userId: access.userId,
          userName: access.name || "Sales Ordering Staff",
          action: "CUSTOMER_CREATED_MANUALLY",
          details: JSON.stringify({
            customerId: created.id,
            customerCode: finalCustomerId,
            legalName: description1,
            sageId: sageId || null,
          }),
        },
      })

      return created
    })

    return NextResponse.json({ success: true, customer: newCustomer }, { status: 201 })
  } catch (err: any) {
    if (err?.message?.startsWith("CUSTOMER_EXISTS:")) {
      const code = err.message.replace("CUSTOMER_EXISTS:", "")
      return NextResponse.json(
        { error: `Customer ID "${code}" already exists in the system.` },
        { status: 409 }
      )
    }
    console.error("Manual add customer error:", err)
    return NextResponse.json(
      { error: err?.message || "Internal server error occurred." },
      { status: 500 }
    )
  }
}
