"use client"

import { useState, useEffect } from "react"
import { X, Save, RotateCcw, Loader2, Tag, Building2, CheckCircle2 } from "lucide-react"
import { getCustomerPricingAction, saveCustomerSkuPricesAction, deleteCustomerSkuPriceOverrideAction } from "@/app/actions/pricing"
import { useRouter } from "next/navigation"

interface CustomerPricingModalProps {
  customerId: string | null
  onClose: () => void
}

export function CustomerPricingModal({ customerId, onClose }: CustomerPricingModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [customer, setCustomer] = useState<any>(null)
  const [prices, setPrices] = useState<any[]>([])
  const [inputValues, setInputValues] = useState<Record<string, string>>({})
  const [statusMsg, setStatusMsg] = useState("")
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    if (!customerId) return
    setLoading(true)
    setErrorMsg("")
    setStatusMsg("")

    getCustomerPricingAction(customerId).then(res => {
      if (res.success && res.customer && res.prices) {
        setCustomer(res.customer)
        setPrices(res.prices)
        const initialMap: Record<string, string> = {}
        for (const p of res.prices) {
          initialMap[p.sku] = Number(p.customerPrice).toFixed(2)
        }
        setInputValues(initialMap)
      } else {
        setErrorMsg(res.error || "Failed to load pricing")
      }
      setLoading(false)
    })
  }, [customerId])

  if (!customerId) return null

  const handlePriceChange = (sku: string, val: string) => {
    setInputValues(prev => ({ ...prev, [sku]: val }))
  }

  const handleResetToDefault = async (sku: string, defaultPrice: number) => {
    handlePriceChange(sku, defaultPrice.toFixed(2))
    if (customerId) {
      await deleteCustomerSkuPriceOverrideAction(customerId, sku)
      setPrices(prev =>
        prev.map(p => (p.sku === sku ? { ...p, customerPrice: defaultPrice, isCustom: false } : p))
      )
    }
  }

  const handleSave = async () => {
    if (!customerId) return
    setSaving(true)
    setErrorMsg("")
    setStatusMsg("")

    const payload: Record<string, number> = {}
    for (const [sku, strVal] of Object.entries(inputValues)) {
      const num = parseFloat(strVal)
      if (!isNaN(num) && num >= 0) {
        payload[sku] = num
      }
    }

    const res = await saveCustomerSkuPricesAction(customerId, payload)
    if (res.success) {
      setStatusMsg("Pricing updated successfully!")
      router.refresh()
      setTimeout(() => {
        onClose()
      }, 1000)
    } else {
      setErrorMsg(res.error || "Failed to save prices")
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-800">
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">Custom SKU Pricing</h3>
              <p className="text-xs text-slate-500">
                {customer?.legalName || "Loading customer..."} ({customer?.customerCode})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
            <p className="mt-3 text-xs font-bold uppercase tracking-wider">Loading price records...</p>
          </div>
        ) : errorMsg ? (
          <div className="p-4 text-center text-rose-600 font-bold text-sm">{errorMsg}</div>
        ) : (
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3 text-xs text-slate-600">
              Enter negotiated unit price (RM) per carton. When warehouse delivers goods to this customer, the system automatically uses these rates.
            </div>

            <div className="space-y-3">
              {prices.map(item => {
                const currentVal = inputValues[item.sku] ?? item.customerPrice.toFixed(2)
                const isDifferentFromDefault = parseFloat(currentVal) !== item.defaultPrice

                return (
                  <div
                    key={item.sku}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 p-3.5 hover:border-cyan-200 transition"
                  >
                    <div>
                      <p className="font-black text-slate-900 text-sm">{item.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-slate-500">
                          Base Price: <strong className="font-mono">RM {item.defaultPrice.toFixed(2)}</strong> / {item.uom}
                        </span>
                        {isDifferentFromDefault ? (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700">
                            Custom Rate
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                            Default
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs font-black text-slate-400">RM</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={currentVal}
                          onChange={e => handlePriceChange(item.sku, e.target.value)}
                          className="w-28 rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-right text-sm font-black text-slate-900 focus:border-cyan-500 focus:outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        title="Reset to default company price"
                        onClick={() => handleResetToDefault(item.sku, item.defaultPrice)}
                        className="rounded-xl border border-slate-200 p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {statusMsg && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-700">
                <CheckCircle2 className="h-4 w-4" /> {statusMsg}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-black text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSave}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-6 py-2.5 text-sm font-black text-white hover:bg-cyan-700 disabled:opacity-60 shadow-sm"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? "Saving..." : "Save Prices"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
