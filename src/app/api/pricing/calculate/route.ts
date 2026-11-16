export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { calculateDeliveryPricing } from "@/lib/pricing/skuPricing"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { customerId, items } = body as {
      customerId?: string
      items: Array<{ sku: string; qty: number }>
    }

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: "Items array is required" }, { status: 400 })
    }

    const pricing = await calculateDeliveryPricing(customerId, items)
    return NextResponse.json(pricing)
  } catch (error: any) {
    console.error("Pricing calculation error:", error)
    return NextResponse.json({ error: error.message || "Calculation failed" }, { status: 500 })
  }
}
