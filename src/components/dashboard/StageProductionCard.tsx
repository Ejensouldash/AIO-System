import Link from "next/link"
import { Factory, Boxes, AlertTriangle, ArrowRight, ArrowDownRight, Clock } from "lucide-react"

export function StageProductionCard({
  todayCartons,
  activeReportsCount,
  quarantineHoldCount,
  pendingHandovers,
}: {
  todayCartons: number
  activeReportsCount: number
  quarantineHoldCount: number
  pendingHandovers: number
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              2
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 block">Stage 2</span>
              <h3 className="text-base font-black text-slate-900 tracking-tight">Plant Execution</h3>
            </div>
          </div>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            Manufacturing
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 my-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-1.5 text-slate-500 mb-1">
              <Boxes className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-[11px] font-semibold">Today's Cartons</span>
            </div>
            <p className="text-xl font-black text-slate-900">{todayCartons.toLocaleString()}</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-1.5 text-slate-500 mb-1">
              <Factory className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold">Shift Logs</span>
            </div>
            <p className="text-xl font-black text-slate-900">{activeReportsCount}</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-1.5 text-slate-500 mb-1">
              <ArrowDownRight className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-[11px] font-semibold">Open Handovers</span>
            </div>
            <p className={`text-xl font-black ${pendingHandovers > 0 ? "text-blue-600" : "text-slate-900"}`}>
              {pendingHandovers}
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-1.5 text-slate-500 mb-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[11px] font-semibold">Quarantine (Hold)</span>
            </div>
            <p className={`text-xl font-black ${quarantineHoldCount > 0 ? "text-amber-600" : "text-slate-900"}`}>
              {quarantineHoldCount}
            </p>
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
        <Link
          href="/forms/production/daily-report"
          className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-900 transition-colors"
        >
          Log Daily KAR <ArrowRight className="w-3.5 h-3.5" />
        </Link>
        <Link
          href="/forms/production/handover/new"
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          Create Handover
        </Link>
      </div>
    </div>
  )
}
