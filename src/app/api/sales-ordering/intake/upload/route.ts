export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { canAccessSalesOrderingTab, getSalesOrderingAccess } from "@/lib/sales-ordering/access"
import { putR2Object, safePdfName } from "@/lib/sales-ordering/r2"

export const runtime = "nodejs"
export const maxDuration = 60

const MAX_PDF_SIZE = 20 * 1024 * 1024

export async function POST(request: Request) {
  const access = await getSalesOrderingAccess()
  if (!access || !canAccessSalesOrderingTab(access, "intake")) {
    return NextResponse.json({ error: "AI Intake access required." }, { status: 403 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No PDF file provided." }, { status: 400 })
    }

    const fileName = file.name.trim()
    const fileSize = file.size
    const mimeType = file.type || "application/pdf"

    if (!fileName.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Only PDF files are allowed." }, { status: 400 })
    }

    if (!fileSize || fileSize > MAX_PDF_SIZE) {
      return NextResponse.json({ error: "PDF size must be between 1 byte and 20 MB." }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const intakeId = crypto.randomUUID()
    const now = new Date()
    const objectKey = `sales-order-intake/pending/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${intakeId}-${safePdfName(fileName)}`

    // Upload directly from server to Cloudflare R2 (bypasses browser CORS completely)
    await putR2Object(objectKey, buffer, "application/pdf")

    // Record in database
    await prisma.salesDocumentIntake.create({
      data: {
        id: intakeId,
        fileName,
        fileSize,
        mimeType,
        r2ObjectKey: objectKey,
        uploadedById: access.userId,
      },
    })

    return NextResponse.json({ intakeId, objectKey })
  } catch (error) {
    console.error("Sales intake direct upload error", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload document to storage." },
      { status: 500 }
    )
  }
}
