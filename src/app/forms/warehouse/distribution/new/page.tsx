export const dynamic = "force-dynamic"

import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getAvailableInventory } from "@/app/actions/warehouse"
import { getAllActiveProducts } from "@/lib/pricing/skuPricing"
import { CreateDOForm } from "./CreateDOForm"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { prisma } from "@/lib/prisma"

export default async function NewDistributionOrderPage({
  searchParams,
}: {
  searchParams?: Promise<{ soId?: string }>
}) {
  const session = await auth()
  if (!session) redirect("/login")
  const user = session.user as any

  const { soId } = (await searchParams) || {}

  const [availableInventory, rawCustomers, products, salesOrder] = await Promise.all([
    getAvailableInventory(),
    prisma.customer.findMany({
      select: {
        id: true,
        customerCode: true,
        legalName: true,
        tradingName: true,
        addresses: { select: { fullAddress: true }, take: 1 },
      },
      orderBy: { legalName: "asc" },
      take: 200,
    }),
    getAllActiveProducts(),
    soId
      ? prisma.salesOrder.findUnique({
          where: { id: soId },
          include: { customer: { include: { addresses: true } }, items: true },
        })
      : null,
  ])

  const customers = rawCustomers.map((c) => ({
    id: c.id,
    customerCode: c.customerCode,
    legalName: c.legalName,
    tradingName: c.tradingName || "",
    address: c.addresses?.[0]?.fullAddress || "",
  }))

  // Ensure SO customer is included in the dropdown options even if outside top 200
  if (salesOrder?.customer && !customers.some((c) => c.id === salesOrder.customer.id)) {
    customers.unshift({
      id: salesOrder.customer.id,
      customerCode: salesOrder.customer.customerCode,
      legalName: salesOrder.customer.legalName,
      tradingName: salesOrder.customer.tradingName || "",
      address: salesOrder.customer.addresses?.[0]?.fullAddress || "",
    })
  }

  const initialSalesOrder = salesOrder
    ? {
        id: salesOrder.id,
        internalSoNo: salesOrder.internalSoNo,
        poNumber: salesOrder.poNumber,
        customerId: salesOrder.customerId,
        customerName: salesOrder.customer.legalName,
        customerCode: salesOrder.customer.customerCode,
        deliveryAddress:
          (salesOrder.deliveryAddressSnapshot as any)?.text ||
          salesOrder.customer.addresses?.[0]?.fullAddress ||
          salesOrder.customer.legalName,
        items: salesOrder.items.map((i) => ({
          sku: i.sku,
          description: i.descriptionSnapshot,
          qtyOrdered: Number(i.qtyOrdered),
          uom: i.uom,
        })),
      }
    : null

  return (
    <div className="max-w-4xl">
      <Link
        href="/forms/warehouse/distribution"
        className="inline-flex items-center text-sm font-black uppercase tracking-wider border-2 border-black px-4 py-2 mb-6 hover:bg-black hover:text-white transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-[2px] hover:translate-x-[2px]"
      >
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to DO List
      </Link>

      <div className="bg-white border-4 border-black p-4 sm:p-10 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative">
        <div className="absolute -top-4 -right-2 sm:-right-4 bg-yellow-400 border-4 border-black px-2 sm:px-4 py-1 sm:py-2 rotate-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-10">
          <span className="font-black uppercase tracking-widest text-[10px] sm:text-sm">
            Transfer Out
          </span>
        </div>

        <h2 className="text-xl sm:text-3xl font-black uppercase tracking-tight mb-6 sm:mb-8 pr-16 sm:pr-0">
          Create Distribution Order
        </h2>

        <CreateDOForm
          availableInventory={availableInventory}
          userId={user.id}
          customers={customers}
          products={products}
          initialSalesOrder={initialSalesOrder}
        />
      </div>
    </div>
  )
}
