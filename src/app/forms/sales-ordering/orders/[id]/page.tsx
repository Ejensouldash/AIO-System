export const dynamic = "force-dynamic"

import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft, Download, FileText, Printer, ShieldCheck } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { canAccessSalesOrderingTab, firstSalesOrderingPath, getSalesOrderingAccess } from "@/lib/sales-ordering/access"

const snapshotText = (value: unknown) =>
  value && typeof value === "object" && "text" in value
    ? String((value as { text?: unknown }).text || "")
    : ""

function formatItemTitle(sku: string | null | undefined, desc: string): string {
  if (sku === "LWI_500_24" || sku === "lwi_500_24") return "LWI BLUE 500ML X 24"
  return desc || sku || "Product Item"
}

export default async function SalesOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const access = await getSalesOrderingAccess()
  if (!access) redirect("/dashboard")
  if (!canAccessSalesOrderingTab(access, "orders")) redirect(firstSalesOrderingPath(access))
  const { id } = await params

  let order = await prisma.salesOrder.findUnique({
    where: { id },
    include: {
      customer: { include: { addresses: true } },
      items: true,
      createdBy: { select: { name: true } },
      sourceDocument: true,
    },
  })
  if (!order) {
    order = await prisma.salesOrder.findUnique({
      where: { sourceDocumentId: id },
      include: {
        customer: { include: { addresses: true } },
        items: true,
        createdBy: { select: { name: true } },
        sourceDocument: true,
      },
    })
  }
  if (!order) notFound()

  const pdfUrl = `/api/sales-ordering/pdf/so/${order.id}`
  const pdfDownloadUrl = `/api/sales-ordering/pdf/so/${order.id}?download=true`

  return (
    <div className="space-y-6">
      {/* Top Navigation & Action Bar */}
      <div>
        <Link
          href="/forms/sales-ordering/orders"
          className="inline-flex items-center gap-1.5 text-xs font-black text-cyan-700 hover:text-cyan-900 transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Sales Orders
        </Link>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-black text-slate-950 font-mono">{order.internalSoNo}</h2>
              <span className="rounded-full bg-emerald-100 border border-emerald-300 px-3.5 py-1 text-xs font-black uppercase text-emerald-800 tracking-wider">
                {order.status}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500 font-medium">
              Created by <strong className="text-slate-800">{order.createdBy.name}</strong> ·{" "}
              {order.createdAt.toLocaleString("en-MY")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href={pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-black text-slate-800 shadow-sm transition hover:bg-slate-900 hover:text-white"
            >
              <Printer className="h-4 w-4 text-slate-500" />
              <span>Print / Preview PDF</span>
            </a>
            <a
              href={pdfDownloadUrl}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-xs font-black text-white shadow-sm transition hover:bg-cyan-500"
            >
              <Download className="h-4 w-4" />
              <span>Download SO (PDF)</span>
            </a>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
        <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
        <div>
          <p className="font-black text-emerald-900">Commercial Sales Order</p>
          <p className="text-xs text-emerald-700 mt-0.5">
            Official commercial draft generated under Langkawi Water Industry Sdn. Bhd. Stock deduction occurs upon warehouse DO dispatch.
          </p>
        </div>
      </div>

      {/* Details Grid */}
      <section className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2">
        <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Customer (Bill To)</p>
          <p className="mt-1 font-black text-slate-950 text-base">{order.customer.legalName}</p>
          <p className="text-xs font-mono font-bold text-cyan-800 mt-0.5">Account: {order.customer.customerCode}</p>
          {order.customer.pic && (
            <p className="text-xs text-slate-600 mt-1 font-medium">Attn: {order.customer.pic} {order.customer.phonePrimary ? `(${order.customer.phonePrimary})` : ""}</p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Order References</p>
          <p className="mt-1 text-sm font-black text-slate-800">
            Customer PO: <span className="font-mono text-cyan-900">{order.poNumber || "-"}</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Customer Ref: {order.customerDocumentNo || "-"}
          </p>
          <p className="text-xs font-bold text-slate-600 mt-1">
            Payment Terms: <span className="text-slate-900 font-black">{order.paymentTermsSnapshot || "CASH / 30 DAYS"}</span>
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Delivery Destination (Ship To)</p>
          <p className="mt-1 whitespace-pre-line text-xs font-bold text-slate-800 leading-relaxed">
            {snapshotText(order.deliveryAddressSnapshot) ||
              order.customer.addresses?.find((a) => a.isDefaultDelivery)?.fullAddress ||
              order.customer.addresses?.[0]?.fullAddress ||
              "-"}
          </p>
          {(order.deliveryContactSnapshot || order.deliveryPhoneSnapshot) && (
            <p className="text-xs text-slate-500 mt-1">
              Contact: {order.deliveryContactSnapshot || "-"} ({order.deliveryPhoneSnapshot || "-"})
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Order Timeline</p>
          <p className="mt-1 text-xs font-semibold text-slate-700">
            Order Date: <strong className="text-slate-950 font-black">{order.orderDate ? new Date(order.orderDate).toLocaleDateString("en-GB") : order.createdAt.toLocaleDateString("en-GB")}</strong>
          </p>
          <p className="text-xs font-semibold text-slate-700 mt-1">
            Req. Delivery: <strong className="text-slate-950 font-black">{order.requestedDeliveryDate ? new Date(order.requestedDeliveryDate).toLocaleDateString("en-GB") : "Standard Delivery"}</strong>
          </p>
          <p className="text-xs font-semibold text-slate-700 mt-1">
            Currency: <strong className="text-slate-950 font-black">{order.currency || "MYR"}</strong>
          </p>
        </div>
      </section>

      {/* Items Table */}
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4 bg-slate-50/80 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-950 uppercase tracking-wider">Ordered Line Items</h3>
            <p className="text-xs text-slate-500 mt-0.5">Commercial products and billing totals</p>
          </div>
          <span className="text-xs font-bold text-slate-500">{order.items.length} line item(s)</span>
        </div>

        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-950 text-xs uppercase tracking-wider text-white">
            <tr>
              <th className="px-5 py-3">#</th>
              <th className="px-5 py-3">Product Item &amp; SKU</th>
              <th className="px-5 py-3 text-center">UOM</th>
              <th className="px-5 py-3 text-right">Quantity</th>
              <th className="px-5 py-3 text-right">Unit Price</th>
              <th className="px-5 py-3 text-right">Line Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {order.items.map((item, index) => (
              <tr key={item.id} className="hover:bg-slate-50/60">
                <td className="px-5 py-4 text-xs font-bold text-slate-400">{index + 1}</td>
                <td className="px-5 py-4">
                  <p className="font-black text-slate-900">{formatItemTitle(item.sku, item.descriptionSnapshot)}</p>
                  <p className="text-xs font-mono font-bold text-cyan-800">{item.sku || item.itemCodeSnapshot || "-"}</p>
                </td>
                <td className="px-5 py-4 text-center font-bold text-slate-600 text-xs">{item.uom}</td>
                <td className="px-5 py-4 text-right font-black text-slate-900">
                  {Number(item.qtyOrdered).toLocaleString("en-MY")}
                </td>
                <td className="px-5 py-4 text-right font-medium text-slate-700">
                  RM {Number(item.unitPrice).toFixed(2)}
                </td>
                <td className="px-5 py-4 text-right font-black text-slate-950">
                  RM {Number(item.lineTotal).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-50 divide-y divide-slate-200">
            <tr>
              <td colSpan={4} className="px-5 py-3"></td>
              <td className="px-5 py-3 text-right text-xs font-bold uppercase text-slate-500">Subtotal</td>
              <td className="px-5 py-3 text-right font-bold text-slate-800">
                RM {Number(order.subtotal).toLocaleString("en-MY", { minimumFractionDigits: 2 })}
              </td>
            </tr>
            {Number(order.discountTotal || 0) > 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-2"></td>
                <td className="px-5 py-2 text-right text-xs font-bold uppercase text-slate-500">Discount</td>
                <td className="px-5 py-2 text-right font-bold text-emerald-700">
                  - RM {Number(order.discountTotal).toLocaleString("en-MY", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            )}
            <tr>
              <td colSpan={4} className="px-5 py-2"></td>
              <td className="px-5 py-2 text-right text-xs font-bold uppercase text-slate-500">Sales Tax / SST (0%)</td>
              <td className="px-5 py-2 text-right font-bold text-slate-800">
                RM {Number(order.taxTotal || 0).toLocaleString("en-MY", { minimumFractionDigits: 2 })}
              </td>
            </tr>
            <tr className="bg-slate-100">
              <td colSpan={4} className="px-5 py-4 text-right font-black text-slate-900">Grand Total</td>
              <td colSpan={2} className="px-5 py-4 text-right text-xl font-black text-emerald-700">
                RM {Number(order.grandTotal).toLocaleString("en-MY", { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tfoot>
        </table>
      </section>
    </div>
  )
}
