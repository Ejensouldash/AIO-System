"use client"

import { useCallback, useMemo, useState } from "react"
import Link from "next/link"
import { Eye, QrCode, Truck, CheckCircle2, ArrowRight, Package, X, FileText } from "lucide-react"
import type { WarehouseDashboardData, DashboardSalesOrder } from "@/lib/warehouse/dashboard-data"
import { formatSKU } from "@/lib/warehouse/format"
import { CommandBar } from "./CommandBar"
import { Drawer } from "./Drawer"
import { FlowPipeline } from "./FlowPipeline"
import { KpiCards } from "./KpiCards"
import { StockBreakdownCard } from "./StockBreakdownCard"
import { type HeatmapSelection, StockHeatmap } from "./StockHeatmap"
import { VelocityChart } from "./VelocityChart"
import { AGE_BUCKETS, PERIODS, type Period, ageBucketOf, batchQrHref, batchTraceHref, fmt, sliceDaily } from "./shared"

// Flow lines and transit stripes; both stop for users who prefer reduced motion.
const MOTION_CSS = `
@keyframes wh-flow { to { stroke-dashoffset: -16; } }
@keyframes wh-stripe { to { background-position: 16px 0; } }
.wh-flow { animation: wh-flow 1.2s linear infinite; }
.wh-stripe {
  background-image: linear-gradient(45deg, rgba(255,255,255,.28) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.28) 50%, rgba(255,255,255,.28) 75%, transparent 75%);
  background-size: 16px 16px;
  animation: wh-stripe 1s linear infinite;
}
@media (prefers-reduced-motion: reduce) { .wh-flow, .wh-stripe { animation: none; } }
`

export function WarehouseDashboardClient({ data }: { data: WarehouseDashboardData }) {
  const [period, setPeriod] = useState<Period>("7d")
  const [selection, setSelection] = useState<HeatmapSelection | null>(null)
  const [selectedSo, setSelectedSo] = useState<DashboardSalesOrder | null>(null)
  const closeDrawer = useCallback(() => setSelection(null), [])

  const days = useMemo(() => sliceDaily(data.daily, period, data.today, data.monthStart), [data, period])

  const selectedBatches = useMemo(() => {
    if (!selection) return []
    return data.batches
      .filter(batch => batch.sku === selection.sku && ageBucketOf(batch.ageDays) === selection.bucket)
      .sort((a, b) => b.ageDays - a.ageDays)
  }, [data.batches, selection])
  const selectedBucket = AGE_BUCKETS.find(bucket => bucket.id === selection?.bucket)
  const selectedUnits = selectedBatches.reduce((sum, batch) => sum + batch.available, 0)

  return (
    <div className="space-y-5">
      <style>{MOTION_CSS}</style>

      <CommandBar data={data} />

      {/* Pending Sales Orders for DO Dispatch */}
      {data.incomingSalesOrders && data.incomingSalesOrders.length > 0 ? (
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
                    {data.incomingSalesOrders.length}
                  </span>
                </h3>
                <p className="text-xs text-amber-800 font-semibold">
                  {data.incomingSalesOrders.length} commercial order{data.incomingSalesOrders.length > 1 ? "s" : ""} awaiting warehouse DO creation and inventory dispatch.
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
            {data.incomingSalesOrders.slice(0, 6).map((order) => (
              <div
                key={order.id}
                className="flex flex-col justify-between rounded-xl border border-amber-200 bg-white p-3.5 shadow-xs hover:border-amber-400 transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-xs font-black text-slate-900">
                      {order.internalSoNo}
                    </span>
                    <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-black text-amber-800">
                      {order.totalCartons.toLocaleString()} CTN
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-black text-slate-900 truncate">
                    {order.customerName}
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {order.poNumber ? `PO: ${order.poNumber}` : "Direct Sales Order"}
                    {order.customerCode && <span className="ml-1 text-slate-400">· {order.customerCode}</span>}
                  </p>

                  {/* Ordered SKUs Preview */}
                  {order.items && order.items.length > 0 && (
                    <div className="mt-2.5 rounded-lg bg-amber-50/80 p-2.5 border border-amber-200/70 text-xs">
                      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-amber-900 mb-1.5">
                        <span className="flex items-center gap-1">
                          <Package className="w-3 h-3 text-amber-700" /> Ordered Items ({order.items.length}):
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedSo(order)}
                          className="text-amber-800 hover:text-amber-950 font-bold underline cursor-pointer"
                        >
                          View Details
                        </button>
                      </div>
                      <div className="space-y-1">
                        {order.items.map((it, idx) => (
                          <div key={idx} className="flex items-center justify-between text-[11px] bg-white rounded px-2 py-1 border border-amber-200/50">
                            <span className="font-bold text-slate-800 truncate pr-2">
                              {it.description || formatSKU(it.sku || "")}
                            </span>
                            <span className="shrink-0 font-mono font-black text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded text-[10px]">
                              {it.qtyOrdered.toLocaleString()} {it.uom}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-medium">
                    {new Date(order.submittedAt).toLocaleDateString("en-MY", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedSo(order)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                    >
                      Items
                    </button>
                    <Link
                      href={`/forms/warehouse/distribution/new?soId=${order.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-black text-white hover:bg-amber-600 shadow-xs transition"
                    >
                      Generate DO <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Period" className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          {PERIODS.map(option => (
            <button
              key={option.id}
              type="button"
              role="tab"
              aria-selected={period === option.id}
              onClick={() => setPeriod(option.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${period === option.id ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-slate-400">Period applies to the pipeline and velocity chart. Stock figures are live.</p>
      </div>

      <KpiCards data={data} />

      <FlowPipeline data={data} days={days} period={period} />

      {/* Analytics Row 1: Stock Breakdown & Inflow/Outflow Velocity */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <StockBreakdownCard batches={data.batches} />
        <VelocityChart days={days} period={period} />
      </section>

      {/* Analytics Row 2: Wide Stock Heatmap & FEFO Traceability Queue */}
      <section className="w-full">
        <StockHeatmap batches={data.batches} onSelect={setSelection} />
      </section>

      <Drawer
        open={selection !== null}
        onClose={closeDrawer}
        title={selection ? `${formatSKU(selection.sku)} · ${selectedBucket?.label ?? ""}` : ""}
        subtitle="Batches in this cell, oldest first"
      >
        <dl className="grid grid-cols-3 gap-2">
          {[
            { label: "Batches", value: fmt(selectedBatches.length) },
            { label: "Units", value: fmt(selectedUnits) },
            { label: "Oldest", value: selectedBatches[0] ? `${selectedBatches[0].ageDays}d` : "—" },
          ].map(stat => (
            <div key={stat.label} className="rounded-xl bg-slate-50 px-3 py-2.5">
              <dt className="text-[10px] uppercase tracking-wider text-slate-500">{stat.label}</dt>
              <dd className="text-lg font-bold text-slate-950 tabular-nums">{stat.value}</dd>
            </div>
          ))}
        </dl>
        {selection?.bucket === "old" && selectedBatches.length > 0 && (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            These batches are over 60 days old. Allocate them to the next DO first (FEFO).
          </p>
        )}

        <p className="mt-5 text-sm font-semibold text-slate-900">Traceability ready</p>
        <ul className="mt-2 space-y-2">
          {selectedBatches.map(batch => (
            <li key={batch.batchNumber} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate font-mono text-sm font-semibold text-indigo-700">{batch.batchNumber}</p>
                <p className="text-[11px] text-slate-500 tabular-nums">{fmt(batch.available)} units · {batch.ageDays} days old</p>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <Link href={batchTraceHref(batch)} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-900 hover:bg-slate-900 hover:text-white">
                  <Eye className="h-3.5 w-3.5" /> Trace
                </Link>
                <Link href={batchQrHref(batch)} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700">
                  <QrCode className="h-3.5 w-3.5" /> QR
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </Drawer>

      {/* SALES ORDER DETAILS MODAL */}
      {selectedSo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border-2 border-slate-900 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-black text-amber-900">
                  <FileText className="w-3.5 h-3.5" /> Sales Order Details
                </div>
                <h3 className="mt-1 font-mono text-lg font-black text-slate-900">
                  {selectedSo.internalSoNo}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSo(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400">Customer</p>
                  <p className="font-bold text-slate-900">{selectedSo.customerName}</p>
                  {selectedSo.customerCode && <p className="text-slate-500 font-mono text-[10px]">Code: {selectedSo.customerCode}</p>}
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400">PO Reference</p>
                  <p className="font-bold text-slate-900">{selectedSo.poNumber || "Direct Sales Order"}</p>
                  <p className="text-slate-500 text-[10px]">
                    Submitted: {new Date(selectedSo.submittedAt).toLocaleDateString("en-MY", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                {selectedSo.deliveryAddress && (
                  <div className="col-span-2 pt-2 border-t border-slate-200">
                    <p className="text-[10px] font-black uppercase text-slate-400">Delivery Address</p>
                    <p className="font-medium text-slate-800">{selectedSo.deliveryAddress}</p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs font-black uppercase text-slate-800 mb-1.5">Ordered Line Items</p>
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-[10px] font-black uppercase text-slate-600">
                      <tr>
                        <th className="p-2.5">Item Description</th>
                        <th className="p-2.5 text-right">Quantity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedSo.items.map((it, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2.5">
                            <p className="font-bold text-slate-900">{it.description}</p>
                            {it.sku && <p className="text-[10px] text-slate-500 font-mono">SKU: {it.sku}</p>}
                          </td>
                          <td className="p-2.5 text-right font-black text-slate-900">
                            {it.qtyOrdered.toLocaleString()} {it.uom}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 font-black border-t border-slate-200">
                      <tr>
                        <td className="p-2.5 uppercase text-slate-600">Total Order Volume:</td>
                        <td className="p-2.5 text-right text-amber-900">
                          {selectedSo.totalCartons.toLocaleString()} CTN
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedSo(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Close
              </button>
              <Link
                href={`/forms/warehouse/distribution/new?soId=${selectedSo.id}`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-black text-white hover:bg-amber-600 shadow-sm transition"
              >
                Generate DO for this Order &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
