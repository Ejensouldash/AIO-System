import Link from "next/link"
import { Warehouse, Package, Truck, ShieldCheck, ArrowRight } from "lucide-react"

export function StageWarehouseCard({
  totalAvailableUnits,
  inTransitDOs,
  scheduledGatepasses,
  activeBatchesCount,
}: {
  totalAvailableUnits: number
  inTransitDOs: number
  scheduledGatepasses: number
  activeBatchesCount: number
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              3
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 block">Stage 3</span>
              <h3 className="text-base font-black text-slate-900 tracking-tight">Warehouse Fulfillment</h3>
            </div>
          </div>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
            Logistics & DO
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 my-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-1.5 text-slate-500 mb-1">
              <Package className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-[11px] font-semibold">Available Units</span>
            </div>
            <p className="text-xl font-black text-slate-900">{totalAvailableUnits.toLocaleString()}</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-1.5 text-slate-500 mb-1">
              <Warehouse className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold">Active Batches</span>
            </div>
            <p className="text-xl font-black text-slate-900">{activeBatchesCount}</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-1.5 text-slate-500 mb-1">
              <Truck className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-[11px] font-semibold">In-Transit DOs</span>
            </div>
            <p className={`text-xl font-black ${inTransitDOs > 0 ? "text-blue-600" : "text-slate-900"}`}>
              {inTransitDOs}
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-1.5 text-slate-500 mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-600" />
              <span className="text-[11px] font-semibold">Gatepass Pickups</span>
            </div>
            <p className="text-xl font-black text-slate-900">{scheduledGatepasses}</p>
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
        <Link
          href="/forms/warehouse/dashboard"
          className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900 transition-colors"
        >
          View Live Inventory <ArrowRight className="w-3.5 h-3.5" />
        </Link>
        <Link
          href="/forms/warehouse/distribution"
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          Issue DO
        </Link>
      </div>
    </div>
  )
}
