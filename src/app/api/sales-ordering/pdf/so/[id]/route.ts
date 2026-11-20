export const dynamic = "force-dynamic"

import { renderToStream } from "@react-pdf/renderer"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { SalesOrderPdfDocument, type SalesOrderPdfData } from "@/lib/pdf/SalesOrderPdfDocument"

export const runtime = "nodejs"

function safeFilename(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "SO"
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const download = request.nextUrl.searchParams.get("download") === "true"

    let order = await prisma.salesOrder.findUnique({
      where: { id },
      include: {
        customer: {
          include: {
            addresses: true,
          },
        },
        items: true,
        createdBy: {
          select: { name: true },
        },
      },
    })

    if (!order) {
      order = await prisma.salesOrder.findFirst({
        where: { internalSoNo: id },
        include: {
          customer: {
            include: {
              addresses: true,
            },
          },
          items: true,
          createdBy: {
            select: { name: true },
          },
        },
      })
    }

    if (!order) {
      return new NextResponse("Sales Order not found", { status: 404 })
    }

    const logoPath = path.join(process.cwd(), "public", "assets", "LWI_Logo.png")
    let logoSource: string | undefined = undefined
    try {
      const logoBuffer = await readFile(logoPath)
      logoSource = `data:image/png;base64,${logoBuffer.toString("base64")}`
    } catch (e) {
      console.warn("Could not load LWI logo for PDF:", e)
    }

    const pdfData: SalesOrderPdfData = {
      id: order.id,
      internalSoNo: order.internalSoNo,
      sageSalesOrderNo: order.sageSalesOrderNo,
      poNumber: order.poNumber,
      customerDocumentNo: order.customerDocumentNo,
      orderDate: order.orderDate,
      requestedDeliveryDate: order.requestedDeliveryDate,
      paymentTermsSnapshot: order.paymentTermsSnapshot,
      billingAddressSnapshot: order.billingAddressSnapshot,
      deliveryAddressSnapshot: order.deliveryAddressSnapshot,
      deliveryContactSnapshot: order.deliveryContactSnapshot,
      deliveryPhoneSnapshot: order.deliveryPhoneSnapshot,
      currency: order.currency,
      subtotal: Number(order.subtotal),
      discountTotal: Number(order.discountTotal),
      freightTotal: Number(order.freightTotal),
      taxTotal: Number(order.taxTotal),
      grandTotal: Number(order.grandTotal),
      orderRemarks: order.orderRemarks,
      status: order.status,
      createdAt: order.createdAt,
      customer: {
        customerCode: order.customer.customerCode,
        legalName: order.customer.legalName,
        pic: order.customer.pic,
        phonePrimary: order.customer.phonePrimary,
        email: order.customer.email,
        addresses: order.customer.addresses.map((a) => ({
          fullAddress: a.fullAddress,
          attentionTo: a.attentionTo,
          phone: a.phone,
          isDefaultDelivery: a.isDefaultDelivery,
          isDefaultBilling: a.isDefaultBilling,
        })),
      },
      createdBy: {
        name: order.createdBy?.name || "Operations Team",
      },
      items: order.items.map((item) => ({
        id: item.id,
        sku: item.sku,
        itemCodeSnapshot: item.itemCodeSnapshot,
        descriptionSnapshot: item.descriptionSnapshot,
        uom: item.uom,
        qtyOrdered: Number(item.qtyOrdered),
        unitPrice: Number(item.unitPrice),
        discountAmount: Number(item.discountAmount),
        taxAmount: Number(item.taxAmount),
        lineTotal: Number(item.lineTotal),
        remarks: item.remarks,
      })),
    }

    const pdfStream = await renderToStream(
      SalesOrderPdfDocument({
        data: pdfData,
        logoSource,
      })
    )

    const readableStream = new ReadableStream({
      start(controller) {
        pdfStream.on("data", (chunk: Uint8Array) => controller.enqueue(chunk))
        pdfStream.on("end", () => controller.close())
        pdfStream.on("error", (error: unknown) => controller.error(error))
      },
    })

    const filename = `Sales_Order_${safeFilename(order.internalSoNo)}.pdf`
    const dispositionType = download ? "attachment" : "inline"

    return new NextResponse(readableStream, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${dispositionType}; filename="${filename}"`,
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    })
  } catch (error) {
    console.error("Sales Order PDF generation error:", error)
    return new NextResponse("Internal Server Error generating PDF", { status: 500 })
  }
}
