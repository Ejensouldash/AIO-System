"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Boxes,
  Warehouse,
  Factory,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Sparkles,
  ArrowRight,
  PackageCheck,
  Search,
} from "lucide-react"
import type { StockOverviewData, SkuStockSummary } from "@/lib/sales-ordering/stock-service"

export function LiveStockOverview({ stockData }: { stockData: StockOverviewData }) {
  const [expandedSku, setExpandedSku] = useState<string | null>(null)
  const [filterLocation, setFilterLocation] = useState<"ALL" | "WAREHOUSE" | "PRODUCTION">("ALL")
  const [searchBatch, setSearchBatch] = useState("")

  const toggleExpand = (skuKey: string) => {
    setExpandedSku(prev => (prev === skuKey ? null : skuKey))
  }

  return (
    <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* HEADER & SUMMARY PILLS */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-slate-100 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-cyan-50 border border-cyan-200/60 px-3 py-1 text-xs font-black uppercase tracking-wider text-cyan-800">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-600"></span>
            </span>
            Real-Time Finished Goods Stock
          </div>
          <h3 className="mt-2 text-xl font-black text-slate-900 tracking-tight sm:text-2xl">
            Live Stock by SKU — Production & Warehouse
          </h3>
          <p className="mt-0.5 text-xs text-slate-500 font-medium">
            Synchronized with Daily Production Reports & Warehouse Inventory · Updated {stockData.lastUpdated}
          </p>
        </div>

        {/* Global Summary Pills */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/60 px-4 py-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
              <Warehouse className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-800">Warehouse (Ready)</p>
              <p className="text-lg font-black text-emerald-950 leading-tight">
                {stockData.totalWarehouseBoxes.toLocaleString()} <span className="text-xs font-bold text-emerald-700">Boxes</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-2xl bg-amber-50/80 border border-amber-200/60 px-4 py-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-600 text-white shadow-sm">
              <Factory className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-amber-800">Production (Floor)</p>
              <p className="text-lg font-black text-amber-950 leading-tight">
                {stockData.totalProductionBoxes.toLocaleString()} <span className="text-xs font-bold text-amber-700">Boxes</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-2xl bg-cyan-950 text-white px-4 py-2.5 shadow-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400 text-slate-950 font-black">
              <Boxes className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-cyan-300">Total Available</p>
              <p className="text-lg font-black text-white leading-tight">
                {stockData.grandTotalBoxes.toLocaleString()} <span className="text-xs font-bold text-cyan-200">Boxes</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SKU CARDS GRID */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stockData.skus.map((sku) => {
          const isExpanded = expandedSku === sku.skuKey
          const isOOS = sku.status === "OUT_OF_STOCK"

          return (
            <div
              key={sku.skuKey}
              className={`group relative rounded-2xl border transition-all duration-200 ${
                isExpanded
                  ? "border-cyan-500 ring-2 ring-cyan-500/20 shadow-md bg-white"
                  : isOOS
                  ? "border-slate-200 bg-slate-50/60 opacity-80"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
              }`}
            >
              {/* Header */}
              <div className="p-4 pb-3 border-b border-slate-100">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-slate-700">
                      {sku.bottleSize}
                    </span>
                    <h4 className="mt-1 font-black text-slate-900 text-sm leading-snug">
                      {sku.shortCode}
                    </h4>
                    <p className="text-[11px] font-medium text-slate-500">{sku.packQty}</p>
                  </div>
                  <div>
                    {sku.status === "HEALTHY" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800">
                        <CheckCircle2 className="h-3 w-3" /> In Stock
                      </span>
                    )}
                    {sku.status === "MODERATE" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-800">
                        <AlertTriangle className="h-3 w-3" /> Moderate
                      </span>
                    )}
                    {sku.status === "OUT_OF_STOCK" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-black text-slate-600">
                        <XCircle className="h-3 w-3" /> Standby / 0
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Stock Numbers */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1.5 font-bold text-slate-600">
                    <Warehouse className="h-3.5 w-3.5 text-emerald-600" /> Warehouse:
                  </span>
                  <span className="font-black text-slate-900">
                    {sku.warehouseBoxes.toLocaleString()}{" "}
                    <span className="text-[10px] font-bold text-slate-500">boxes</span>
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1.5 font-bold text-slate-600">
                    <Factory className="h-3.5 w-3.5 text-amber-600" /> Production:
                  </span>
                  <span className="font-black text-slate-900">
                    {sku.productionBoxes.toLocaleString()}{" "}
                    <span className="text-[10px] font-bold text-slate-500">boxes</span>
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500">Total Available:</span>
                  <div className="text-right">
                    <span className="text-base font-black text-slate-950">
                      {sku.totalBoxes.toLocaleString()}
                    </span>
                    <span className="ml-1 text-[11px] font-bold text-slate-500">ctns</span>
                    {sku.totalBottles > 0 && (
                      <p className="text-[10px] font-semibold text-slate-400">
                        ({sku.totalBottles.toLocaleString()} btls)
                      </p>
                    )}
                  </div>
                </div>

                {/* Batch Inspector Trigger */}
                {sku.batches.length > 0 && (
                  <button
                    onClick={() => toggleExpand(sku.skuKey)}
                    className="w-full mt-2 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-1.5 text-xs font-black text-slate-700 hover:bg-slate-100 transition"
                  >
                    <span>{isExpanded ? "Hide Batches" : `View ${sku.batches.length} Batches`}</span>
                    {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* DETAILED BATCH INSPECTOR ACCORDION */}
      {expandedSku && (
        <div className="rounded-2xl border-2 border-cyan-500/30 bg-slate-50/70 p-5 animate-in fade-in slide-in-from-top-2 duration-200">
          {(() => {
            const activeSku = stockData.skus.find(s => s.skuKey === expandedSku)
            if (!activeSku) return null

            const filteredBatches = activeSku.batches.filter(b => {
              if (filterLocation !== "ALL" && b.location !== filterLocation) return false
              if (searchBatch && !b.batchNumber.toLowerCase().includes(searchBatch.toLowerCase())) return false
              return true
            })

            return (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-3">
                  <div>
                    <h4 className="font-black text-slate-900 text-base flex items-center gap-2">
                      <Boxes className="h-4 w-4 text-cyan-600" />
                      Active Batches for {activeSku.name}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium">
                      Showing {filteredBatches.length} of {activeSku.batches.length} batches recorded across Warehouse and Production
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Location filter pills */}
                    <div className="inline-flex rounded-xl bg-white p-1 border border-slate-200 shadow-sm text-xs font-bold">
                      <button
                        onClick={() => setFilterLocation("ALL")}
                        className={`rounded-lg px-2.5 py-1 transition ${
                          filterLocation === "ALL" ? "bg-slate-900 text-white font-black" : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        All ({activeSku.batches.length})
                      </button>
                      <button
                        onClick={() => setFilterLocation("WAREHOUSE")}
                        className={`rounded-lg px-2.5 py-1 transition ${
                          filterLocation === "WAREHOUSE"
                            ? "bg-emerald-600 text-white font-black"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Warehouse ({activeSku.warehouseBatchesCount})
                      </button>
                      <button
                        onClick={() => setFilterLocation("PRODUCTION")}
                        className={`rounded-lg px-2.5 py-1 transition ${
                          filterLocation === "PRODUCTION"
                            ? "bg-amber-600 text-white font-black"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Production ({activeSku.productionBatchesCount})
                      </button>
                    </div>

                    {/* Search batch input */}
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search batch..."
                        value={searchBatch}
                        onChange={(e) => setSearchBatch(e.target.value)}
                        className="h-9 w-36 sm:w-44 rounded-xl border border-slate-200 bg-white pl-8 pr-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Batches Table */}
                <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-slate-100/90 backdrop-blur border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-600">
                      <tr>
                        <th className="py-2.5 px-4">Batch Number</th>
                        <th className="py-2.5 px-4">Location</th>
                        <th className="py-2.5 px-4 text-right">Quantity (Boxes)</th>
                        <th className="py-2.5 px-4 text-right">Equivalent Bottles</th>
                        <th className="py-2.5 px-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {filteredBatches.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-xs text-slate-400">
                            No batches match your filter criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredBatches.map((b, bIdx) => (
                          <tr key={`${b.batchNumber}-${b.location}-${bIdx}`} className="hover:bg-slate-50/80 transition">
                            <td className="py-2 px-4 font-black font-mono text-slate-900">
                              {b.batchNumber}
                            </td>
                            <td className="py-2 px-4">
                              {b.location === "WAREHOUSE" ? (
                                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-black text-emerald-800">
                                  <Warehouse className="h-3 w-3" /> Warehouse Racking
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-black text-amber-800">
                                  <Factory className="h-3 w-3" /> Production Floor
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-4 text-right font-black text-slate-900">
                              {b.qty.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">ctns</span>
                            </td>
                            <td className="py-2 px-4 text-right font-semibold text-slate-600">
                              {(b.qty * activeSku.bottlesPerBox).toLocaleString()} btls
                            </td>
                            <td className="py-2 px-4 text-center">
                              {b.location === "WAREHOUSE" ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700">
                                  <PackageCheck className="h-3 w-3" /> Ready to Dispatch
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-700">
                                  <Clock className="h-3 w-3" /> Handover Standby
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })()}
        </div>
      )}
    </section>
  )
}
