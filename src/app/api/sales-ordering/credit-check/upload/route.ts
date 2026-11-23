export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { canAccessSalesOrderingTab, getSalesOrderingAccess } from "@/lib/sales-ordering/access"
import { putR2Object, safePdfName } from "@/lib/sales-ordering/r2"
import type { CheckMode } from "@/lib/sales-ordering/decision-engine"

export const runtime = "nodejs"
export const maxDuration = 60

const MAX_SIZE = 20 * 1024 * 1024

export async function POST(request: Request) {
  const access = await getSalesOrderingAccess()
  if (!access || (!canAccessSalesOrderingTab(access, "creditCheck") && !canAccessSalesOrderingTab(access, "intake"))) {
    return NextResponse.json({ error: "PO-SOA Check access required." }, { status: 403 })
  }

  try {
    const formData = await request.formData()
    const checkModeRaw = formData.get("checkMode") as string | null
    const checkMode: CheckMode = checkModeRaw === "INVOICE_SOA_RECONCILIATION" ? "INVOICE_SOA_RECONCILIATION" : "PO_CREDIT_CHECK"
    const existingCaseId = (formData.get("existingCaseId") as string | null)?.trim()

    const soaFile = formData.get("soa") as File | null
    const poFile = formData.get("po") as File | null

    const isValidPdf = (f: File | null) => Boolean(f && f.name.toLowerCase().endsWith(".pdf") && f.size > 0 && f.size <= MAX_SIZE)

    if (existingCaseId) {
      if (!isValidPdf(soaFile)) {
        return NextResponse.json({ error: "Upload one valid SOA PDF (maximum 20 MB)." }, { status: 400 })
      }

      const existing = await prisma.creditCheckCase.findUnique({ where: { id: existingCaseId } })
      if (!existing) return NextResponse.json({ error: "PO-SOA Check record not found." }, { status: 404 })

      const prefix = `sales-order-credit-check/${new Date().getUTCFullYear()}/${existing.id}`
      const soaR2ObjectKey = `${prefix}/soa-${safePdfName(soaFile!.name)}`

      const soaBuffer = Buffer.from(await soaFile!.arrayBuffer())
      await putR2Object(soaR2ObjectKey, soaBuffer, "application/pdf")

      await prisma.creditCheckCase.update({
        where: { id: existing.id },
        data: {
          soaFileName: soaFile!.name,
          soaR2ObjectKey,
          result: { ...(existing.result as any || {}), checkMode },
        },
      })

      return NextResponse.json({ id: existing.id })
    }

    if (!isValidPdf(poFile) || !isValidPdf(soaFile)) {
      return NextResponse.json({ error: "Upload one valid PO/Invoice PDF and one SOA PDF (maximum 20 MB each)." }, { status: 400 })
    }

    const id = crypto.randomUUID()
    const prefix = `sales-order-credit-check/${new Date().getUTCFullYear()}/${id}`
    const poR2ObjectKey = `${prefix}/po-${safePdfName(poFile!.name)}`
    const soaR2ObjectKey = `${prefix}/soa-${safePdfName(soaFile!.name)}`

    const [poBuffer, soaBuffer] = await Promise.all([
      poFile!.arrayBuffer().then(b => Buffer.from(b)),
      soaFile!.arrayBuffer().then(b => Buffer.from(b)),
    ])

    await Promise.all([
      putR2Object(poR2ObjectKey, poBuffer, "application/pdf"),
      putR2Object(soaR2ObjectKey, soaBuffer, "application/pdf"),
    ])

    await prisma.creditCheckCase.create({
      data: {
        id,
        poFileName: poFile!.name,
        poR2ObjectKey,
        soaFileName: soaFile!.name,
        soaR2ObjectKey,
        uploadedById: access.userId,
        result: { checkMode },
      },
    })

    return NextResponse.json({ id })
  } catch (error) {
    console.error("Credit check direct upload error", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload files to storage." },
      { status: 500 }
    )
  }
}
