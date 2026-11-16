export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { resolveSkuPrice } from "@/lib/pricing/skuPricing"

export const runtime = "nodejs"

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    const distOrder = await prisma.distributionOrder.findUnique({
      where: { id },
      include: {
        items: true,
        createdBy: { select: { name: true } },
        customer: { select: { id: true, customerCode: true, legalName: true } },
        gatePassLinks: {
          include: {
            gatePass: {
              include: {
                verificationTokens: true,
              },
            },
          },
        },
      },
    })

    if (!distOrder) {
      return NextResponse.json({ error: "Distribution order not found" }, { status: 404 })
    }

    // Enhance items with resolved unitPrice and lineTotal if not already stored
    let calculatedTotal = 0
    const enhancedItems = await Promise.all(
      distOrder.items.map(async item => {
        let price = item.unitPrice ? Number(item.unitPrice) : null
        let total = item.lineTotal ? Number(item.lineTotal) : null

        if (price === null) {
          const resolved = await resolveSkuPrice(distOrder.customerId, item.sku)
          price = resolved.unitPrice
          total = Math.round(item.qtySent * price * 100) / 100
        }

        calculatedTotal += total || 0

        return {
          ...item,
          unitPrice: price,
          lineTotal: total,
        }
      })
    )

    return NextResponse.json({
      ...distOrder,
      items: enhancedItems,
      totalAmount: distOrder.totalAmount ? Number(distOrder.totalAmount) : Math.round(calculatedTotal * 100) / 100,
    })
  } catch (error: any) {
    console.error("Error fetching DO:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
