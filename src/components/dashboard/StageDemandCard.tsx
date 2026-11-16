import Link from "next/link"
import { ShoppingCart, Users, FileSearch, ShieldAlert, ArrowRight, CheckCircle2 } from "lucide-react"

export function StageDemandCard({
  activeCustomers,
  pendingIntakes,
  creditReviewsOnHold,
  confirmedOrders,
}: {
  activeCustomers: number
  pendingIntakes: number
  creditReviewsOnHold: number
  confirmedOrders: number
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold">
              1
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-cyan-600 block">Stage 1</span>
              <h3 className="text-base font-black text-slate-900 tracking-tight">Commercial Demand</h3>
            </div>
          </div>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-cyan-50 text-cyan-700 border border-cyan-200/60">
            Sales Ordering
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 my-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-1.5 text-slate-500 mb-1">
              <Users className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold">Customers</span>
            </div>
            <p className="text-xl font-black text-slate-900">{activeCustomers.toLocaleString()}</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-1.5 text-slate-500 mb-1">
              <FileSearch className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold">PO Intake Queue</span>
            </div>
            <p className={`text-xl font-black ${pendingIntakes > 0 ? "text-amber-600" : "text-slate-900"}`}>
              {pendingIntakes}
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-1.5 text-slate-500 mb-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold">Credit Reviews</span>
            </div>
            <p className={`text-xl font-black ${creditReviewsOnHold > 0 ? "text-rose-600" : "text-slate-900"}`}>
              {creditReviewsOnHold}
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-1.5 text-slate-500 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-[11px] font-semibold">Confirmed SOs</span>
            </div>
            <p className="text-xl font-black text-emerald-600">{confirmedOrders}</p>
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
        <Link
          href="/forms/sales-ordering/intake"
          className="inline-flex items-center gap-1 text-xs font-bold text-cyan-700 hover:text-cyan-900 transition-colors"
        >
          Open PO Upload Queue <ArrowRight className="w-3.5 h-3.5" />
        </Link>
        <Link
          href="/forms/sales-ordering/credit-check"
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          Credit Check
        </Link>
      </div>
    </div>
  )
}
