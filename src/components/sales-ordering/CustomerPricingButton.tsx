"use client"

import { useState } from "react"
import { Tag } from "lucide-react"
import { CustomerPricingModal } from "./CustomerPricingModal"

export function CustomerPricingButton({
  customerId,
  customerName,
  customCount = 0,
}: {
  customerId: string
  customerName: string
  customCount?: number
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-black text-slate-700 hover:border-cyan-500 hover:text-cyan-700 hover:bg-cyan-50/50 transition shadow-2xs"
        title={`Set custom SKU prices for ${customerName}`}
      >
        <Tag className="h-3 w-3 text-cyan-600" />
        <span>Pricing</span>
        {customCount > 0 && (
          <span className="ml-1 rounded-full bg-emerald-100 text-emerald-800 px-1.5 py-0.2 text-[9px] font-black">
            {customCount}
          </span>
        )}
      </button>

      {open && (
        <CustomerPricingModal
          customerId={customerId}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
