"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { FileSpreadsheet, Loader2, Upload, UserPlus, Download, Sparkles, CheckCircle2, AlertCircle } from "lucide-react"
import { AddCustomerModal } from "./AddCustomerModal"

export function CustomerMasterImport() {
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [stage, setStage] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  async function importFile() {
    if (!file) return
    setBusy(true)
    setProgress(0)
    setStage("Reading Excel file...")
    setError("")
    setMessage("")
    try {
      const result = await new Promise<{
        total: number
        created: number
        updated: number
        needsReview: number
        parsedSheets?: string[]
        regularCount?: number
        message?: string
      }>((resolve, reject) => {
        const request = new XMLHttpRequest()
        request.open("POST", "/api/sales-ordering/customers/import")
        request.upload.onprogress = (event) => {
          if (!event.lengthComputable) return
          const uploaded = Math.max(1, Math.round((event.loaded / event.total) * 60))
          setProgress(uploaded)
          setStage(`Uploading file... ${Math.round((event.loaded / event.total) * 100)}%`)
        }
        request.upload.onload = () => {
          setProgress(75)
          setStage("Smart Reader: Detecting columns, analyzing addresses & contact numbers...")
        }
        request.onreadystatechange = () => {
          if (request.readyState !== XMLHttpRequest.HEADERS_RECEIVED) return
          setProgress(90)
          setStage("Saving & updating customer database...")
        }
        request.onload = () => {
          let payload: {
            error?: string
            total?: number
            created?: number
            updated?: number
            needsReview?: number
            parsedSheets?: string[]
            regularCount?: number
            message?: string
          } = {}
          try {
            payload = JSON.parse(request.responseText)
          } catch {
            /* handled below */
          }
          if (request.status < 200 || request.status >= 300) {
            reject(new Error(payload.error || "Import failed"))
            return
          }
          setProgress(100)
          setStage("Import completed!")
          resolve({
            total: payload.total || 0,
            created: payload.created || 0,
            updated: payload.updated || 0,
            needsReview: payload.needsReview || 0,
            parsedSheets: payload.parsedSheets || [],
            regularCount: payload.regularCount || 0,
            message: payload.message,
          })
        }
        request.onerror = () =>
          reject(new Error("Connection interrupted during import. Please try again."))
        const form = new FormData()
        form.append("file", file)
        request.send(form)
      })

      const sheetsInfo = result.parsedSheets?.length ? ` [Sheets: ${result.parsedSheets.join(", ")}]` : ""
      const regularInfo = result.regularCount ? `, ${result.regularCount} Regular Customers` : ""
      setMessage(
        `Successfully processed ${result.total.toLocaleString()} customers${sheetsInfo}: ${result.created.toLocaleString()} new, ${result.updated.toLocaleString()} updated${regularInfo}.`
      )
      setFile(null)
      router.refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Import failed")
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="space-y-4">
        {/* Action Bar: Manual Add + Clean Export + Import */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-black text-white hover:bg-cyan-500 transition shadow-sm"
            >
              <UserPlus className="h-4 w-4" /> Add Customer
            </button>

            <a
              href="/api/sales-ordering/customers/export"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-black text-slate-800 hover:bg-slate-50 transition shadow-sm"
              title="Download Masterlist in exact 30-header structure"
            >
              <Download className="h-4 w-4 text-emerald-600" /> Export Excel
            </a>
          </div>
        </div>

        {/* Import Banner with Smart Reading indicator */}
        <div className="rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50/90 via-indigo-50/70 to-purple-50/80 p-5 shadow-xs">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-black text-violet-950 text-base">
                <FileSpreadsheet className="h-5 w-5 text-violet-600" /> Import Customer Master Data
                <span className="inline-flex items-center gap-1 rounded-full bg-violet-600/10 border border-violet-300 px-2.5 py-0.5 text-[11px] font-bold text-violet-700">
                  <Sparkles className="h-3 w-3 text-violet-600" /> Smart Reading Engine
                </span>
              </div>
              <p className="text-xs text-violet-700 max-w-2xl leading-relaxed">
                Automatically supports flexible Excel formats (including simple lists like <strong>Customer List LWI</strong> and full <strong>30-column Masterlists</strong>). Smartly detects headers across sheets, parses addresses & postcodes, and auto-generates unique Customer IDs without manual formatting.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center shrink-0">
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(event) => setFile(event.target.files?.[0] || null)}
              />
              <button
                type="button"
                disabled={busy}
                onClick={() => inputRef.current?.click()}
                className="rounded-xl border border-violet-300 bg-white px-4 py-2.5 text-xs font-black text-violet-800 disabled:opacity-60 hover:bg-violet-50 transition shadow-2xs"
              >
                {file ? file.name : "Choose Excel File"}
              </button>
              <button
                type="button"
                onClick={importFile}
                disabled={!file || busy}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 py-2.5 text-xs font-black text-white disabled:bg-violet-300 hover:bg-violet-600 transition shadow-sm cursor-pointer"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {busy ? "Importing..." : "Upload & Sync"}
              </button>
            </div>
          </div>

          {busy && (
            <div className="mt-4 pt-3 border-t border-violet-200/80">
              <div className="flex items-center justify-between text-xs font-bold text-violet-900 mb-1.5">
                <span>{stage}</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-violet-200 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-600 to-indigo-600 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {message && (
            <div className="mt-4 flex items-center gap-2.5 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-800">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="mt-4 flex items-center gap-2.5 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-bold text-rose-800">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>

      <AddCustomerModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false)
          router.refresh()
        }}
      />
    </>
  )
}
