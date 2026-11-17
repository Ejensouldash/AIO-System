export const dynamic = "force-dynamic"

import { Suspense } from "react"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import {
  Boxes,
  MapPinned,
  PackageCheck,
  ShieldAlert,
  Truck,
  ArrowRight,
  CheckCircle2,
} from "lucide-react"
import { LiveInventoryTable } from "@/components/warehouse/LiveInventoryTable"
import { PendingHandoversSection } from "@/components/warehouse/PendingHandoversSection"

async function AsyncWarehouseContent() {
  const [pendingHandovers, inventoryBatches, shippedOrders, quarantineCount, incomingSalesOrders] = await Promise.all([
    prisma.productionHandover.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      include: { dailyReport: true, items: true, productionStaff: true }
    }),
    prisma.inventoryBatch.findMany({
      where: { availableBalance: { gt: 0 } },
      orderBy: [{ updatedAt: "desc" }, { batchNumber: "asc" }]
    }),
    prisma.distributionOrder.count({ where: { status: "SHIPPED" } }),
    prisma.goodsReturnNote.count({ where: { status: "QUARANTINE" } }),
    prisma.salesOrder.findMany({
      where: {
        submittedToWarehouseAt: { not: null },
        status: "SUBMITTED_TO_WAREHOUSE",
      },
      include: {
        customer: { select: { legalName: true, customerCode: true } },
        items: {
          select: {
            sku: true,
            descriptionSnapshot: true,
            qtyOrdered: true,
            uom: true,
          },
        },
      },
      orderBy: { submittedToWarehouseAt: "desc" },
      take: 6,
    }),
  ])

  const availableUnits = inventoryBatches.reduce((sum, batch) => sum + batch.availableBalance, 0)

  const cards = [
    { label: "Active Batches", value: inventoryBatches.length, hint: "With available balance", icon: Boxes, tone: "bg-indigo-50 text-indigo-700" },
    { label: "Available Units", value: availableUnits.toLocaleString(), hint: "Current inventory balance", icon: PackageCheck, tone: "bg-emerald-50 text-emerald-700" },
    { label: "In Transit", value: shippedOrders, hint: "DO with shipped status", icon: Truck, tone: "bg-sky-50 text-sky-700" },
    { label: "Quarantine", value: quarantineCount, hint: "Pending action", icon: ShieldAlert, tone: "bg-rose-50 text-rose-700" },
  ]

  return (
    <div className="space-y-6">
      {/* KPI Metric Cards */}
      <section className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {cards.map(card => (
          <div key={card.label} className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md sm:p-5">
            <div className={`mb-3 inline-flex rounded-xl p-2.5 ${card.tone}`}>
              <card.icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-black text-slate-950 sm:text-3xl tabular-nums">{card.value}</p>
            <p className="mt-1 text-xs font-black uppercase tracking-wider text-slate-600">{card.label}</p>
            <p className="mt-1 hidden text-xs text-slate-400 sm:block">{card.hint}</p>
          </div>
        ))}
      </section>

      {/* Incoming Sales Orders (Awaiting DO) Action Section */}
      {incomingSalesOrders.length > 0 ? (
        <section className="rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-amber-200/80 pb-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="rounded-xl bg-amber-500 p-2 text-white shadow-xs">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                  Pending Sales Orders for DO Dispatch
                  <span className="rounded-full bg-amber-200/80 text-amber-900 px-2 py-0.5 text-xs font-black">
                    {incomingSalesOrders.length}
                  </span>
                </h3>
                <p className="text-xs text-amber-800 font-semibold">
                  {incomingSalesOrders.length} commercial order{incomingSalesOrders.length > 1 ? "s" : ""} awaiting warehouse DO creation and inventory dispatch.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/forms/sales-ordering/orders"
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white/80 px-3 py-1.5 text-xs font-bold text-amber-950 hover:bg-white shadow-2xs transition"
              >
                All Sales Orders &rarr;
              </Link>
              <Link
                href="/forms/warehouse/distribution"
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800 shadow-2xs transition"
              >
                All DOs &rarr;
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {incomingSalesOrders.map((so) => {
              const totalCartons = so.items.reduce((sum, item) => sum + Number(item.qtyOrdered || 0), 0)
              return (
                <div
                  key={so.id}
                  className="flex flex-col justify-between rounded-xl border border-amber-200 bg-white p-3.5 shadow-xs hover:border-amber-400 transition"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-mono text-xs font-black text-slate-900">
                        {so.internalSoNo}
                      </span>
                      <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-black text-amber-800">
                        {totalCartons.toLocaleString()} CTN
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-black text-slate-900 truncate">
                      {so.customer?.legalName || "Unknown Customer"}
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {so.poNumber ? `PO: ${so.poNumber}` : "Direct Sales Order"}
                      {so.customer?.customerCode && <span className="ml-1 text-slate-400">· {so.customer.customerCode}</span>}
                    </p>

                    {/* Ordered Items Preview */}
                    {so.items && so.items.length > 0 && (
                      <div className="mt-2.5 rounded-lg bg-amber-50/80 p-2 border border-amber-200/70 text-xs">
                        <p className="text-[10px] font-black uppercase tracking-wider text-amber-900 mb-1">
                          Ordered Items ({so.items.length}):
                        </p>
                        <div className="space-y-1">
                          {so.items.map((it, idx) => (
                            <div key={idx} className="flex items-center justify-between text-[11px] bg-white rounded px-2 py-1 border border-amber-100">
                              <span className="font-bold text-slate-800 truncate pr-2">
                                {it.descriptionSnapshot || it.sku || "Mineral Water"}
                              </span>
                              <span className="shrink-0 font-mono font-black text-amber-900 bg-amber-100/80 px-1.5 py-0.5 rounded text-[10px]">
                                {Number(it.qtyOrdered).toLocaleString()} {it.uom}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-medium">
                      {so.submittedToWarehouseAt
                        ? new Date(so.submittedToWarehouseAt).toLocaleDateString("en-MY", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                        : new Date(so.createdAt).toLocaleDateString("en-MY", { month: "short", day: "numeric" })}
                    </span>
                    <Link
                      href={`/forms/warehouse/distribution/new?soId=${so.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-black text-white hover:bg-amber-600 shadow-xs transition"
                    >
                      Generate DO <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-2 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                Pending Sales Orders for DO Dispatch
                <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                  0 Pending
                </span>
              </h4>
              <p className="text-xs text-slate-500 font-medium">
                All approved commercial sales orders have been fulfilled with Distribution Orders.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/forms/sales-ordering/orders"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
            >
              All Sales Orders &rarr;
            </Link>
            <Link
              href="/forms/warehouse/distribution/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-black text-slate-950 hover:bg-emerald-400 shadow-2xs transition"
            >
              + Create Manual DO
            </Link>
          </div>
        </section>
      )}

      {/* Production Handover Alerts / Action Section */}
      <div id="pending-handovers" className="scroll-mt-24">
        <PendingHandoversSection handovers={pendingHandovers} />
      </div>

      {/* Live Inventory & Traceability Table */}
      <section id="live-inventory" className="scroll-mt-24 space-y-3">
        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600">Traceability Ready</p>
            <h2 className="mt-0.5 text-2xl font-black text-slate-950">Live Inventory</h2>
            <p className="text-xs text-slate-500 sm:text-sm">Click Trace to view batch origin, DO movement, driver and location check-in.</p>
          </div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400">
            <MapPinned className="h-3.5 w-3.5 text-slate-500" /> Location check-in available on DO details page
          </div>
        </div>
        <LiveInventoryTable inventoryBatches={inventoryBatches} />
      </section>
    </div>
  )
}

function WarehouseSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-32 rounded-2xl bg-slate-100" />
        ))}
      </div>
      <div className="h-16 rounded-2xl bg-slate-100" />
      <div className="h-96 rounded-2xl bg-slate-100" />
    </div>
  )
}

export default function WarehouseDashboard() {
  return (
    <Suspense fallback={<WarehouseSkeleton />}>
      <AsyncWarehouseContent />
    </Suspense>
  )
}
