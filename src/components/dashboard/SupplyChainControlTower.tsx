import { StageDemandCard } from "./StageDemandCard"
import { StageProductionCard } from "./StageProductionCard"
import { StageWarehouseCard } from "./StageWarehouseCard"
import { Activity, ArrowRight, ShieldCheck, ShoppingCart, Factory, Warehouse } from "lucide-react"
import Link from "next/link"

export function SupplyChainControlTower({
  demandMetrics,
  productionMetrics,
  warehouseMetrics,
}: {
  demandMetrics: {
    activeCustomers: number
    pendingIntakes: number
    creditReviewsOnHold: number
    confirmedOrders: number
  }
  productionMetrics: {
    todayCartons: number
    activeReportsCount: number
    quarantineHoldCount: number
    pendingHandovers: number
  }
  warehouseMetrics: {
    totalAvailableUnits: number
    inTransitDOs: number
    scheduledGatepasses: number
    activeBatchesCount: number
  }
}) {
  return (
    <div className="space-y-6">
      {/* Banner / Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-cyan-950 rounded-2xl p-6 text-white border border-slate-800 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-xs font-black uppercase tracking-widest text-cyan-400">Live Control Tower</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Supply Chain & Operations Hub</h2>
              <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl font-medium">
                Integrated visibility across commercial customer orders, factory floor production yield, and warehouse dispatch fulfillment.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/forms/sales-ordering"
                className="px-3 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all flex items-center gap-1.5"
              >
                <ShoppingCart className="w-3.5 h-3.5" /> Sales
              </Link>
              <Link
                href="/forms/production"
                className="px-3 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all flex items-center gap-1.5"
              >
                <Factory className="w-3.5 h-3.5" /> Production
              </Link>
              <Link
                href="/forms/warehouse/dashboard"
                className="px-3 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black transition-all flex items-center gap-1.5 shadow-sm"
              >
                <Warehouse className="w-3.5 h-3.5" /> Warehouse
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 3-Stage Pipeline Visual Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <StageDemandCard
          activeCustomers={demandMetrics.activeCustomers}
          pendingIntakes={demandMetrics.pendingIntakes}
          creditReviewsOnHold={demandMetrics.creditReviewsOnHold}
          confirmedOrders={demandMetrics.confirmedOrders}
        />

        <StageProductionCard
          todayCartons={productionMetrics.todayCartons}
          activeReportsCount={productionMetrics.activeReportsCount}
          quarantineHoldCount={productionMetrics.quarantineHoldCount}
          pendingHandovers={productionMetrics.pendingHandovers}
        />

        <StageWarehouseCard
          totalAvailableUnits={warehouseMetrics.totalAvailableUnits}
          inTransitDOs={warehouseMetrics.inTransitDOs}
          scheduledGatepasses={warehouseMetrics.scheduledGatepasses}
          activeBatchesCount={warehouseMetrics.activeBatchesCount}
        />
      </div>
    </div>
  )
}
