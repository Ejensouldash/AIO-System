export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { getResolvedCustomerPricing } from "@/lib/pricing/skuPricing"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const customer = await prisma.customer.findUnique({
      where: { id },
      select: {
        id: true,
        customerCode: true,
        legalName: true,
        tradingName: true,
        addresses: { take: 1, select: { fullAddress: true } },
      },
    })

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    const prices = await getResolvedCustomerPricing(id)

    return NextResponse.json({
      customer,
      prices,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
