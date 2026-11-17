"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { X, UserPlus, Loader2, CheckCircle2, AlertCircle, Building2, MapPin, Phone, CreditCard, Sparkles } from "lucide-react"

export function AddCustomerModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    description1: "",
    description2: "",
    pic: "",
    fullAddress: "",
    addressLine1: "",
    addressLine2: "",
    addressLine3: "",
    city: "",
    postalCode: "",
    country: "MALAYSIA",
    companyRegistrationNo: "",
    tinNumber: "",
    sstNumber: "",
    customerMiscCode: "",
    emailAddress: "",
    phone1: "",
    phone2: "",
    salesRep1: "",
    salesRep2: "",
    type: "",
    ct: "30 DAYS",
    categoryCode: "Trade Customer",
    newType: "",
    subtype: "",
    region: "",
    remark: "",
  })

  if (!isOpen) return null

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const res = await fetch("/api/sales-ordering/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || "Failed to create customer.")
      }

      setSuccess(`Customer ${json.customer.customerCode} created successfully!`)
      setTimeout(() => {
        onClose()
        router.refresh()
      }, 1200)
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative my-8 w-full max-w-4xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-6 py-4 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-cyan-500/20 p-2 text-cyan-400">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">Manual Customer Entry</h3>
              <p className="text-xs text-slate-400">Customer ID auto-generated upon submit to guarantee zero duplicates</p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm font-bold text-rose-700">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm font-bold text-emerald-700">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Section 1: Customer Identity */}
          <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50">
            <div className="flex items-center gap-2 text-sm font-black text-slate-900 mb-3">
              <Building2 className="h-4 w-4 text-cyan-600" />
              1. Customer Identity & Core Codes
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  Customer ID (Auto-Generated)
                </label>
                <div className="flex items-center gap-2 rounded-lg border border-cyan-200 bg-cyan-50/80 px-3 py-2 text-sm font-black text-cyan-800">
                  <Sparkles className="h-4 w-4 text-cyan-600 shrink-0 animate-pulse" />
                  <span>⚡ Auto-generated on submit (e.g. 3000/XXX)</span>
                </div>
                <span className="text-[10px] text-slate-500">
                  Assigned uniquely upon submit to prevent clashes between concurrent users
                </span>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  Description(1) — Legal Company Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  name="description1"
                  value={formData.description1}
                  onChange={handleChange}
                  placeholder="e.g. CAFE MESRA @MENARA AMBANK"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  Description(2) — Trading / Store Name
                </label>
                <input
                  type="text"
                  name="description2"
                  value={formData.description2}
                  onChange={handleChange}
                  placeholder="e.g. CAFE MESRA"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  Customer Misc Code
                </label>
                <input
                  type="text"
                  name="customerMiscCode"
                  value={formData.customerMiscCode}
                  onChange={handleChange}
                  placeholder="Optional misc reference code"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Address Information */}
          <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50">
            <div className="flex items-center gap-2 text-sm font-black text-slate-900 mb-3">
              <MapPin className="h-4 w-4 text-indigo-600" />
              2. Address Specifications (Max 30 Chars per Line)
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  Address Line 1 (30 char)
                </label>
                <input
                  type="text"
                  maxLength={30}
                  name="addressLine1"
                  value={formData.addressLine1}
                  onChange={handleChange}
                  placeholder="Max 30 chars"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:border-cyan-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 font-mono">{formData.addressLine1.length}/30</span>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  Address Line 2 (30 char)
                </label>
                <input
                  type="text"
                  maxLength={30}
                  name="addressLine2"
                  value={formData.addressLine2}
                  onChange={handleChange}
                  placeholder="Max 30 chars"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:border-cyan-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 font-mono">{formData.addressLine2.length}/30</span>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  Address Line 3 (30 char)
                </label>
                <input
                  type="text"
                  maxLength={30}
                  name="addressLine3"
                  value={formData.addressLine3}
                  onChange={handleChange}
                  placeholder="Max 30 chars"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:border-cyan-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 font-mono">{formData.addressLine3.length}/30</span>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  Postal Code
                </label>
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  placeholder="e.g. 50450"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="e.g. KUALA LUMPUR"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  Country
                </label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="MALAYSIA"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-black text-slate-700 mb-1">
                  Full Address (Optional — auto-generated if left blank)
                </label>
                <input
                  type="text"
                  name="fullAddress"
                  value={formData.fullAddress}
                  onChange={handleChange}
                  placeholder="Leave empty to auto-compose from Lines 1-3 + City + Postal Code"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Contact & Tax Compliance */}
          <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50">
            <div className="flex items-center gap-2 text-sm font-black text-slate-900 mb-3">
              <Phone className="h-4 w-4 text-emerald-600" />
              3. Contact, Tax & e-Invoice Compliance
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  PIC (Person In Charge)
                </label>
                <input
                  type="text"
                  name="pic"
                  value={formData.pic}
                  onChange={handleChange}
                  placeholder="Contact person name"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  Phone No.(1) <span className="text-[10px] text-slate-500">(Digits only)</span>
                </label>
                <input
                  type="text"
                  name="phone1"
                  value={formData.phone1}
                  onChange={handleChange}
                  placeholder="e.g. 0173966240"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  Phone No.(2)
                </label>
                <input
                  type="text"
                  name="phone2"
                  value={formData.phone2}
                  onChange={handleChange}
                  placeholder="Alternate phone"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  Email (e-Invoice Delivery)
                </label>
                <input
                  type="email"
                  name="emailAddress"
                  value={formData.emailAddress}
                  onChange={handleChange}
                  placeholder="finance@customer.com"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  Company Reg No / NRIC / Passport
                </label>
                <input
                  type="text"
                  name="companyRegistrationNo"
                  value={formData.companyRegistrationNo}
                  onChange={handleChange}
                  placeholder="e.g. 202101000123"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  TIN Number
                </label>
                <input
                  type="text"
                  name="tinNumber"
                  value={formData.tinNumber}
                  onChange={handleChange}
                  placeholder="e.g. C25893048010"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  SST Number (If applicable)
                </label>
                <input
                  type="text"
                  name="sstNumber"
                  value={formData.sstNumber}
                  onChange={handleChange}
                  placeholder="e.g. W10-1808-32000012"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Classification, Terms & Sales Reps */}
          <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50">
            <div className="flex items-center gap-2 text-sm font-black text-slate-900 mb-3">
              <CreditCard className="h-4 w-4 text-amber-600" />
              4. Classification, Terms & Sales Attribution
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  Credit Terms (CT)
                </label>
                <input
                  type="text"
                  name="ct"
                  value={formData.ct}
                  onChange={handleChange}
                  placeholder="e.g. 30 DAYS, CASH, COD"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  Type
                </label>
                <input
                  type="text"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  placeholder="e.g. PETROMART"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  NewType
                </label>
                <input
                  type="text"
                  name="newType"
                  value={formData.newType}
                  onChange={handleChange}
                  placeholder="e.g. PETROMART"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  Subtype
                </label>
                <input
                  type="text"
                  name="subtype"
                  value={formData.subtype}
                  onChange={handleChange}
                  placeholder="e.g. PETRONAS"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  Category Code
                </label>
                <input
                  type="text"
                  name="categoryCode"
                  value={formData.categoryCode}
                  onChange={handleChange}
                  placeholder="e.g. Trade Customer"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  Region
                </label>
                <input
                  type="text"
                  name="region"
                  value={formData.region}
                  onChange={handleChange}
                  placeholder="e.g. CENTRAL"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  SALES REP 1
                </label>
                <input
                  type="text"
                  name="salesRep1"
                  value={formData.salesRep1}
                  onChange={handleChange}
                  placeholder="e.g. FAIZ"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  SALES REP 2
                </label>
                <input
                  type="text"
                  name="salesRep2"
                  value={formData.salesRep2}
                  onChange={handleChange}
                  placeholder="e.g. NURIN"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="md:col-span-4">
                <label className="block text-xs font-black text-slate-700 mb-1">
                  REMARK
                </label>
                <input
                  type="text"
                  name="remark"
                  value={formData.remark}
                  onChange={handleChange}
                  placeholder="Optional internal remarks"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer Controls */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-black text-slate-700 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-6 py-2.5 text-sm font-black text-white hover:bg-cyan-500 transition shadow-sm disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving Customer...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" /> Save Customer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
