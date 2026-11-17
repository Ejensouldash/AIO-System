export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAccessInfo, hasAnyModule } from "@/lib/access"

export async function GET() {
  const access = await getAccessInfo()
  if (!access || (!access.isSuperAdmin && !hasAnyModule(access, ["WAREHOUSE"]))) {
    return NextResponse.json({ incomingSalesOrders: [], count: 0 })
  }

  try {
    const orders = await prisma.salesOrder.findMany({
      where: {
        submittedToWarehouseAt: { not: null },
        status: "SUBMITTED_TO_WAREHOUSE",
      },
      include: {
        customer: { select: { legalName: true } },
        items: { select: { qtyOrdered: true } },
      },
      orderBy: { submittedToWarehouseAt: "desc" },
      take: 20,
    })

    const incomingSalesOrders = orders.map((o) => ({
      id: o.id,
      internalSoNo: o.internalSoNo,
      customerName: o.customer?.legalName || "Unknown Customer",
      poNumber: o.poNumber || null,
      totalCartons: o.items.reduce((sum, item) => sum + Number(item.qtyOrdered || 0), 0),
      submittedAt: o.submittedToWarehouseAt
        ? o.submittedToWarehouseAt.toISOString()
        : o.createdAt.toISOString(),
    }))

    return NextResponse.json({
      incomingSalesOrders,
      count: incomingSalesOrders.length,
    })
  } catch (err: any) {
    console.error("Warehouse notifications error:", err)
    return NextResponse.json({ incomingSalesOrders: [], count: 0 }, { status: 500 })
  }
}
