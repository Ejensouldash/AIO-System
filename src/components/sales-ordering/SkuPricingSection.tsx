"use client"

import { useState } from "react"
import {
  Tag,
  Coins,
  FileSpreadsheet,
  Upload,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Edit3,
  Layers,
  Sparkles,
  ArrowUpDown,
  PackagePlus,
  Trash2,
  Settings,
} from "lucide-react"
import { updateMasterPriceAction, importCustomerPricesExcelAction, deleteProductAction } from "@/app/actions/pricing"
import { CustomerPricingModal } from "./CustomerPricingModal"
import { NewProductModal } from "./NewProductModal"
import { useRouter } from "next/navigation"

interface SkuPricingSectionProps {
  masterPrices: Array<{
    sku: string
    name: string
    defaultPrice: number
    uom: string
    currency: string
    category?: string | null
    unitsPerPack?: number | null
    barcode?: string | null
    description?: string | null
    isActive?: boolean
  }>
  customers: Array<{
    id: string
    customerCode: string
    legalName: string
    tradingName?: string | null
    customPrices: Record<string, number>
  }>
}

export function SkuPricingSection({
  masterPrices,
  customers,
}: SkuPricingSectionProps) {
  const router = useRouter()
  const [editingCustomer, setEditingCustomer] = useState<string | null>(null)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [selectedProductToEdit, setSelectedProductToEdit] = useState<any>(null)

  const [searchTerm, setSearchTerm] = useState("")
  const [basePrices, setBasePrices] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {}
    for (const mp of masterPrices) {
      map[mp.sku] = mp.defaultPrice
    }
    return map
  })
  const [savingBaseSku, setSavingBaseSku] = useState<string | null>(null)
  const [baseMsg, setBaseMsg] = useState("")

  // Excel upload state
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [importMsg, setImportMsg] = useState("")
  const [importError, setImportError] = useState("")

  const activeMasterPrices = masterPrices.filter(p => p.isActive !== false)

  const filteredCustomers = customers.filter(c => {
    const q = searchTerm.toLowerCase().trim()
    if (!q) return true
    return (
      c.customerCode.toLowerCase().includes(q) ||
      c.legalName.toLowerCase().includes(q) ||
      (c.tradingName && c.tradingName.toLowerCase().includes(q))
    )
  })

  const handleSaveBasePrice = async (sku: string) => {
    setSavingBaseSku(sku)
    setBaseMsg("")
    const price = basePrices[sku]
    const res = await updateMasterPriceAction(sku, price)
    if (res.success) {
      setBaseMsg(`Base price for ${sku} updated!`)
      router.refresh()
      setTimeout(() => setBaseMsg(""), 3000)
    }
    setSavingBaseSku(null)
  }

  const handleDeleteOrDeactivate = async (sku: string, name: string) => {
    if (!confirm(`Are you sure you want to deactivate or delete product "${name}" (${sku})?`)) {
      return
    }

    const res = await deleteProductAction(sku)
    if (res.success) {
      alert(res.message || "Product updated successfully.")
      router.refresh()
    } else {
      alert("Error: " + res.error)
    }
  }

  const handleImportExcel = async () => {
    if (!importFile) return
    setImporting(true)
    setImportMsg("")
    setImportError("")

    const formData = new FormData()
    formData.append("file", importFile)

    const res = await importCustomerPricesExcelAction(formData)
    if (res.success) {
      setImportMsg(res.message || "Excel pricing imported successfully!")
      setImportFile(null)
      router.refresh()
    } else {
      setImportError(res.error || "Import failed.")
    }
    setImporting(false)
  }

  return (
    <div className="space-y-8">
      {/* SECTION 1: GLOBAL BASE SKU PRICING & PRODUCT CATALOG */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Coins className="h-5 w-5 text-amber-500" /> Product Catalog & Company Base Pricing
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Catalog of all active SKUs. You can add new products or set default base prices.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {baseMsg && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                <CheckCircle2 className="h-4 w-4" /> {baseMsg}
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                setSelectedProductToEdit(null)
                setIsProductModalOpen(true)
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 px-4 py-2.5 text-xs font-black text-white transition shadow-sm"
            >
              <PackagePlus className="h-4 w-4" /> Add New Product
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {activeMasterPrices.map(sku => (
            <div
              key={sku.sku}
              className="group relative rounded-2xl border border-slate-200 bg-slate-50/50 p-4 hover:border-amber-300 hover:shadow-sm transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded-md">
                    {sku.sku}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      title="Edit product details"
                      onClick={() => {
                        setSelectedProductToEdit(sku)
                        setIsProductModalOpen(true)
                      }}
                      className="p-1 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-white"
                    >
                      <Settings className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Delete / Deactivate product"
                      onClick={() => handleDeleteOrDeactivate(sku.sku, sku.name)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <p className="font-black text-slate-900 text-sm mt-1.5 line-clamp-2" title={sku.name}>
                  {sku.name}
                </p>

                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400">
                  <span>{sku.category || "Finished Goods"}</span>
                  {sku.unitsPerPack && sku.unitsPerPack > 1 && (
                    <>
                      <span>·</span>
                      <span>{sku.unitsPerPack} units/{sku.uom}</span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="mt-4 pt-3 border-t border-slate-200/60">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-2.5 top-2 text-xs font-black text-slate-400">RM</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={basePrices[sku.sku] ?? sku.defaultPrice}
                      onChange={e =>
                        setBasePrices(prev => ({ ...prev, [sku.sku]: parseFloat(e.target.value) || 0 }))
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white py-1.5 pl-9 pr-2 text-sm font-black text-slate-900 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={savingBaseSku === sku.sku}
                    onClick={() => handleSaveBasePrice(sku.sku)}
                    className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-black text-white hover:bg-slate-800 disabled:opacity-50"
                  >
                    {savingBaseSku === sku.sku ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save"}
                  </button>
                </div>
                <span className="mt-1 block text-[10px] font-semibold text-slate-400 text-right">
                  per {sku.uom}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: EXCEL IMPORT FOR CUSTOMER PRICING */}
      <div className="rounded-2xl border border-cyan-200 bg-cyan-50/60 p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 font-black text-cyan-950">
              <FileSpreadsheet className="h-5 w-5 text-cyan-700" /> Import Customer Price List (Excel)
            </div>
            <p className="mt-1 text-sm text-cyan-800">
              Upload an Excel file to update customer contract prices in bulk.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              id="excel-price-upload"
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={e => setImportFile(e.target.files?.[0] || null)}
            />
            <label
              htmlFor="excel-price-upload"
              className="cursor-pointer rounded-xl border border-cyan-300 bg-white px-4 py-2.5 text-center text-sm font-black text-cyan-900 hover:bg-cyan-50"
            >
              {importFile ? importFile.name : "Choose Excel File"}
            </label>
            <button
              type="button"
              disabled={!importFile || importing}
              onClick={handleImportExcel}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-700 px-5 py-2.5 text-sm font-black text-white hover:bg-cyan-800 disabled:bg-cyan-300 shadow-sm"
            >
              {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {importing ? "Importing..." : "Upload Prices"}
            </button>
          </div>
        </div>

        {importMsg && (
          <p className="mt-3 rounded-xl bg-white p-3 text-xs font-bold text-emerald-700 border border-emerald-200">
            {importMsg}
          </p>
        )}
        {importError && (
          <p className="mt-3 rounded-xl bg-white p-3 text-xs font-bold text-rose-700 border border-rose-200">
            {importError}
          </p>
        )}
      </div>

      {/* SECTION 3: CUSTOMER PRICING MATRIX TABLE */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-black text-slate-900">Customer SKU Pricing Matrix</h3>
            <p className="text-xs text-slate-500">
              Showing {filteredCustomers.length} of {customers.length} customers. Contract prices override base prices.
            </p>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search customer name or ID..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm font-semibold outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-black uppercase tracking-wider text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Customer</th>
                  {activeMasterPrices.map(mp => (
                    <th key={mp.sku} className="px-4 py-3.5 text-center">
                      <span className="font-mono text-slate-900">{mp.sku}</span>
                      <span className="block text-[10px] font-normal text-slate-400 lowercase">
                        base: RM {mp.defaultPrice.toFixed(2)}
                      </span>
                    </th>
                  ))}
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map(cust => (
                  <tr key={cust.id} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-3.5">
                      <p className="font-black text-slate-900">{cust.legalName}</p>
                      <p className="text-xs text-slate-400">{cust.customerCode}</p>
                    </td>

                    {activeMasterPrices.map(mp => {
                      const customPrice = cust.customPrices[mp.sku]
                      const hasCustom = customPrice !== undefined
                      const displayPrice = hasCustom ? customPrice : mp.defaultPrice

                      return (
                        <td key={mp.sku} className="px-4 py-3.5 text-center">
                          <span
                            className={`inline-block font-mono text-xs font-black px-2.5 py-1 rounded-lg ${
                              hasCustom
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : "text-slate-600"
                            }`}
                          >
                            RM {displayPrice.toFixed(2)}
                          </span>
                          {hasCustom && (
                            <span className="block text-[9px] font-black text-emerald-600 uppercase tracking-tighter">
                              Contract
                            </span>
                          )}
                        </td>
                      )
                    })}

                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => setEditingCustomer(cust.id)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-700 hover:border-cyan-500 hover:text-cyan-700 transition shadow-xs"
                      >
                        <Edit3 className="h-3.5 w-3.5" /> Set Prices
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredCustomers.length === 0 && (
                  <tr>
                    <td
                      colSpan={activeMasterPrices.length + 2}
                      className="py-10 text-center text-sm font-semibold text-slate-400"
                    >
                      No matching customer records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL CUSTOMER PRICING */}
      <CustomerPricingModal
        customerId={editingCustomer}
        onClose={() => setEditingCustomer(null)}
      />

      {/* MODAL SETUP NEW / EDIT PRODUCT */}
      <NewProductModal
        isOpen={isProductModalOpen}
        productToEdit={selectedProductToEdit}
        onClose={() => {
          setIsProductModalOpen(false)
          setSelectedProductToEdit(null)
        }}
      />
    </div>
  )
}
