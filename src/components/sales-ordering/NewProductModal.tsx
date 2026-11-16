"use client"

import { useState } from "react"
import { X, Plus, Save, Loader2, PackagePlus, AlertCircle, CheckCircle2 } from "lucide-react"
import { createProductAction, updateProductDetailsAction } from "@/app/actions/pricing"
import { useRouter } from "next/navigation"

interface ProductModalProps {
  isOpen: boolean
  onClose: () => void
  productToEdit?: {
    sku: string
    name: string
    defaultPrice: number
    uom: string
    category?: string | null
    unitsPerPack?: number | null
    barcode?: string | null
    description?: string | null
    isActive?: boolean
  } | null
}

const COMMON_CATEGORIES = ["Mineral Water", "Flavored Water", "Sparkling Water", "Merchandise", "Finished Goods"]
const COMMON_UOM = ["CTN", "BOX", "PCS", "PACK", "BOTTLE"]

export function NewProductModal({ isOpen, onClose, productToEdit }: ProductModalProps) {
  const router = useRouter()
  const isEditing = Boolean(productToEdit)

  const [sku, setSku] = useState(productToEdit?.sku || "")
  const [name, setName] = useState(productToEdit?.name || "")
  const [defaultPrice, setDefaultPrice] = useState(productToEdit?.defaultPrice ? String(productToEdit.defaultPrice) : "0.00")
  const [uom, setUom] = useState(productToEdit?.uom || "CTN")
  const [category, setCategory] = useState(productToEdit?.category || "Mineral Water")
  const [unitsPerPack, setUnitsPerPack] = useState(productToEdit?.unitsPerPack ? String(productToEdit.unitsPerPack) : "24")
  const [barcode, setBarcode] = useState(productToEdit?.barcode || "")
  const [description, setDescription] = useState(productToEdit?.description || "")
  const [isActive, setIsActive] = useState(productToEdit?.isActive ?? true)

  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  if (!isOpen) return null

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg("")
    setSuccessMsg("")

    if (!sku.trim()) {
      setErrorMsg("Please enter SKU Code.")
      return
    }
    if (!name.trim()) {
      setErrorMsg("Please enter Product Name.")
      return
    }

    const priceNum = parseFloat(defaultPrice)
    if (isNaN(priceNum) || priceNum < 0) {
      setErrorMsg("Please enter a valid base selling price.")
      return
    }

    setSaving(true)

    try {
      if (isEditing) {
        const res = await updateProductDetailsAction(productToEdit!.sku, {
          name,
          defaultPrice: priceNum,
          uom,
          category,
          unitsPerPack: parseInt(unitsPerPack) || 1,
          barcode,
          description,
          isActive,
        })
        if (!res.success) throw new Error(res.error)
        setSuccessMsg("Product updated successfully!")
      } else {
        const res = await createProductAction({
          sku: sku.trim(),
          name: name.trim(),
          defaultPrice: priceNum,
          uom: uom.trim(),
          category: category.trim(),
          unitsPerPack: parseInt(unitsPerPack) || 1,
          barcode: barcode.trim(),
          description: description.trim(),
        })
        if (!res.success) throw new Error(res.error)
        setSuccessMsg("New product created successfully!")
      }

      router.refresh()
      setTimeout(() => {
        onClose()
      }, 900)
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save product.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-800">
              <PackagePlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">
                {isEditing ? "Edit Product Details" : "Setup New Product / SKU"}
              </h3>
              <p className="text-xs text-slate-500">
                {isEditing
                  ? `Updating product ${productToEdit?.sku}`
                  : "Register a new product variant or bottle size into the catalog"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-5 space-y-4">
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-700 border border-rose-200">
              <AlertCircle className="h-4 w-4 shrink-0" /> {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="h-4 w-4 shrink-0" /> {successMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                SKU Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                disabled={isEditing}
                placeholder="e.g. p500_24, BBL-SPARK-330"
                value={sku}
                onChange={e => setSku(e.target.value)}
                className={`w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:border-amber-500 focus:outline-none ${
                  isEditing ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-white"
                }`}
                required
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Unique identifier for inventory & DO</span>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                Category
              </label>
              <input
                type="text"
                list="category-suggestions"
                placeholder="e.g. Mineral Water"
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:border-amber-500 focus:outline-none"
              />
              <datalist id="category-suggestions">
                {COMMON_CATEGORIES.map(c => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
              Product Name / Description <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. BUBBLES O2 500 ML x 24"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:border-amber-500 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                Base Price (RM) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-black text-slate-400">RM</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={defaultPrice}
                  onChange={e => setDefaultPrice(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm font-black text-slate-900 focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                Unit (UOM)
              </label>
              <select
                value={uom}
                onChange={e => setUom(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-bold text-slate-900 focus:border-amber-500 focus:outline-none"
              >
                {COMMON_UOM.map(u => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                Units per Carton
              </label>
              <input
                type="number"
                min="1"
                value={unitsPerPack}
                onChange={e => setUnitsPerPack(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-bold text-slate-900 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
              Barcode / Serial No. (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. 9555123456789"
              value={barcode}
              onChange={e => setBarcode(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-amber-500 focus:outline-none"
            />
          </div>

          {isEditing && (
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <input
                type="checkbox"
                id="is-product-active"
                checked={isActive}
                onChange={e => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
              />
              <label htmlFor="is-product-active" className="text-xs font-bold text-slate-700 cursor-pointer">
                Active Product Status (Appears in warehouse dispatch & pricing lists)
              </label>
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-black text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-6 py-2.5 text-sm font-black text-white hover:bg-amber-700 disabled:opacity-60 shadow-sm"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : isEditing ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {saving ? "Saving..." : isEditing ? "Save Changes" : "Create Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
